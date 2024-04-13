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
global.WebSocket = require('ws');
const WebSocketConstructor = global.WebSocket;

@WebSocketGateway()
export class TickerUpdatesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private clients: Map<string, Socket> = new Map();
  private tickerUpdates$: WebSocketSubject<TickerUpdateMessage>;
  constructor(private readonly tickerService: TickerService) {}

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
    try {
      console.log(
        `Client ${client.id} subscribed to ticker: ${symbol}` +
          ` for the last ${days} days`,
      );
      const ticker = await this.tickerService.getKlines(symbol, '5m', days);
      console.log(ticker);
      const user = this.clients.get(client.id as string);
      if (user) {
        user.emit('ticker', ticker);
        user.on('tickerUpdate', (data) => {
          console.log('Received tickerUpdate data:', data);
        });
      }
    } catch (error) {
      console.error(`Error in handleSubscribeToTicker: ${error.message}`);
      client.emit('subscriptionError', {
        message: `Error retrieving data for symbol: ${symbol}`,
      });
    }
  }

  @SubscribeMessage('tickerUpdate')
  handleSubscribeToTickerUpdates(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string },
  ) {
    const { symbol } = data;
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`;

    // const tickerUpdates$ = webSocket<TickerUpdateMessage>({
    //   url: wsUrl,
    // });

    const tickerUpdates$: WebSocketSubject<any> = webSocket({
      url: wsUrl,
      WebSocketCtor: WebSocketConstructor,
    });

    tickerUpdates$.subscribe(
      (data) => {
        console.log('Received ticker updates:', data);
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
