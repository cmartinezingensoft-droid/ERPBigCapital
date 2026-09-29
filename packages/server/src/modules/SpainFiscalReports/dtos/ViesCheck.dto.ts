import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length } from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

export class ViesCheckDto {
  @ApiProperty({ example: 'FR' })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiProperty({ example: '12345678901' })
  @IsString()
  vatNumber: string;

  @ApiPropertyOptional({ description: 'Customer/vendor contact to store the validation evidence.' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  contactId?: number;
}
