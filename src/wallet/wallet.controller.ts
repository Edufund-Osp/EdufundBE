import { Controller, Get, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Types } from 'mongoose';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':campaignId')
  async findByCampaignId(@Param('campaignId') campaignId: string) {
    return this.walletService.findByCampaignId(new Types.ObjectId(campaignId));
  }
}
