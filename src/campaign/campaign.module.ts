import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Campaign, CampaignSchema } from './campaign.schema';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Campaign.name, schema: CampaignSchema }]),
    WalletModule, // Import WalletModule to use WalletService
  ],
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}
