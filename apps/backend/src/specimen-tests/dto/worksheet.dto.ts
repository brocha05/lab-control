import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** GET /tests/worksheet: the FPC06-01 sheet of one project and test date. */
export class WorksheetQueryDto {
  @IsUUID()
  projectId!: string;

  @Matches(DATE, { message: 'testDate must be YYYY-MM-DD' })
  testDate!: string;
}

/** One specimen's readings at the press (FPC06-01 row). */
export class TestResultRowDto {
  @IsUUID()
  testId!: string;

  /** Time of the break, for the age tolerance. Optional (A-83, Q-89). */
  @IsOptional()
  @Matches(TIME, { message: 'testTime must be HH:MM' })
  testTime?: string | null;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  @Max(999.9)
  height1Cm!: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  @Max(999.9)
  height2Cm!: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  @Max(999.9)
  diameter1Cm!: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  @Max(999.9)
  diameter2Cm!: number;

  /** "Carga máxima registrada — kgf": the press reads kgf (Q-61). */
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  @Max(99_999_999.9)
  maxLoadKgf!: number;

  /** "Tiempo (s)": spot check (Q-63). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  loadDurationS?: number | null;

  /** NMX-C-083 failure pattern 1–6 (Q-60, A-89). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  failureType?: number | null;
}

/** PUT /tests/results: save the readings of one sheet; each row completes its test. */
export class SaveTestResultsDto {
  @Matches(DATE, { message: 'testDate must be YYYY-MM-DD' })
  testDate!: string;

  /** "Prensa", e.g. CCP-PRE-05 (A-88). */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  pressCode?: string | null;

  /** "Dimensiones" instruments, e.g. "CCP-FLX-01, CCP-RME-02". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dimensionEquipment?: string | null;

  @ValidateNested({ each: true })
  @Type(() => TestResultRowDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  rows!: TestResultRowDto[];
}
