import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      // ttl: time to live in milliseconds
      ttl: 60000, // (60k ms = 60 s = 1 minute)
      // limit: How many requests can be made within the ttl time.
      limit: 10, //  Max 10 requests per minute per IP
    }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
