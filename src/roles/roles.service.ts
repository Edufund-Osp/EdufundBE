import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './roles.schema';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

  async findOrCreateRole(roleName: string): Promise<Role> {
    let role = await this.roleModel.findOne({ name: roleName }).exec();

    if (!role) {
      role = new this.roleModel({ name: roleName });
      await role.save();
    }
    
    return role;
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().exec();
  }
}
