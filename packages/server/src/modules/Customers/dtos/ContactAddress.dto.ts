import { IsEmail, IsIn, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from '@/common/decorators/Validators';

export class ContactAddressDto {
  @ApiProperty({ required: false, description: 'Fiscal identifier (NIF/CIF/NIE for Spain)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  fiscalNumber?: string;

  @ApiProperty({ required: false, description: 'ISO-3166 alpha-2 fiscal country', example: 'ES' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  fiscalCountry?: string;

  @ApiProperty({ required: false, description: 'Fiscal regime', example: 'standard' })
  @IsOptional()
  @IsString()
  @IsIn(['standard', 'exempt', 'not_subject', 'reverse_charge'])
  taxRegime?: string;

  @ApiProperty({ required: false, description: 'AEAT IDOtro type for non-Spanish fiscal identifiers', example: '02' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  aeatIdType?: string;

  @ApiProperty({ required: false, enum: ['common', 'canary', 'ceuta', 'melilla'] })
  @IsOptional()
  @IsString()
  @IsIn(['common', 'canary', 'ceuta', 'melilla'])
  fiscalTerritory?: string;

  @ApiProperty({ required: false, description: 'IBAN SEPA del tercero' })
  @IsOptional() @IsString() @MaxLength(34)
  sepaIban?: string;

  @ApiProperty({ required: false, description: 'BIC/SWIFT del tercero' })
  @IsOptional() @IsString() @MaxLength(11)
  sepaBic?: string;

  @ApiProperty({ required: false, description: 'Titular de la cuenta SEPA' })
  @IsOptional() @IsString() @MaxLength(255)
  sepaAccountHolder?: string;

  @ApiProperty({
    required: false,
    enum: ['receipt', 'transfer', 'direct-debit', 'negotiable-draft', 'promissory-note', 'cash', 'card', 'other'],
    description: 'Forma de pago comercial por defecto del tercero',
  })
  @IsOptional()
  @IsString()
  @IsIn(['receipt', 'transfer', 'direct-debit', 'negotiable-draft', 'promissory-note', 'cash', 'card', 'other'])
  paymentMethod?: string;

  @ApiProperty({
    required: false,
    description: 'Vencimientos por defecto expresados como días desde la fecha de factura. Ej: 30,60,90',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentTermsDays?: string;

  @ApiProperty({ required: false, enum: ['none', 'face', 'b2b-public', 'b2b-private', 'auto'] })
  @IsOptional()
  @IsString()
  @IsIn(['none', 'face', 'b2b-public', 'b2b-private', 'auto'])
  electronicInvoiceChannel?: string;

  @ApiProperty({ required: false, description: 'Electronic invoicing endpoint or platform identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  electronicInvoiceEndpoint?: string;

  @ApiProperty({ required: false, description: 'Peppol/EDI endpoint identifier when applicable' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  peppolEndpointId?: string;

  @ApiProperty({ required: false, description: 'DIR3 accounting office (role 01)' })
  @IsOptional() @IsString() @MaxLength(20)
  dir3AccountingOffice?: string;

  @ApiProperty({ required: false, description: 'DIR3 management body (role 02)' })
  @IsOptional() @IsString() @MaxLength(20)
  dir3ManagementBody?: string;

  @ApiProperty({ required: false, description: 'DIR3 processing unit (role 03)' })
  @IsOptional() @IsString() @MaxLength(20)
  dir3ProcessingUnit?: string;

  @ApiProperty({ required: false, description: 'DIR3 proposing body (role 04, optional)' })
  @IsOptional() @IsString() @MaxLength(20)
  dir3ProposingBody?: string;

  @ApiProperty({ required: false, description: 'Billing address line 1' })
  @IsOptional()
  @IsString()
  billingAddress1?: string;

  @ApiProperty({ required: false, description: 'Billing address line 2' })
  @IsOptional()
  @IsString()
  billingAddress2?: string;

  @ApiProperty({ required: false, description: 'Billing address city' })
  @IsOptional()
  @IsString()
  billingAddressCity?: string;

  @ApiProperty({ required: false, description: 'Billing address country' })
  @IsOptional()
  @IsString()
  billingAddressCountry?: string;

  @ApiProperty({ required: false, description: 'Billing address email' })
  @IsOptional()
  @IsEmail()
  billingAddressEmail?: string;

  @ApiProperty({ required: false, description: 'Billing address postcode' })
  @IsOptional()
  @IsString()
  billingAddressPostcode?: string;

  @ApiProperty({ required: false, description: 'Billing address phone' })
  @IsOptional()
  @IsString()
  billingAddressPhone?: string;

  @ApiProperty({ required: false, description: 'Billing address state' })
  @IsOptional()
  @IsString()
  billingAddressState?: string;

  @ApiProperty({ required: false, description: 'Shipping address line 1' })
  @IsOptional()
  @IsString()
  shippingAddress1?: string;

  @ApiProperty({ required: false, description: 'Shipping address line 2' })
  @IsOptional()
  @IsString()
  shippingAddress2?: string;

  @ApiProperty({ required: false, description: 'Shipping address city' })
  @IsOptional()
  @IsString()
  shippingAddressCity?: string;

  @ApiProperty({ required: false, description: 'Shipping address country' })
  @IsOptional()
  @IsString()
  shippingAddressCountry?: string;

  @ApiProperty({ required: false, description: 'Shipping address email' })
  @IsOptional()
  @IsEmail()
  shippingAddressEmail?: string;

  @ApiProperty({ required: false, description: 'Shipping address postcode' })
  @IsOptional()
  @IsString()
  shippingAddressPostcode?: string;

  @ApiProperty({ required: false, description: 'Shipping address phone' })
  @IsOptional()
  @IsString()
  shippingAddressPhone?: string;

  @ApiProperty({ required: false, description: 'Shipping address state' })
  @IsOptional()
  @IsString()
  shippingAddressState?: string;
}
