import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

/** GET /audit-events?entityId=a&entityId=b&before=…&limit=50 */
export class AuditQueryDto {
  /** One or more entity ids (a record and its reports, for instance). */
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown[] =>
    Array.isArray(value) ? (value as unknown[]) : [value],
  )
  @IsArray()
  @IsString({ each: true })
  entityId?: string[];

  /** Page backwards: events strictly before this instant. */
  @IsOptional()
  @IsISO8601()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
