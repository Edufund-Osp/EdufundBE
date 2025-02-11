import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './auth.dto';
import { RolesService } from '../roles/roles.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/users.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly rolesService: RolesService,
  ) {}
  
  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

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
        email,
        password: hashedPassword,
        roles: [donorRole._id],  // Assign "donor" role by default
    });

    await newUser.save();

    return {
        message: 'User registered successfully',
        userId: newUser._id,
    };
}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email, roles: user.roles };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
