import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './users.schema';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  _id: Types.ObjectId;
  
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: User | Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  occupation: string;

  @Prop({ required: false })
  contact: string;

  @Prop({ required: true })
  location: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);