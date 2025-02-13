import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/roles.schema';


export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: false, unique: false })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  roles: Role[] | Types.ObjectId[]; 
}

export const UserSchema = SchemaFactory.createForClass(User);
