import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TickerService } from './ticker.service';
import { KlinesDto } from './dto/klines.dto';

@Controller('ticker')
export class TickerController {
  constructor(private readonly tickerService: TickerService) {}

  @Get('symbols')
  async getSymbols() {
    return await this.tickerService.exchangeInfo();
  }

  @UsePipes(new ValidationPipe())
  @Get('klines')
  async getKlines(@Query() getKlinesDto: KlinesDto) {
    return await this.tickerService.getKlines(
      getKlinesDto.symbols,
      '5m',
      +getKlinesDto.days,
    );
  }

  @Get('pagination')
  async getPagination(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    console.log('page:', page);
    console.log('limit:', limit);
    return await this.tickerService.paginationWithPrices(+limit, +page);
  }
}
