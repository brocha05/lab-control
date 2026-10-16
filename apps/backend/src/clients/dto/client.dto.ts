import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { RecordCode } from '../../shared/http/record-code.js';
import { Trim, TrimToNull } from '../../shared/http/transforms.js';

export class CreateClientDto {
  /** Legal name, e.g. "MARECOMSA S.A. DE C.V." */
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  /** 3–4 letters, first segment of the report number, e.g. "MAR" (Q-56). Unique per lab. */
  @RecordCode()
  code: string;

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

  @IsOptional()
  @RecordCode()
  code?: string;

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
