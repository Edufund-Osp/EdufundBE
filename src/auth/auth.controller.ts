import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { AuthGuard } from '@nestjs/passport';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
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
}
