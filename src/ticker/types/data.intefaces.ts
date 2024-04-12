export type TickerData = string[];

export interface TickerUpdateMessage {
  action: string;
  symbol: string;
  interval: string;
  startTime: number;
  endTime: number;
  limit: number;
}
