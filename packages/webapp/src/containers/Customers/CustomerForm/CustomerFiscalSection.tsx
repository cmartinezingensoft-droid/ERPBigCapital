import { getAllCountries } from '@farocapital/utils';
import { CustomerFormSectionTitle } from './CustomerFormSectionTitle';
import { Box, FFormGroup, FInputGroup, FSelect } from '@/components';
import {
  AEAT_FOREIGN_ID_TYPE_OPTIONS,
  CONTACT_FISCAL_TERRITORY_OPTIONS,
  ELECTRONIC_INVOICE_CHANNEL_OPTIONS,
  FISCAL_REGIME_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '@/constants/spainFiscalOptions';

const countries = getAllCountries();

export function CustomerFiscalSection() {
  return (
    <Box data-section-id="fiscal">
      <CustomerFormSectionTitle>Fiscalidad (España / AEAT)</CustomerFormSectionTitle>

      <FFormGroup
        name={'fiscalNumber'}
        label={'NIF / CIF / NIE'}
        helperText={'Obligatorio para emitir facturas VERI*FACTU a destinatarios españoles.'}
        inline
      >
        <FInputGroup name={'fiscalNumber'} placeholder={'B12345678'} fill />
      </FFormGroup>

      <FFormGroup
        name={'fiscalCountry'}
        label={'País fiscal'}
        helperText={'Seleccione el país fiscal del tercero. Para España se utilizará ES.'}
        inline
      >
        <FSelect
          name={'fiscalCountry'}
          items={countries}
          valueAccessor={'countryCode'}
          textAccessor={'name'}
          popoverProps={{ minimal: true }}
          buttonProps={{ fill: true }}
        />
      </FFormGroup>

      <FFormGroup
        name={'fiscalTerritory'}
        label={'Territorio fiscal'}
        helperText={'Determina si la operación utiliza IVA, IGIC o IPSI.'}
        inline
      >
        <FSelect
          name={'fiscalTerritory'}
          items={CONTACT_FISCAL_TERRITORY_OPTIONS}
          valueAccessor={'key'}
          textAccessor={'label'}
          filterable={false}
          popoverProps={{ minimal: true }}
          buttonProps={{ fill: true }}
        />
      </FFormGroup>

      <FFormGroup name={'sepaIban'} label={'IBAN SEPA'} helperText={'Cuenta bancaria del tercero para transferencias o domiciliaciones.'} inline>
        <FInputGroup name={'sepaIban'} placeholder={'ES9121000418450200051332'} fill />
      </FFormGroup>
      <FFormGroup name={'sepaBic'} label={'BIC / SWIFT'} inline>
        <FInputGroup name={'sepaBic'} placeholder={'CAIXESBBXXX'} fill />
      </FFormGroup>
      <FFormGroup name={'sepaAccountHolder'} label={'Titular de la cuenta SEPA'} inline>
        <FInputGroup name={'sepaAccountHolder'} fill />
      </FFormGroup>

      <FFormGroup
        name={'paymentMethod'}
        label={'Forma de pago'}
        helperText={'Se aplicará por defecto en las facturas de este cliente.'}
        inline
      >
        <FSelect
          name={'paymentMethod'}
          items={PAYMENT_METHOD_OPTIONS}
          valueAccessor={'key'}
          textAccessor={'label'}
          filterable={false}
          popoverProps={{ minimal: true }}
          buttonProps={{ fill: true }}
        />
      </FFormGroup>
      <FFormGroup
        name={'paymentTermsDays'}
        label={'Vencimientos'}
        helperText={'Días desde la fecha de factura separados por coma. Ej: 30 o 30,60,90.'}
        inline
      >
        <FInputGroup name={'paymentTermsDays'} placeholder={'30,60,90'} fill />
      </FFormGroup>

      <FFormGroup
        name={'taxRegime'}
        label={'Régimen fiscal'}
        helperText={'Se aplicará como valor fiscal por defecto del tercero.'}
        inline
      >
        <FSelect
          name={'taxRegime'}
          items={FISCAL_REGIME_OPTIONS}
          valueAccessor={'key'}
          textAccessor={'label'}
          filterable={false}
          popoverProps={{ minimal: true }}
          buttonProps={{ fill: true }}
        />
      </FFormGroup>

      <FFormGroup
        name={'aeatIdType'}
        label={'Tipo de identificación AEAT extranjero'}
        helperText={'Sólo es necesario cuando el tercero se identifica mediante IDOtro.'}
        inline
      >
        <FSelect
          name={'aeatIdType'}
          items={AEAT_FOREIGN_ID_TYPE_OPTIONS}
          valueAccessor={'key'}
          textAccessor={'label'}
          filterable={false}
          popoverProps={{ minimal: true }}
          buttonProps={{ fill: true }}
        />
      </FFormGroup>

      <FFormGroup
        name={'electronicInvoiceChannel'}
        label={'Canal de factura electrónica'}
        helperText={'Selecciona FACe, solución B2B o selección automática.'}
        inline
      >
        <FSelect
          name={'electronicInvoiceChannel'}
          items={ELECTRONIC_INVOICE_CHANNEL_OPTIONS}
          valueAccessor={'key'}
          textAccessor={'label'}
          filterable={false}
          popoverProps={{ minimal: true }}
          buttonProps={{ fill: true }}
        />
      </FFormGroup>
      <FFormGroup name={'electronicInvoiceEndpoint'} label={'Endpoint / plataforma'} inline>
        <FInputGroup name={'electronicInvoiceEndpoint'} placeholder={'Identificador del receptor o plataforma'} fill />
      </FFormGroup>
      <FFormGroup name={'peppolEndpointId'} label={'Peppol / EDI endpoint'} inline>
        <FInputGroup name={'peppolEndpointId'} fill />
      </FFormGroup>
      <FFormGroup name={'dir3AccountingOffice'} label={'DIR3 Oficina contable (01)'} inline>
        <FInputGroup name={'dir3AccountingOffice'} placeholder={'GE0012345'} fill />
      </FFormGroup>
      <FFormGroup name={'dir3ManagementBody'} label={'DIR3 Órgano gestor (02)'} inline>
        <FInputGroup name={'dir3ManagementBody'} placeholder={'GE0012346'} fill />
      </FFormGroup>
      <FFormGroup name={'dir3ProcessingUnit'} label={'DIR3 Unidad tramitadora (03)'} inline>
        <FInputGroup name={'dir3ProcessingUnit'} placeholder={'GE0012347'} fill />
      </FFormGroup>
      <FFormGroup name={'dir3ProposingBody'} label={'DIR3 Órgano proponente (04)'} inline>
        <FInputGroup name={'dir3ProposingBody'} fill />
      </FFormGroup>
    </Box>
  );
}
