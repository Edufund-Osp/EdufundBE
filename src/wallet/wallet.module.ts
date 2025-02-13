import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './wallet.schema';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService], // Export WalletService so CampaignModule can use it
})
export class WalletModule {}
