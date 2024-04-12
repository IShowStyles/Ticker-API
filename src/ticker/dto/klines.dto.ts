import { IsEnum } from 'class-validator';
import { TickerDaysEnum } from '../enums/days.enum';

export class KlinesDto {
  @IsEnum(TickerDaysEnum)
  days: TickerDaysEnum;
  symbols: string;
}
