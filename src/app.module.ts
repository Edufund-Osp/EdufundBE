import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignModule } from './campaign/campaign.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot(),  // Load .env file
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    ThrottlerModule.forRoot([{
      // ttl: time to live in milliseconds
      ttl: 60000, // (60k ms = 60 s = 1 minute)
      // limit: How many requests can be made within the ttl time.
      limit: 10, //  Max 10 requests per minute per IP
    }]),
    UsersModule,
    RolesModule,
    AuthModule,
    CampaignModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
