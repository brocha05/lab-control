import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../shared/http/pagination.js';
import { Trim, TrimToNull } from '../../shared/http/transforms.js';

export class CreateProjectDto {
  @IsUUID()
  clientId: string;

  /** Official name as printed on the report (FPC06-04 "Proyecto"). Q-78. */
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  /** FPC01-01 "Obra y ubicación", location part. */
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string | null;
}

/** Every field optional; `null` or "" clears `location`. */
export class UpdateProjectDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name?: string;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string | null;
}

/** `?clientId=` filter on top of page/limit/q (q matches name and location). */
export class ListProjectsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
