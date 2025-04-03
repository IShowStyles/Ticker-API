import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
// import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { TickerModule } from './ticker/ticker.module';
import { RedisModule } from './redis/redis.module';
// import { ConfigModule } from '@nestjs/config';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    // ConfigModule.forRoot(),
    // GraphQLModule.forRoot({
    //   driver: ApolloDriver,
    //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    //   sortSchema: true,
    //   cors: {
    //     origin: ['http://localhost:3001', 'http://localhost:5173', '*'],
    //   },
    //   context: ({ req, res }) => ({ req, res }),
    // }),
    // TickerModule,
    // RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
