import { Args, Int, Query, Resolver, Subscription } from '@nestjs/graphql';
import { TickerService } from './ticker.service';
import { Coins } from './entities/coins.entities';
import { PubSub } from 'graphql-subscriptions';
import { RedisService } from '../redis/redis.service';

@Resolver(() => [Coins]) // Define the type this resolver is associated with
export class TickerResolver {
  constructor(
    private readonly tickerService: TickerService,
    private readonly redisService: RedisService,
  ) {}

  @Query(() => [Coins])
  async paginationWithPrices(
    @Args('limit', { type: () => Int }) limit: number, // Ensure 'Int' is imported from '@nestjs/graphql'
    @Args('page', { type: () => Int }) page: number,
  ): Promise<Coins[]> {
    const prices = await this.tickerService.paginationWithPrices(page, limit);
    return prices.map((price) => ({
      symbol: price.symbol as string,
      price: price.price as number,
    }));
  }

  @Subscription((returns) => [Coins])
  async tickerUpdates(
    @Args('limit', { type: () => Int }) limit: number,
    @Args('page', { type: () => Int }) page: number,
  ) {
    const pubSub = new PubSub();

    // Try to get data from Redis cache first
    const tickerUpdatesCached = await this.redisService.get(
      `tickerUpdates:${page}:${limit}`,
    );
    if (tickerUpdatesCached) {
      return pubSub.asyncIterator('tickerUpdatesCached');
    }

    const prices = await this.tickerService.paginationWithPrices(page, limit);
    const dataPrices = prices.map((price) => ({
      symbol: price.symbol as string,
      price: price.price as number,
    }));
    await this.redisService.set(`tickerUpdates:${page}:${limit}`, dataPrices);
    return pubSub.asyncIterator('tickerUpdates');
  }
}
