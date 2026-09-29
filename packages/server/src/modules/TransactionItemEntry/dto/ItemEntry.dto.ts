import { ToNumber } from '@/common/decorators/Validators';
import { DiscountType } from '@/common/types/Discount';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemLinkDto } from '@/modules/Items/dtos/ItemLink.dto';

export class ItemEntryDto {
  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: 'The index of the item entry',
    example: 1,
  })
  index: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'The id of the item',
    example: 1,
  })
  itemId: number;

  @ApiProperty({
    description: 'The nested item summary',
    type: ItemLinkDto,
    required: false,
  })
  item?: ItemLinkDto;

  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @ApiProperty({
    description: 'The rate of the item entry',
    example: 1,
  })
  rate: number;

  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @ApiProperty({
    description: 'The quantity of the item entry',
    example: 1,
  })
  quantity: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @ToNumber()
  @ApiProperty({
    description: 'The discount of the item entry',
    example: 1,
  })
  discount?: number;

  @IsOptional()
  @IsEnum(DiscountType)
  @ApiProperty({
    description: 'The type of the discount',
    example: DiscountType.Percentage,
  })
  discountType?: DiscountType = DiscountType.Percentage;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The description of the item entry',
    example: 'This is a description',
  })
  description?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The tax code of the item entry',
    example: '123456',
  })
  taxCode?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'The tax rate id of the item entry',
    example: 1,
  })
  taxRateId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Spanish fiscal regime snapshot', required: false, example: 'standard' })
  fiscalRegime?: string;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @ApiProperty({ description: 'Equivalence surcharge rate snapshot', required: false, example: 5.2 })
  equivalenceSurchargeRate?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @ApiProperty({ description: 'Withholding/IRPF rate snapshot', required: false, example: 15 })
  retentionRate?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'AEAT tax code snapshot', required: false, example: '01' })
  aeatTaxCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'AEAT regime key snapshot', required: false, example: '01' })
  aeatRegimeKey?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'AEAT operation qualification snapshot', required: false, example: 'S1' })
  aeatOperationQualification?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'AEAT exemption cause snapshot', required: false, example: 'E1' })
  aeatExemptionCause?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Spanish advanced operation type snapshot', required: false, example: 'intra_community_goods_supply' })
  spanishOperationType?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'OSS/IOSS scheme snapshot', required: false, example: 'union' })
  ossScheme?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Tax territory snapshot', required: false, example: 'iva' })
  taxTerritory?: string;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @ApiProperty({ description: 'Allocated document discount for this line', required: false, example: 10 })
  documentDiscountAllocation?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @ApiProperty({ description: 'Tax-base component of allocated document discount', required: false, example: 8.26 })
  discountTaxBaseAmount?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @ApiProperty({ description: 'VAT component of allocated document discount', required: false, example: 1.74 })
  discountTaxAmount?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @ApiProperty({ description: 'Allocated document adjustment for this line', required: false, example: 5 })
  documentAdjustmentAllocation?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @ApiProperty({ description: 'Tax-base component of the allocated adjustment', required: false, example: 4.13 })
  adjustmentTaxBaseAmount?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'The warehouse id of the item entry',
    example: 1,
  })
  warehouseId?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'The project id of the item entry',
    example: 1,
  })
  projectId?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'The project ref id of the item entry',
    example: 1,
  })
  projectRefId?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsIn(['TASK', 'BILL', 'EXPENSE'])
  @ApiProperty({
    description: 'The project ref type of the item entry',
    example: 'TASK',
  })
  projectRefType?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'The project ref invoiced amount of the item entry',
    example: 100,
  })
  projectRefInvoicedAmount?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'The sell account id of the item entry',
    example: 1020,
  })
  sellAccountId?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'The cost account id of the item entry',
    example: 1021,
  })
  costAccountId?: number;

  // Formatted fields from transformer
  @ApiProperty({
    description: 'The computed amount of the item entry (quantity * rate)',
    example: 100,
    required: false,
  })
  amount?: number;

  @ApiProperty({
    description: 'Formatted quantity of the item entry',
    example: '12',
    required: false,
  })
  quantityFormatted?: string;

  @ApiProperty({
    description: 'Formatted rate of the item entry',
    example: '$10.00',
    required: false,
  })
  rateFormatted?: string;

  @ApiProperty({
    description: 'Formatted discount amount of the item entry',
    example: '$2.00',
    required: false,
  })
  discountFormatted?: string;

  @ApiProperty({
    description: 'Formatted total of the item entry',
    example: '$118.00',
    required: false,
  })
  totalFormatted?: string;
}
