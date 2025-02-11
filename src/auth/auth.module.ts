import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RolesService } from 'src/roles/roles.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth.strategy';
import { UsersService } from 'src/users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/users.schema';
import { Role, RoleSchema } from 'src/roles/roles.schema';
import { AuthController } from './auth.controller';


@Module({
  imports: [
    UsersModule,
    RolesModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {name: Role.name, schema: RoleSchema}
    ]),
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesService, UsersService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
