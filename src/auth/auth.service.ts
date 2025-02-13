import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './auth.dto';
import { RolesService } from '../roles/roles.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/users.schema';
import { Model } from 'mongoose';
import { IsEmail } from 'class-validator';


@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly rolesService: RolesService,
    ) {}
    
    async register(registerDto: RegisterDto) {
        const { name, email, password } = registerDto;

        // Check if user already exists
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Ensure "donor" role exists or create it
        const donorRole = await this.rolesService.findOrCreateRole('donor');

        // Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user directly in AuthService
        const newUser = new this.userModel({
            name,
            email,
            password: hashedPassword,
            roles: [donorRole._id],
        });

        await newUser.save();

        const token = this.generateAccessToken(newUser);

        // ~typescript~: Convert to plain object before removing password
        const userObject = newUser.toObject() as Partial<User>;
        delete userObject.password;
        delete userObject.roles;

        return {
            message: 'User registered successfully',
            user: userObject,
            access_token: token
        };
    }

    // Generate access token
    generateAccessToken(user: User): string {
        const payload = { sub: user._id, email: user.email, roles: user.roles };
        return this.jwtService.sign(payload);
    }

    async login(loginDto: LoginDto) {

        const {email, password} = loginDto;

        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.generateAccessToken(user);

        return {
            user: {
                _id: user?._id,
                name: user?.name,
                email: user?.email,
            },
            access_token: token
        };
    }

    // Login Using Google OAuth2.0
    async loginWithGoogle(user: any) {
        const payload = { sub: user._id, email: user.email, roles: user.roles };
        const token = this.jwtService.sign(payload);
        return { access_token: token };
      }
}
