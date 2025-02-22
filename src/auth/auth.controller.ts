import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, Redirect, Query, BadRequestException, Patch } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto, ChangePasswordDto } from './auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { IsUserGuard } from 'src/guards/is-user/is-user.guard';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { Model } from 'mongoose';


@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto, @Req() req) {
        const ip = req.ip;
        return this.authService.register(registerDto, ip);
    }

    @Post('verify-email')
    @UseGuards(IsUserGuard)
    @HttpCode(200)
    async verifyEmail(
        @Body() verifyEmailDto: VerifyEmailDto,
        @Req() request: Request
    ) {
        // Combine the email from token with OTP from body
        return this.authService.verifyEmail({
            email: request.userEmail,
            otp: verifyEmailDto.otp
        });
    }

    @Post('resend-verification')
    async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
        return this.authService.resendVerificationCode(resendVerificationDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    // Authenctication using Google OAuth2.0
    // Route to initiate the Google login
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleLogin() {
        // The actual login happens here, this route will redirect to Google
    }

    // Callback URL that Google will redirect to after successful authentication
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleLoginCallback(@Req() req: any) {
        // The user's Google profile is automatically attached to the request object
        // You can now generate a JWT token for the user or return user data
        return this.authService.loginWithGoogle(req.user);
    }

    @Post('change-password')
    @UseGuards(IsUserGuard)
    @HttpCode(200)
    async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() request: Request) {
        const email = request.userEmail;
        return this.authService.changePassword(changePasswordDto, email)
    }

    @Get()
    @Redirect('https://yourapp.com/password-reverted') // Redirecting to a success page
    async revertPassword(@Query('token') token: string, @Query('email') email: string) {
        // Finding the user by email
        const user = await this.userModel.findOne({ email })
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verifying the token
        if (user.revertToken !== token || user.revertTokenExpires < new Date()) {
            throw new BadRequestException('Invalid or expired token');
        }

        // Reverting the password to the old password
        user.password = user.oldPassword;
        user.oldPassword = ""; // Clearing the old password
        user.revertToken = ""; // Clearing the revert token
        await user.save();
    }
}
