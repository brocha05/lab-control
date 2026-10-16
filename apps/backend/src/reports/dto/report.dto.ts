import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Fields typed by the report author (Q-64). Omitted on create → copied from the
 * project's latest report (A-96). `null` clears a field.
 */
export class ReportFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  mixingEquipment?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  compactionMethod?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mixDesignReference?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  admixture?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string | null;
}

export class ListReportsQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
