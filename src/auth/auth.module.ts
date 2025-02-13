import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RolesService } from 'src/roles/roles.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersService } from 'src/users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/users.schema';
import { Role, RoleSchema } from 'src/roles/roles.schema';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    RolesModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, RolesService, UsersService], // Add GoogleStrategy here
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
