import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

export class UpdateSpanishFiscalConfigDto {
  @ApiPropertyOptional({ enum: ['monthly', 'quarterly'] })
  @IsOptional()
  @IsIn(['monthly', 'quarterly'])
  vatPeriodicity?: 'monthly' | 'quarterly';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reccEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ossUnionEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ossNonUnionEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  iossEnabled?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  @Max(100)
  inputVatDeductibilityPercent?: number;
}
