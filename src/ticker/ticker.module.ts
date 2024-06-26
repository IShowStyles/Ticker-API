import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TickerService } from './ticker.service';
import { TickerController } from './ticker.controller';
import { ConfigModule } from '@nestjs/config';
import { TickerUpdatesGateway } from './ticker-updates.gateway';
import { TickerResolver } from './ticker.resolver';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TickerService, TickerResolver, TickerUpdatesGateway],
  controllers: [TickerController],
})
export class TickerModule {}
