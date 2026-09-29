import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class SiiPeriodDto {
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class UpdateSiiConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(['test', 'production'])
  environment?: 'test' | 'production';

  @IsOptional()
  @IsString()
  endpointIssued?: string;

  @IsOptional()
  @IsString()
  endpointReceived?: string;

  @IsOptional()
  @IsString()
  endpointIssuedPayment?: string;

  @IsOptional()
  @IsString()
  endpointReceivedPayment?: string;
}
