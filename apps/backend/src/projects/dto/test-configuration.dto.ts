import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';

export class TestAgeDto {
  /** No closed list of ages (Q-19). */
  @IsInt()
  @Min(1)
  @Max(3650)
  ageDays: number;

  /** Usually 2: an age's result is the average of two specimens (Q-14). */
  @IsInt()
  @Min(1)
  @Max(24)
  specimenCount: number;
}

/** PUT /projects/:id/test-configuration: replaces the project's default test ages. */
export class TestConfigurationDto {
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => TestAgeDto)
  ages: TestAgeDto[];
}
