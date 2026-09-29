import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class CreateVerifactuSubsanacionDto {
  @ApiProperty({
    required: false,
    default: false,
    description: 'Marks that AEAT rejected a previous submission of this corrected record.',
  })
  @IsOptional()
  @IsBoolean()
  rejectionPrevious?: boolean;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Refreshes the fiscal classification snapshot of invoice lines from their current tax-rate masters before generating the correction.',
  })
  @IsOptional()
  @IsBoolean()
  refreshTaxClassification?: boolean;
}


export class CreateVerifactuAnulacionDto {
  @ApiProperty({
    required: false,
    default: false,
    description: 'Marks that AEAT rejected a previous cancellation record so a new chained cancellation can be generated.',
  })
  @IsOptional()
  @IsBoolean()
  rejectionPrevious?: boolean;
}
