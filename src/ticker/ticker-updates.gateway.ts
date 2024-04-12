import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TickerService } from './ticker.service';
import { TickerUpdateMessage } from "./types/data.intefaces";

@WebSocketGateway(81, { transports: ['websocket'] })
export class TickerUpdatesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private tickerUpdates$: WebSocketSubject<TickerUpdateMessage>;

  constructor(private readonly tickerService: TickerService) {
    this.tickerUpdates$ = webSocket(this.tickerService.API_URL);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToTicker')
  async handleSubscribeToTicker(
    client: Socket,
    { symbol, days }: { symbol: string; days: number },
  ) {
    const ticker = await this.tickerService.getKlines(symbol, '1m', days);
    client.emit('ticker', ticker);
    this.tickerUpdates$.subscribe(
      (msg) => {
        if (msg.symbol === symbol && msg.interval === '1m') {
          client.emit('ticker', msg);
        }
      },
      (err) =>
        console.error(`Error in handleSubscribeToTicker: ${err.message}`),
    );

    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60 * 1000;
    this.tickerUpdates$.next({
      action: 'start',
      symbol,
      interval: '1m',
      startTime,
      endTime,
      limit: 500,
    });
  }
}
