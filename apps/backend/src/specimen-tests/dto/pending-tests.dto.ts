import { IsOptional, IsUUID, Matches } from 'class-validator';

export class PendingTestsQueryDto {
  /** Last scheduled date to include (`YYYY-MM-DD`). Default: 7 days after today. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'until must be YYYY-MM-DD' })
  until?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
