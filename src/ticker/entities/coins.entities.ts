import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Coins {
  @Field() symbol: string;
  @Field(() => Int) price: number;
}
