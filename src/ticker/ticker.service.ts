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
      const paginatedSymbols = symbolsCached.slice(offset, offset + limit);
      return await this.getPrices(paginatedSymbols);
    }
    const symbols = await this.exchangeInfo();
    const paginatedSymbols = symbols.slice(offset, offset + limit);
    return await this.getPrices(paginatedSymbols);
  }

  // for 100 coins to display price
  async getPrices(symbols: string[]) {
    try {
      const url = `${this.API_URL}/ticker/price`;
      const symbolsKey = JSON.stringify(symbols);
      const cachedResult = await this.redisService.get(symbolsKey);
      if (cachedResult) {
        return cachedResult;
      }

      const request$ = this.httpService
        .get(url, {
          params: {
            symbols: symbolsKey,
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
        catchError((error) => {
          throw new BadRequestException(
            `Failed to data for single coin: ${error.message}`,
          );
        }),
      );
    return await lastValueFrom(request$);
  }
}
