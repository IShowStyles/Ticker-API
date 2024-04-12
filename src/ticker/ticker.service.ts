import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { catchError, lastValueFrom, map, Observable } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TickerService {
  readonly API_URL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    // @Inject('REDIS') private readonly redisClient: Redis,
  ) {
    this.API_URL = this.config.get<string>('API_URL');
  }

  // // get available symbols/pairs
  // exchangeInfo() {
  //   console.log('exchangeInfo');
  //   console.log(this.API_URL);
  //   const url = `${this.API_URL}/exchangeInfo`;
  //   const request$ = this.httpService.get(url).pipe(
  //     map((resp) => resp.data.symbols),
  //     map((data) => data.symbol),
  //     catchError((error) => {
  //       throw new BadRequestException(
  //         `Failed to get symbols: ${error.message}`,
  //       );
  //     }),
  //   );
  //   return lastValueFrom(request$);
  // }

  async exchangeInfo() {
    console.log('exchangeInfo');
    console.log(this.API_URL);
    const url = `${this.API_URL}/exchangeInfo`;
    const cachedResult = await this.redisClient.get(url);
    if (cachedResult) {
      return JSON.parse(cachedResult);
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
    await this.redisClient.set(url, JSON.stringify(result));
    return result;
  }

  async paginationWithPrices(limit: number, page: number) {
    const offset = (page - 1) * limit;
    const symbolsCached = JSON.parse(
      await this.redisClient.get(`${this.API_URL}/exchangeInfo`),
    ) as string[];
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
      const cachedResult = await this.redisClient.get(symbolsKey);
      if (cachedResult) {
        console.log('Cached result:', cachedResult);
        return JSON.parse(cachedResult);
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
      await this.redisClient.set(symbolsKey, JSON.stringify(result));
      return result;
    } catch (error) {
      console.error(`Error in getPrices: ${error.message}`);
      throw new BadRequestException(`Failed to get1 price: ${error.message}`);
    }
  }
  // for single coin to display chart
  async getKlines(symbol: string, interval: string, days: number) {
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
    return lastValueFrom(request$);
  }
}
