import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<User>,
    )
    {
        const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    
        if (!clientID || !clientSecret) {
            throw new Error('Missing Google OAuth environment variables');
        }

        super({
            clientID,
            clientSecret,
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });
    }
    
    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const { name, emails, photos } = profile;
        const email = emails[0].value;

        let user = await this.userModel.findOne({ email });
    
        if (!user) {
            // If the user doesn't exist, create one
            user = new this.userModel({
                email,
                firstName: name.givenName,
                lastName: name.familyName,
                password: null,  // Password will be null for Google users
                profilePicture: photos[0].value,
            });
            await user.save();
        }

        done(null, user);  // Return the user object
    }
}
