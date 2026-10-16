import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, ValidateNested } from 'class-validator';
import {
  ConcreteProduction,
  FieldRecordStatus,
  LightingCondition,
  SkyCondition,
  SpecimenType,
  StrengthCriterion,
  WindCondition,
} from '../../generated/prisma/client.js';
import {
  DateOnly,
  OptionalBoolean,
  OptionalDecimal,
  OptionalEnum,
  OptionalInt,
  OptionalText,
  OptionalTime,
  OptionalUuid,
} from '../../shared/http/field-validators.js';
import { ListQueryDto } from '../../shared/http/pagination.js';

// Field names and meanings: docs/database/schema.md (FPC01-01). Ranges are sanity
// limits only; the lab gave no acceptance ranges (Q-28).

/** POST /projects/:id/field-records: a new DRAFT. The rest is filled with PUT. */
export class CreateFieldRecordDto {
  @DateOnly()
  pourDate: string;

  /** Omit to take the project's next number (Q-55). */
  @OptionalInt(1, 99_999)
  registrySequence?: number;

  @OptionalInt(1, 99)
  frontNumber?: number;
}

export class SpecimenFormDto {
  /** Consecutive per project (Q-58). */
  @OptionalInt(1, 9_999_999)
  specimenNumber?: number | null;

  /** Reusable physical mold, paired with the specimen by position (A-62). */
  @OptionalText(20)
  moldCode?: string | null;
}

export class SampleFormDto {
  /** Consecutive per project (Q-57). */
  @OptionalInt(1, 9_999_999)
  sampleNumber?: number | null;

  @OptionalEnum(SpecimenType)
  specimenType?: SpecimenType | null;

  /** "Hora de elaboración". */
  @OptionalTime()
  moldedAt?: string | null;

  @IsArray()
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => SpecimenFormDto)
  specimens: SpecimenFormDto[];
}

export class DeliveryFormDto {
  @OptionalText(50)
  ticketNumber?: string | null;

  @OptionalDecimal(2, { min: 0, max: 100 })
  volumeM3?: number | null;

  @OptionalTime()
  plantDepartureTime?: string | null;

  @OptionalTime()
  siteArrivalTime?: string | null;

  @OptionalTime()
  pourStartTime?: string | null;

  @OptionalTime()
  pourEndTime?: string | null;

  @OptionalDecimal(1, { min: -20, max: 80 })
  ambientTemperatureC?: number | null;

  @OptionalDecimal(1, { min: -20, max: 100 })
  concreteTemperatureC?: number | null;

  @OptionalDecimal(1, { min: 0, max: 100 })
  slump1Cm?: number | null;

  /** Only for a repeated test; never averaged (Q-66). */
  @OptionalDecimal(1, { min: 0, max: 100 })
  slump2Cm?: number | null;

  // "Datos de remisión" of this truck (Q-65).
  @OptionalDecimal(1, { min: 0, max: 2000 })
  ticketStrengthKgCm2?: number | null;

  @OptionalDecimal(1, { min: 0, max: 100 })
  ticketSlumpCm?: number | null;

  @OptionalDecimal(1, { min: 0, max: 100 })
  ticketSlumpToleranceCm?: number | null;

  @OptionalDecimal(1, { min: 0, max: 200 })
  ticketMaxAggregateMm?: number | null;

  @OptionalUuid()
  ticketCementTypeId?: string | null;

  @OptionalInt(1, 3650)
  ticketDesignAgeDays?: number | null;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SampleFormDto)
  samples: SampleFormDto[];
}

/**
 * PUT /field-records/:id: the whole FPC01-01 form while DRAFT. Deliveries are numbered
 * by their position in the array (1, 2, 3…), specimens keep their array order.
 */
export class FieldRecordFormDto {
  @OptionalInt(1, 99_999)
  registrySequence?: number | null;

  @OptionalInt(1, 99)
  frontNumber?: number;

  @DateOnly()
  pourDate: string;

  @OptionalUuid()
  supplierId?: string | null;

  @OptionalEnum(ConcreteProduction)
  production?: ConcreteProduction | null;

  @OptionalEnum(StrengthCriterion)
  strengthCriterion?: StrengthCriterion | null;

  @OptionalDecimal(1, { min: 0, max: 2000 })
  specifiedStrengthKgCm2?: number | null;

  @OptionalDecimal(1, { min: 0, max: 100 })
  specifiedSlumpCm?: number | null;

  @OptionalDecimal(1, { min: 0, max: 100 })
  specifiedSlumpToleranceCm?: number | null;

  @OptionalDecimal(1, { min: 0, max: 200 })
  maxAggregateSizeMm?: number | null;

  @OptionalUuid()
  cementTypeId?: string | null;

  /** "Edad definitiva" (Q-74). */
  @OptionalInt(1, 3650)
  designAgeDays?: number | null;

  @OptionalBoolean()
  screened?: boolean | null;

  @OptionalText(50)
  screenMesh?: string | null;

  @OptionalEnum(SkyCondition)
  skyCondition?: SkyCondition | null;

  @OptionalEnum(WindCondition)
  windCondition?: WindCondition | null;

  @OptionalEnum(LightingCondition)
  lightingCondition?: LightingCondition | null;

  @OptionalDecimal(1, { min: 0, max: 100 })
  relativeHumidityPct?: number | null;

  // "Trazabilidad": equipment codes as written.
  @OptionalText(30) thermometerCode?: string | null;
  @OptionalText(30) hygrometerCode?: string | null;
  @OptionalText(30) slumpConeCode?: string | null;
  @OptionalText(30) tapeMeasureCode?: string | null;
  @OptionalText(30) strikeOffBarCode?: string | null;
  @OptionalText(30) slumpRodCode?: string | null;
  @OptionalText(30) samplingRodCode?: string | null;
  @OptionalText(30) wheelbarrowCode?: string | null;

  // Unit weight (NMX-C-162) and air content (NMX-C-157).
  @OptionalText(30) unitWeightScaleCode?: string | null;
  @OptionalText(30) unitWeightMoldCode?: string | null;

  @OptionalDecimal(1, { min: 0, max: 1_000_000 })
  unitWeightTareG?: number | null;

  @OptionalDecimal(1, { min: 0, max: 1_000_000 })
  unitWeightTareSampleG?: number | null;

  @OptionalDecimal(4, { min: 0, max: 1_000_000 })
  unitWeightMoldFactor?: number | null;

  @OptionalText(30) airMeterCode?: string | null;

  @OptionalDecimal(1, { min: 0, max: 100 })
  airContentPct?: number | null;

  @OptionalText(300) programmedElement?: string | null;
  @OptionalText(300) castElement?: string | null;
  @OptionalText(2000) observations?: string | null;
  @OptionalText(200) samplerName?: string | null;

  /** "Visto bueno": usually the client (Q-73). */
  @OptionalText(200) approvedByName?: string | null;

  @IsArray()
  @ArrayMaxSize(70)
  @ValidateNested({ each: true })
  @Type(() => DeliveryFormDto)
  deliveries: DeliveryFormDto[];
}

export class ListFieldRecordsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(Object.values(FieldRecordStatus))
  status?: FieldRecordStatus;
}
