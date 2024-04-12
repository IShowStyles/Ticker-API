import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { TickerService } from './ticker.service';
import { Coins } from './entities/coins.entities';

@Resolver(() => [Coins]) // Define the type this resolver is associated with
export class TickerResolver {
  constructor(private readonly tickerService: TickerService) {}
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
}
