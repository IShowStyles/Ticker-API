import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TickerService } from './ticker.service';
import { TickerUpdateMessage } from './types/data.intefaces';
import { RedisService } from '../redis/redis.service';
global.WebSocket = require('ws');
const WebSocketConstructor = global.WebSocket;

@WebSocketGateway()
export class TickerUpdatesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private clients: Map<string, Socket> = new Map();
  private tickerUpdates$: WebSocketSubject<TickerUpdateMessage>;
  constructor(
    private readonly tickerService: TickerService,
    private readonly redisService: RedisService,
  ) {}

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, client);
  }

  afterInit() {
    console.log('TickerUpdatesGateway initialized');
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
    this.tickerUpdates$?.complete();
  }

  @SubscribeMessage('ticker')
  async handleSubscribeToTicker(
    client: Socket,
    { symbol, days }: { symbol: string; days: number },
  ) {
    const user = this.clients.get(client.id as string);
    if (!user) {
      console.error(`No user found for client ID: ${client.id}`);
      return;
    }

    const tickerCached = await this.redisService.get(
      `ticker:${symbol}:${days}`,
    );
    if (tickerCached) {
      user.emit('ticker', tickerCached);
      return;
    }

    try {
      const newTickerData = await this.tickerService.getKlines(
        symbol,
        '5m',
        days,
      );
      await this.redisService.set(`ticker:${symbol}:${days}`, newTickerData);
      console.log('No cached data found');
      user.emit('ticker', newTickerData);
    } catch (error) {
      console.error(
        `Error retrieving or caching data for symbol: ${symbol}`,
        error,
      );
    }

    user.on('tickerUpdate', (data) => {
      console.log('Received tickerUpdate data:', data);
    });
  }

  @SubscribeMessage('tickerUpdate')
  async handleSubscribeToTickerUpdates(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string },
  ) {
    const { symbol } = data;
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`;

    // Try to get data from Redis cache first
    const tickerUpdatesCached = await this.redisService.get(
      `tickerUpdates:${symbol}`,
    );
    if (tickerUpdatesCached) {
      client.emit('tickerUpdate', tickerUpdatesCached);
      return;
    }

    const tickerUpdates$: WebSocketSubject<any> = webSocket({
      url: wsUrl,
      WebSocketCtor: WebSocketConstructor,
    });

    tickerUpdates$.subscribe(
      async (data) => {
        console.log('Received ticker updates:', data);
        // Cache the ticker updates
        await this.redisService.set(`tickerUpdates:${symbol}`, data);
        client.emit('tickerUpdate', data);
      },
      (err) => {
        console.error(`Error in WebSocket connection: ${err.message}`);
        client.emit('subscriptionError', {
          message: 'WebSocket connection error',
        });
      },
      () => {
        console.log('WebSocket connection closed');
        client.emit('subscriptionClosed', {
          message: 'WebSocket connection closed',
        });
      },
    );
  }
}
