import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema()
export class Role {
  _id: Types.ObjectId;
  
  @Prop({ required: true, unique: true })
  name: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
