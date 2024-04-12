import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TickerService } from './ticker.service';
import { TickerController } from './ticker.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TickerService],
  controllers: [TickerController],
})
export class TickerModule {}
