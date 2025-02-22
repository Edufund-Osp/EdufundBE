import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/users.schema';

@Injectable()
export class IsAuthenticatedGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('No authentication token provided');
        }

        try {
            // Verify the JWT token
            const payload = await this.jwtService.verifyAsync(token);
            
            // Check if user exists in database
            const user = await this.userModel.findById(payload.sub).exec();
            
            if (!user) {
                throw new UnauthorizedException('User no longer exists');
            }

            if (!user.isActive) {
                throw new UnauthorizedException('User account is inactive');
            }

            // Add user to request object for use in controllers
            request.user = {
                _id: user._id,
                email: user.email,
                roles: user.roles,
                isEmailVerified: user.isEmailVerified,
                isActive: user.isActive
            };

            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid authentication token');
        }
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}