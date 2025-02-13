import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';
import { GetUserDto } from './users.dto';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // notice: Do not use GetUserDto here.
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
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
