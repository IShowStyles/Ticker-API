import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis();
  }

  async get<T>(key: string): Promise<T> {
    const data = await this.redis.get(key);
    return JSON.parse(JSON.stringify(data)) as T;
  }

  async set(key: string, value: string): Promise<void> {
    const jsonstr = JSON.stringify(value);
    await this.redis.set(key, jsonstr);
  }
}
