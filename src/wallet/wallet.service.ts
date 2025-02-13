import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './wallet.schema';
import { CreateWalletDto } from './wallet.dto';

@Injectable()
export class WalletService {
  constructor(@InjectModel(Wallet.name) private walletModel: Model<WalletDocument>) {}

  async createWallet(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const wallet = new this.walletModel(createWalletDto);
    return wallet.save();
  }

  async findByCampaignId(campaignId: Types.ObjectId): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({ campaignId }).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this campaign');
    }
    return wallet;
  }
}
