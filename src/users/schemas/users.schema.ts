import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/roles.schema';


export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  oldPassword: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  roles: Role[] | Types.ObjectId[];

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ required: false, select: false })
  verificationCode: string;

  @Prop({ required: false, default: Date() })
  verificationCodeExpires: Date;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ required: false })
  revertToken: string;

  @Prop({ required: false, default: Date() })
  revertTokenExpires: Date;

  // Tracks password change by timestamps
  @Prop({ type: [{ timestamp: Date }], default: [] })
  passwordChangeAttempts: { timestamp: Date }[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Adding index for better query performance on email verification
UserSchema.index({ email: 1, verificationCode: 1 });

// Adding index for expired verification codes cleanup
UserSchema.index({ verificationCodeExpires: 1 }, { expireAfterSeconds: 0 });
