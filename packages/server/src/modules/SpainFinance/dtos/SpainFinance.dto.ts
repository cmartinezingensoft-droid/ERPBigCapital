import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Length, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class UpdateSpainFinanceConfigDto {
  @IsOptional() @IsString() @IsIn(['pymes', 'pgc'])
  accountingStandard?: 'pymes' | 'pgc';

  @IsOptional() @IsString() @IsIn(['common', 'canary', 'ceuta', 'melilla'])
  fiscalTerritory?: 'common' | 'canary' | 'ceuta' | 'melilla';
}

export class UpdateSepaBankAccountDto {
  @IsOptional() @IsString() @MaxLength(34) iban?: string;
  @IsOptional() @IsString() @MaxLength(11) bic?: string;
  @IsOptional() @IsString() @MaxLength(255) bankName?: string;
  @IsOptional() @IsString() @MaxLength(255) bankAccountHolder?: string;
  @IsOptional() @IsString() @Length(2, 2) bankCountryCode?: string;
  @IsOptional() @IsString() @MaxLength(35) sepaCreditorIdentifier?: string;
  @IsOptional() @IsBoolean() sepaEnabled?: boolean;
}


export class UpdateContactSepaDto {
  @IsOptional() @IsString() @MaxLength(34) sepaIban?: string;
  @IsOptional() @IsString() @MaxLength(11) sepaBic?: string;
  @IsOptional() @IsString() @MaxLength(255) sepaAccountHolder?: string;
  @IsOptional() @IsString() @IsIn(['common', 'canary', 'ceuta', 'melilla']) fiscalTerritory?: string;
}

export class CreateSepaMandateDto {
  @ApiProperty() @IsInt() contactId: number;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(35) mandateReference: string;
  @IsOptional() @IsString() @IsIn(['CORE', 'B2B']) scheme?: 'CORE' | 'B2B';
  @ApiProperty() @IsString() signatureDate: string;
  @ApiProperty() @IsString() @MaxLength(255) debtorName: string;
  @ApiProperty() @IsString() @MaxLength(34) debtorIban: string;
  @IsOptional() @IsString() @MaxLength(11) debtorBic?: string;
  @IsOptional() @IsString() @Length(2, 2) debtorCountryCode?: string;
}

export class UpdateSepaMandateDto {
  @IsOptional() @IsString() @IsIn(['active', 'suspended', 'cancelled']) status?: string;
  @IsOptional() @IsString() @MaxLength(255) debtorName?: string;
  @IsOptional() @IsString() @MaxLength(34) debtorIban?: string;
  @IsOptional() @IsString() @MaxLength(11) debtorBic?: string;
}

export class SepaRemittanceEntryDto {
  @IsOptional() @IsInt() contactId?: number;
  @IsOptional() @IsInt() mandateId?: number;
  @IsOptional() @IsString() @MaxLength(32) sourceType?: string;
  @IsOptional() @IsInt() sourceId?: number;
  @ApiProperty() @IsString() @MaxLength(255) counterpartyName: string;
  @ApiProperty() @IsString() @MaxLength(34) iban: string;
  @IsOptional() @IsString() @MaxLength(11) bic?: string;
  @IsOptional() @IsString() @Length(2, 2) countryCode?: string;
  @ApiProperty() @IsNumber() @IsPositive() amount: number;
  @IsOptional() @IsString() @MaxLength(35) endToEndId?: string;
  @IsOptional() @IsString() @IsIn(['FRST', 'RCUR', 'OOFF', 'FNAL']) sequenceType?: string;
  @IsOptional() @IsString() @MaxLength(140) remittanceInformation?: string;
}

export class CreateSepaRemittanceDto {
  @IsString() @IsIn(['SCT', 'SDD']) remittanceType: 'SCT' | 'SDD';
  @IsOptional() @IsString() @IsIn(['CORE', 'B2B']) scheme?: 'CORE' | 'B2B';
  @IsInt() accountId: number;
  @IsString() requestedDate: string;
  @IsOptional() @IsString() @MaxLength(35) messageId?: string;
  @IsOptional() @IsString() @MaxLength(65535) note?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SepaRemittanceEntryDto)
  entries: SepaRemittanceEntryDto[];
}

export class PgcReportQueryDto {
  @IsOptional() @IsString() fromDate?: string;
  @IsOptional() @IsString() toDate?: string;
}
