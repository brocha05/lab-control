import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Trim } from '../../shared/http/transforms.js';

/** Body of POST/PATCH for a catalog entry (supplier or cement type). */
export class CatalogEntryDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class CreateHolidayDto {
  /** Date-only, `YYYY-MM-DD`. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class HolidaysQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
