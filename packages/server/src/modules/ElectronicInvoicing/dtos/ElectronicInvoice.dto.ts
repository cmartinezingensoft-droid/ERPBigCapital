import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

export class GenerateElectronicInvoiceDto {
  @ApiProperty({ enum: ['facturae-3.2.2', 'ubl-2.1'] })
  @IsString()
  @IsIn(['facturae-3.2.2', 'ubl-2.1'])
  format: 'facturae-3.2.2' | 'ubl-2.1';

  @ApiProperty({ enum: ['face', 'b2b-public', 'b2b-private'] })
  @IsString()
  @IsIn(['face', 'b2b-public', 'b2b-private'])
  profile: 'face' | 'b2b-public' | 'b2b-private';
}

export class ImportSignedElectronicInvoiceDto {
  @ApiProperty({ description: 'Signed XML payload. For FACe this should be a Facturae XAdES .xsig.' })
  @IsString()
  @IsNotEmpty()
  signedPayload: string;
}

export class UpdateElectronicInvoiceDeliveryDto {
  @ApiProperty({ enum: ['submitted', 'accepted', 'rejected', 'failed'] })
  @IsString()
  @IsIn(['submitted', 'accepted', 'rejected', 'failed'])
  status: 'submitted' | 'accepted' | 'rejected' | 'failed';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalReference?: string;

  @IsOptional()
  @IsString()
  responsePayload?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class CreateElectronicInvoiceStatusEventDto {
  @ApiProperty({
    enum: [
      'commercial_acceptance',
      'commercial_rejection',
      'partial_acceptance',
      'partial_rejection',
      'full_payment',
      'partial_payment',
      'assignment',
    ],
  })
  @IsString()
  @IsIn([
    'commercial_acceptance',
    'commercial_rejection',
    'partial_acceptance',
    'partial_rejection',
    'full_payment',
    'partial_payment',
    'assignment',
  ])
  eventType: string;

  @ApiProperty({ example: '2026-08-29T10:30:00+02:00' })
  @IsDateString()
  eventDate: string;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  assigneeTaxNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assigneeName?: string;

  @IsOptional()
  @IsString()
  payload?: string;
}
