import { BadRequestException, Injectable } from '@nestjs/common';
import { catchError, lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TickerData } from './types/data.intefaces';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TickerService {
  readonly API_URL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.API_URL = this.config.get<string>('API_URL');
  }

  async exchangeInfo() {
    const url = `${this.API_URL}/exchangeInfo`;
    const cachedResult = await this.redisService.get(url);
    if (cachedResult) {
      return cachedResult;
    }
    const request$ = this.httpService.get(url).pipe(
      map((resp) => {
        console.log('Response data:', resp.data);
        return resp.data.symbols;
      }),
      map((data) => {
        console.log('Symbols:', data);
        return data.map((symbol) => symbol.symbol);
      }),
      catchError((error) => {
        throw new BadRequestException(
          `Failed to get symbols: ${error.message}`,
        );
      }),
    );
    const result = await lastValueFrom(request$);
    await this.redisService.set(url, result);
    return result;
  }

  async paginationWithPrices(limit: number, page: number) {
    const offset = (page - 1) * limit;
    const symbolsCached = await this.redisService.get<TickerData>(
      `${this.API_URL}/exchangeInfo`,
    );
    if (symbolsCached) {
      console.log(symbolsCached);
      const paginatedSymbols = symbolsCached.slice(offset, offset + limit);
      console.log(paginatedSymbols);
      return await this.getPrices(paginatedSymbols);
    }
    const symbols = await this.exchangeInfo();
    console.log(symbols);
    const paginatedSymbols = symbols.slice(offset, offset + limit);
    console.log(paginatedSymbols);
    return await this.getPrices(paginatedSymbols);
  }

  // for 100 coins to display price
  async getPrices(symbols: string[]) {
    try {
      const url = `${this.API_URL}/ticker/price`;
      console.log(symbols, 'url');
      const symbolsKey = symbols.join(',');
      console.log(symbolsKey);
      const cachedSymbols =
        await this.redisService.get<typeof symbols>(symbolsKey);
      if (cachedSymbols) {
        return cachedSymbols;
      }

      const request$ = this.httpService
        .get(url, {
          params: {
            symbols: JSON.stringify(symbols),
          },
        })
        .pipe(
          map((resp) => resp.data),
          catchError((error) => {
            throw new BadRequestException(
              `Failed to get price: ${error.message}`,
            );
          }),
        );
      const result = await lastValueFrom(request$);
      console.log(result);
      await this.redisService.set(symbolsKey, result);
      return result;
    } catch (error) {
      console.error(`Error in getPrices: ${error.message}`);
      throw new BadRequestException(`Failed to get1 price: ${error.message}`);
    }
  }

  // for single coin to display chart
  async getKlines(symbol: string, interval: string, days: number) {
    console.log('getKlines:', symbol, interval, days);
    const url = `${this.API_URL}/klines`;
    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60 * 1000;
    const request$ = this.httpService
      .get(url, {
        params: {
          symbol,
          interval,
          startTime,
          endTime,
          limit: 500,
        },
      })
      .pipe(
        map((resp) => resp.data),
        // map((data) => {
        //   return data.map((item) => ({
        //     openTime: item[0],
        //     open: item[1],
        //     highPrice: item[2],
        //     lowPrice: item[3],
        //     closePrice: item[4],
        //     volume: item[5],
        //     closeTime: item[6],
        //     quoteAssetVolume: item[7],
        //     numberOfTrades: item[8],
        //     takerBuyBaseAssetVolume: item[9],
        //     takerBuyQuoteAssetVolume: item[10],
        //   }));
        // }),
        catchError((error) => {
          throw new BadRequestException(
            `Failed to data for single coin: ${error.message}`,
          );
        }),
      );
    console.log(await lastValueFrom(request$));
    return await lastValueFrom(request$);
  }
}
