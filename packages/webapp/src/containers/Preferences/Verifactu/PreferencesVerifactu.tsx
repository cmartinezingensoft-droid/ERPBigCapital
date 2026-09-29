import React from 'react';
import {
  Button,
  Callout,
  Card,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Intent,
  Spinner,
  Switch,
} from '@blueprintjs/core';
import styled from 'styled-components';
import type { UpdateVerifactuConfigBody } from '@farocapital/sdk-ts';
import { AppToaster } from '@/components';
import { withDashboardActions } from '@/containers/Dashboard/withDashboardActions';
import type { WithDashboardActionsProps } from '@/containers/Dashboard/withDashboardActions';
import {
  useUpdateVerifactuConfig,
  useValidateVerifactuCertificate,
  useVerifactuConfig,
} from '@/hooks/query/verifactu';
import { compose } from '@/utils';

const emptyForm: Required<UpdateVerifactuConfigBody> = {
  enabled: false,
  environment: 'test',
  siiEnabled: false,
  producerName: 'FaroCapital',
  producerTaxNumber: '',
  systemName: 'FaroCapital',
  systemId: 'BC',
  systemVersion: '1.0.0',
  installationNumber: '1',
};

type Props = Pick<WithDashboardActionsProps, 'changePreferencesPageTitle'>;

