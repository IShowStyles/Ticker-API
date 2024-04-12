import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis();
  }

  async get(key: string): Promise<string> {
    const data = JSON.parse(await this.redis.get(key));
    return data;
  }

  async set(key: string, value: string): Promise<void> {
    const jsonstr = JSON.stringify(value);
    await this.redis.set(key, jsonstr);
  }
}
