import { ToNumber } from '@/common/decorators/Validators';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CommandTaxRateDto {
  /**
   * Tax rate name.
   */
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the tax rate.', example: 'VAT' })
  name: string;

  /**
   * Tax rate code.
   */
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The code of the tax rate.', example: 'VAT' })
  code: string;

  /**
   * Tax rate percentage.
   */
  @IsNumber()
  @IsNotEmpty()
  @ToNumber()
  @ApiProperty({
    description: 'The rate of the tax rate.',
    example: 10,
  })
  rate: number;

  /**
   * Tax rate description.
   */
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The description of the tax rate.',
    example: 'VAT',
  })
  description?: string;

  /**
   * Whether the tax is non-recoverable.
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @ApiProperty({
    description: 'Whether the tax is non-recoverable.',
    example: false,
  })
  isNonRecoverable?: boolean;

  /**
   * Whether the tax is compound.
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @ApiProperty({
    description: 'Whether the tax is compound.',
    example: false,
  })
  isCompound?: boolean;

  /**
   * Whether the tax rate is active.
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @ApiProperty({
    description: 'Whether the tax rate is active.',
    example: false,
  })
  active?: boolean;
  @IsOptional()
  @IsString()
  @IsIn(['standard', 'exempt', 'not_subject', 'reverse_charge'])
  @ApiProperty({ required: false, example: 'standard' })
  fiscalRegime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ToNumber()
  @ApiProperty({ required: false, example: 5.2 })
  equivalenceSurchargeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ToNumber()
  @ApiProperty({ required: false, example: 15 })
  retentionRate?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '01' })
  aeatTaxCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '01' })
  aeatRegimeKey?: string;

  @IsOptional()
  @IsString()
  @IsIn(['S1', 'S2', 'N1', 'N2'])
  @ApiProperty({ required: false, example: 'S1' })
  aeatOperationQualification?: string;

  @IsOptional()
  @IsString()
  @IsIn(['E1', 'E2', 'E3', 'E4', 'E5', 'E6'])
  @ApiProperty({ required: false, example: 'E1' })
  aeatExemptionCause?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'domestic',
    'intra_community_goods_supply',
    'intra_community_goods_acquisition',
    'intra_community_service_supply',
    'intra_community_service_acquisition',
    'export',
    'import',
    'domestic_reverse_charge',
    'oss',
    'ioss',
    'igic_ipsi',
    'other',
  ])
  @ApiProperty({ required: false, example: 'domestic' })
  spanishOperationType?: string;

  @IsOptional()
  @IsString()
  @IsIn(['union', 'non_union', 'import'])
  @ApiProperty({ required: false, example: 'union' })
  ossScheme?: string;

  @IsOptional()
  @IsString()
  @IsIn(['iva', 'igic', 'ipsi'])
  @ApiProperty({ required: false, example: 'iva' })
  taxTerritory?: string;

}

export class CreateTaxRateDto extends CommandTaxRateDto {}
export class EditTaxRateDto extends CommandTaxRateDto {}