function PreferencesVerifactuInner({ changePreferencesPageTitle }: Props) {
  const { data: config, isLoading } = useVerifactuConfig();
  const update = useUpdateVerifactuConfig();
  const validateCertificate = useValidateVerifactuCertificate();
  const [form, setForm] = React.useState(emptyForm);
  const [certificateResult, setCertificateResult] = React.useState<string>();

  React.useEffect(() => {
    changePreferencesPageTitle('Fiscalidad España · VERI*FACTU');
  }, [changePreferencesPageTitle]);

  React.useEffect(() => {
    if (!config) return;
    setForm({
      enabled: Boolean(config.enabled),
      environment: config.environment || 'test',
      siiEnabled: Boolean(config.siiEnabled),
      producerName: config.producerName || 'FaroCapital',
      producerTaxNumber: config.producerTaxNumber || '',
      systemName: config.systemName || 'FaroCapital',
      systemId: config.systemId || 'BC',
      systemVersion: config.systemVersion || '1.0.0',
      installationNumber: config.installationNumber || '1',
    });
  }, [config]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (form.enabled && form.siiEnabled) {
      AppToaster.show({
        intent: Intent.WARNING,
        message: 'SII y VERI*FACTU no pueden operar simultáneamente. VERI*FACTU quedará bloqueado mientras SII esté activo.',
      });
    }
    try {
      await update.mutateAsync(form);
      AppToaster.show({ intent: Intent.SUCCESS, message: 'Configuración VERI*FACTU guardada.' });
    } catch (error) {
      AppToaster.show({
        intent: Intent.DANGER,
        message: error instanceof Error ? error.message : 'No se pudo guardar la configuración.',
      });
    }
  };

  const validate = async () => {
    try {
      const result = await validateCertificate.mutateAsync();
      const message = result.ok
        ? `Certificado válido${result.filename ? `: ${result.filename}` : ''}.`
        : `Certificado no válido: ${result.error || 'error desconocido'}.`;
      setCertificateResult(message);
      AppToaster.show({ intent: result.ok ? Intent.SUCCESS : Intent.DANGER, message });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo validar el certificado.';
      setCertificateResult(message);
      AppToaster.show({ intent: Intent.DANGER, message });
    }
  };

  if (isLoading || !config) {
    return <Loader><Spinner /></Loader>;
  }

  return (
    <Wrapper>
      <SettingsCard>
        <Callout
          intent={config.ready ? Intent.SUCCESS : config.siiEnabled ? Intent.WARNING : Intent.PRIMARY}
          title={config.ready ? 'Integración preparada' : 'Estado de la integración'}
        >
          Interruptor global del servidor: <strong>{config.serverEnabled ? 'activo' : 'desactivado'}</strong>.{' '}
          Entorno efectivo: <strong>{config.environment === 'production' ? 'Producción' : 'Pruebas'}</strong>.{' '}
          Destino: <strong>{config.endpointHost || 'sin configurar'}</strong>.
        </Callout>

        <SectionTitle>Régimen de envío</SectionTitle>
        <Switch
          checked={form.enabled}
          label="Activar VERI*FACTU para esta empresa"
          onChange={(e) => set('enabled', (e.target as HTMLInputElement).checked)}
        />
        <Switch
          checked={form.siiEnabled}
          label="Empresa acogida/obligada al SII"
          onChange={(e) => set('siiEnabled', (e.target as HTMLInputElement).checked)}
        />
        {form.siiEnabled && form.enabled && (
          <Callout intent={Intent.WARNING}>
            Con SII activo FaroCapital conserva la preferencia, pero bloquea los envíos VERI*FACTU para evitar duplicar obligaciones.
          </Callout>
        )}
        {!config.serverEnabled && (
          <Callout intent={Intent.WARNING}>
            Para transmitir a AEAT el administrador debe establecer <code>VERIFACTU_ENABLED=true</code> en el servidor.
          </Callout>
        )}
        <FormGroup label="Entorno AEAT">
          <HTMLSelect
            value={form.environment}
            onChange={(e) => set('environment', e.target.value as 'test' | 'production')}
          >
            <option value="test">Pruebas</option>
            <option value="production">Producción</option>
          </HTMLSelect>
        </FormGroup>

        <SectionTitle>Identificación del sistema de facturación</SectionTitle>
        <Grid>
          <FormGroup label="Productor del software">
            <InputGroup value={form.producerName} onChange={(e) => set('producerName', e.target.value)} />
          </FormGroup>
          <FormGroup label="NIF del productor">
            <InputGroup value={form.producerTaxNumber} onChange={(e) => set('producerTaxNumber', e.target.value.toUpperCase())} />
          </FormGroup>
          <FormGroup label="Nombre del sistema">
            <InputGroup value={form.systemName} onChange={(e) => set('systemName', e.target.value)} />
          </FormGroup>
          <FormGroup label="ID del sistema (máx. 2)">
            <InputGroup maxLength={2} value={form.systemId} onChange={(e) => set('systemId', e.target.value.toUpperCase())} />
          </FormGroup>
          <FormGroup label="Versión">
            <InputGroup value={form.systemVersion} onChange={(e) => set('systemVersion', e.target.value)} />
          </FormGroup>
          <FormGroup label="Número de instalación">
            <InputGroup value={form.installationNumber} onChange={(e) => set('installationNumber', e.target.value)} />
          </FormGroup>
        </Grid>

        <SectionTitle>Certificado electrónico</SectionTitle>
        <Callout intent={config.certificateConfigured && config.certificateFileExists ? Intent.SUCCESS : Intent.WARNING}>
          {config.certificateConfigured
            ? config.certificateFileExists
              ? `Certificado configurado y accesible: ${config.certificateFilename || 'PKCS#12'}.`
              : `La ruta del certificado está configurada (${config.certificateFilename || 'PKCS#12'}), pero el archivo no es accesible por el servidor.`
            : 'No hay certificado PKCS#12 configurado.'}{' '}
          La ruta y la contraseña se mantienen fuera de la base de datos, mediante <code>VERIFACTU_CERTIFICATE_PATH</code> y <code>VERIFACTU_CERTIFICATE_PASSPHRASE</code>.
        </Callout>
        <CertificateActions>
          <Button
            icon="endorsed"
            loading={validateCertificate.isPending}
            disabled={!config.certificateConfigured || !config.certificateFileExists}
            onClick={validate}
          >
            Validar certificado
          </Button>
          {certificateResult && <span>{certificateResult}</span>}
        </CertificateActions>

        <Footer>
          <Button intent={Intent.PRIMARY} loading={update.isPending} onClick={save}>Guardar configuración</Button>
        </Footer>
      </SettingsCard>
    </Wrapper>
  );
}

export const PreferencesVerifactu = compose(withDashboardActions)(PreferencesVerifactuInner);

const Loader = styled.div`padding: 40px; display: flex; justify-content: center;`;
const Wrapper = styled.div`padding: 20px 25px; max-width: 1050px;`;
const SettingsCard = styled(Card)`padding: 25px; display: flex; flex-direction: column; gap: 14px;`;
const SectionTitle = styled.h3`margin: 14px 0 0; padding-bottom: 8px; border-bottom: 1px solid rgba(127,127,127,.25);`;
const Grid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 4px 18px; @media (max-width: 760px) { grid-template-columns: 1fr; }`;
const CertificateActions = styled.div`display: flex; align-items: center; gap: 12px; flex-wrap: wrap;`;
const Footer = styled.div`padding-top: 18px; margin-top: 8px; border-top: 1px solid rgba(127,127,127,.25);`;
