import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** PATCH /tests/:id/schedule: change one test's age until it is tested (Q-22). */
export class RescheduleTestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  ageDays?: number;

  /** Test on the exact age even on a Sunday or holiday (client requirement, Q-21). */
  @IsOptional()
  @IsBoolean()
  keepExactDate?: boolean;
}
