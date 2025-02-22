import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto, ChangePasswordDto, ChangePasswordResponse } from '../auth.dto';
import { RolesService } from '../../roles/roles.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../users/schemas/users.schema';
import { Model, Types } from 'mongoose';
import { AuthResponse, JwtPayload, ProfileResponse, UserResponse } from '../auth.types';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { GeoIPService } from './geoip/geoip.service';
import { Profile, ProfileDocument } from 'src/users/schemas/profile.schema';
import { renderTemplate } from 'src/utils/template.util';
import { randomBytes } from 'crypto';


@Injectable()
export class AuthService {

    private readonly transporter: nodemailer.Transporter;
    private readonly EMAIL_TIMEOUT = 30000; // 30 seconds timeout
    private readonly senderEmail: string;
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
        private readonly rolesService: RolesService,
        private readonly configService: ConfigService,
        private readonly geoIPService: GeoIPService,
    ) {
        // Get and validate email configuration
        const emailUser = this.configService.get<string>('GMAIL_USER');
        if (!emailUser) {
            throw new Error('GMAIL_USER is not configured');
        }
        this.senderEmail = emailUser;

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: this.configService.get<string>('GMAIL_APP_PASSWORD')
            }
        });

        this.transporter.verify((error, success) => {
            if (error) {
                console.error('Error with email configuration:', error);
            } else {
                console.log('Email server is ready');
            }
        });
    }


    generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async sendVerificationEmail(
        email: string,
        otp: string,
        company: string,
        userId: string,
      ): Promise<void> {
        // Render the email template using the utility function
        const emailTemplate = renderTemplate('email-verification', {
          otp,
          year: new Date().getFullYear(),
          company,
        });
      
        // Define mail options
        const mailOptions = {
          from: {
            name: company,
            address: this.senderEmail,
          },
          to: email,
          subject: 'Verify Your Email Address | EduFund',
          html: emailTemplate,
        };
      
        try {
          this.logger.log(`Sending verification email to: ${email}`);
      
          // Create a promise that rejects after timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Email sending timeout'));
            }, this.EMAIL_TIMEOUT);
          });
      
          // Race between email sending and timeout
          await Promise.race([this.transporter.sendMail(mailOptions), timeoutPromise]);
      
          this.logger.log(`Verification email sent successfully to: ${email}`);
        } catch (error) {
          this.logger.error(`Failed to send verification email to: ${email}`, error);
      
          // Delete the user account if email fails
          await this.userModel.findByIdAndDelete(userId);
      
          if (error.message === 'Email sending timeout') {
            throw new InternalServerErrorException(
              'Email verification timeout. Please try registering again.',
            );
          }
      
          throw new BadRequestException(
            'Failed to send verification email. Please try registering again.',
          );
        }
    }

    async register(registerDto: RegisterDto, ip: string): Promise<AuthResponse> {
        const { name, email, password, roles = [] } = registerDto;
    
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }
    
        const validRoles = ["admin", "organization", "donor"];
        const filteredRoles = roles.filter(role => validRoles.includes(role));
    
        if (roles.length && filteredRoles.length !== roles.length) {
            throw new ConflictException('Invalid role(s) provided');
        }
    
        if (!filteredRoles.includes("donor")) {
            filteredRoles.push("donor");
        }

        if (filteredRoles.includes("organization") && !name) {
            throw new ConflictException('Name is required when registering as an organization');
        }

        // Fetch location using the GeoIP service
        let location: string;
        try {
            location = await this.geoIPService.getLocation(ip);
        } catch (error) {
            throw new ConflictException('Unable to determine location. Please try again later.');
        }

        // Enforce location constraint for organizations
        if (filteredRoles.includes('organization') && (!location.endsWith('Nigeria') || (!location.toUpperCase().endsWith('NG')))) {
            throw new ConflictException('This user must be located in Nigeria');
        }

        const roleDocuments = await Promise.all(
            filteredRoles.map(role => this.rolesService.findOrCreateRole(role))
        );
        const roleIds = roleDocuments.map(role => role._id);
    
        const otp = this.generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setHours(otpExpiry.getHours() + 1);

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new this.userModel({
            email,
            password: hashedPassword,
            roles: roleIds,
            isEmailVerified: false,
            verificationCode: otp,
            verificationCodeExpires: otpExpiry,
            isActive: false
        });

        await newUser.save();

        const newProfile = new this.profileModel({
            user: newUser._id,
            name,
            occupation: registerDto.occupation,
            contact: registerDto.contact,
            location
        });
      
        await newProfile.save();

        try {
            await this.sendVerificationEmail(email, otp, "EduFund", newUser._id.toString());
        } catch (error) {
            // The error handling and account deletion is done in sendVerificationEmail
            throw error;
        }

        // Generate access token for new user
        const token = this.generateAccessToken(newUser);
    
        const userResponse: UserResponse = {
            _id: newUser._id,
            email: newUser.email,
            isEmailVerified: false,
            isActive: false
        };

        const profileResponse: ProfileResponse = {
            _id: newProfile._id,
            name: newProfile.name,
            location: newProfile.location,
            contact: newProfile.contact
        }

        const _data = {
            ...userResponse,
            profile: profileResponse
        }
    
        return {
            message: 'Registration successful. Please check your email for verification code.',
            user: _data,
            access_token: token
        };
    }

    // 
    // Verify Email Function
    //
    async verifyEmail(data: { email: string; otp: string }): Promise<AuthResponse> {
        const { email, otp } = data;
        const user = await this.userModel.findOne({ email }).select('+verificationCode');

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email already verified');
        }

        if (user.verificationCode !== otp) {
            throw new BadRequestException('Invalid verification code');
        }

        if (new Date() > user.verificationCodeExpires) {
            throw new BadRequestException('Verification code expired');
        }

        // Update user document
        user.isEmailVerified = true;
        user.isActive = true;
        await user.save();

        return {
            message: 'Email verified successfully'
        };
    }

    async login(loginDto: LoginDto): Promise<AuthResponse> {
        const { email, password } = loginDto;

        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isEmailVerified) {
            throw new UnauthorizedException('Please verify your email first');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Convert User to UserDocument
        const userDoc = await this.userModel.findById(user._id);
        if (!userDoc) {
            throw new UnauthorizedException('User not found');
        }

        const profile = await this.usersService.findProfileByUserId(userDoc._id)

        const userResponse: UserResponse = {
            _id: user._id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive
        }

        const profileResponse: ProfileResponse = {
            _id: profile._id,
            name: profile.name,
            location: profile.location,
            contact: profile.contact
        }

        const _data = {
            ...userResponse,
            profile: profileResponse
        }

        const token = this.generateAccessToken(userDoc);

        return {
            message: 'Login successful',
            user: _data,
            access_token: token
        };
    }

    generateAccessToken(user: UserDocument): string {
        const payload: JwtPayload = {
            sub: user._id,
            email: user.email,
            roles: user.roles as Types.ObjectId[]
        };
        return this.jwtService.sign(payload);
    }

    async loginWithGoogle(user: UserDocument): Promise<AuthResponse> {
        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            user.isActive = true;
            await this.userModel.findByIdAndUpdate(user._id, {
                isEmailVerified: true,
                isActive: true
            });
        }

        const profile = await this.usersService.findProfileByUserId(user._id)

        const userResponse: UserResponse = {
            _id: user._id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive
        }

        const profileResponse: ProfileResponse = {
            _id: profile._id,
            name: profile.name,
            location: profile.location,
            contact: profile.contact
        }

        const _data = {
            ...userResponse,
            profile: profileResponse
        }
        
        const token = this.generateAccessToken(user);
        
        return {
            message: 'Login successful',
            user: _data,
            access_token: token
        };
    }

    async resendVerificationCode(resendDto: ResendVerificationDto): Promise<AuthResponse> {
        const { email } = resendDto;
        const user = await this.userModel.findOne({ email });
        
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email already verified');
        }

        const otp = this.generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setHours(otpExpiry.getHours() + 1);

        user.verificationCode = otp;
        user.verificationCodeExpires = otpExpiry;
        await user.save();

        await this.sendVerificationEmail(email, otp, "EduFund",  Object(user._id));

        return {
            message: 'New verification code sent successfully'
        };
    }

    async changePassword(changePasswordDto: ChangePasswordDto, email: string): Promise<ChangePasswordResponse> {
        const { oldPassword, newPassword } = changePasswordDto;

        this.logger.log(`Changing password for user: ${email}`);
      
        // Finding the user by email
        const user = await this.userModel.findOne({ email })
        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }
      
        // Checking if the user's email is verified
        if (!user.isEmailVerified) {
          throw new UnauthorizedException('Please verify your email first');
        }
      
        // Verifying the old password
        try {
            // Validate oldPassword and user.password
            if (!oldPassword || !user.password) {
                throw new UnauthorizedException('Invalid password data');
            }
          
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordValid) {
              throw new UnauthorizedException('Incorrect password');
            }
        } catch (err) {
            this.logger.error(`Error in comparing passwords: ${err}`);
            throw new UnauthorizedException('Incorrect password');
        }

        // Preventing reusing the old password
        if (oldPassword === newPassword) {
            throw new BadRequestException('New password must be different from the old password');
        }

        // Check password change attempts in the last 3 days
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const recentAttempts = user.passwordChangeAttempts.filter(
            (attempt) => attempt.timestamp >= threeDaysAgo,
        );

        if (recentAttempts.length >= 3) {
            throw new BadRequestException('You have exceeded the maximum number of password changes in 3 days');
        }
      
        // Hashing the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
      
        // Updating the user's password
        user.oldPassword = user.password;
        user.password = hashedPassword;

        // Generating a revert token
        const revertToken = randomBytes(32).toString('hex');
        user.revertToken = revertToken;
        user.revertTokenExpires = new Date(Date.now() + 3600000);

        // Adding the current attempt to the list
        user.passwordChangeAttempts.push({ timestamp: new Date() });

        await user.save();

        // Sending an email with the revert link
        await this.sendRevertPasswordEmail(email, revertToken);
      
        // Returning success response
        return {
          message: 'Password changed successfully',
        };
    }

    private async sendRevertPasswordEmail(email: string, revertToken: string): Promise<void> {
        const revertLink = `https://yourapp.com/revert-password?token=${revertToken}&email=${email}`;
      
        // Render the email template using the utility function
        const emailTemplate = renderTemplate('revert-password', {
            email,
            year: new Date().getFullYear(),
            revertLink: revertLink,
        });

        const mailOptions = {
          from: {
            name: 'EduFund',
            address: this.senderEmail,
          },
          to: email,
          subject: 'Password Change Confirmation',
          html: emailTemplate,
        };
      
        try {
          await this.transporter.sendMail(mailOptions);
          this.logger.log(`Revert password email sent to: ${email}`);
        } catch (error) {
          this.logger.error(`Failed to send revert password email to: ${email}`, error);
          throw new InternalServerErrorException('Failed to send revert password email');
        }
    }
}
