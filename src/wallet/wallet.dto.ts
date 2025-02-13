import { IsBoolean, IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';
import { Types } from 'mongoose';

export class CreateWalletDto {
  @IsMongoId()
  @IsNotEmpty()
  campaignId: Types.ObjectId;

  @IsNumber()
  balance: number = 0;

  @IsBoolean()
  frozen: boolean = false;
}
