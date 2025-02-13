import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: false })
  frozen: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
