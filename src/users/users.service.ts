import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/users.schema';
import { GetUserDto } from './users.dto';
import { Profile, ProfileDocument } from './schemas/profile.schema';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>
  ) {}

  // notice: Do not use GetUserDto here.
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findProfileByUserId(userId: Types.ObjectId): Promise<ProfileDocument> {
    const profile = await this.profileModel.find({ user: userId });

    if (profile.length > 1) {
      throw new Error('Multiple profiles found for the same user, which should not happen.');
    }

    if (profile.length === 0) {
      throw new Error('Profile not found');
    }

    return profile[0]; // Return the single profile found
  }

  async findOne(getUserDto: GetUserDto): Promise<User | null> {
    const {email} = getUserDto;
    return this.userModel
      .findOne({ email })
      .populate('roles')
      .lean()
      .exec();
  }
}
