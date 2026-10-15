import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim, TrimToNull } from '../../shared/http/transforms.js';

export class CreateClientDto {
  /** Legal name, e.g. "MARECOMSA S.A. DE C.V." */
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  /** ASSUMPTION A-70: the report's "Contacto" belongs to the client. */
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string | null;
}

/** Every field optional; `null` or "" clears an optional field. */
export class UpdateClientDto {
  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string | null;
}
