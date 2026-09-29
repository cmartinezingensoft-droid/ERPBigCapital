import { Button, Callout, Intent, Text } from '@blueprintjs/core';
import clsx from 'classnames';
import { ImportStepperStep } from './_types';
import { ImportFileContainer } from './ImportFileContainer';
import styles from './ImportFilePreview.module.scss';
import {
  ImportFilePreviewBootProvider,
  useImportFilePreviewBootContext,
} from './ImportFilePreviewBoot';
import { useImportFileContext } from './ImportFileProvider';
import { AppToaster, Box, Group, Stack } from '@/components';
import { SectionCard, Section } from '@/components/Section';
import { CLASSES } from '@/constants';
import { useImportFileProcess } from '@/hooks/query/import';

export function ImportFilePreview() {
  const { importId } = useImportFileContext();

  return (
    <ImportFilePreviewBootProvider importId={importId}>
      <ImportFilePreviewContent />
    </ImportFilePreviewBootProvider>
  );
}

function ImportFilePreviewContent() {
  const { importPreview } = useImportFilePreviewBootContext();

  return (
    <Box>
      <ImportFileContainer>
        <Stack spacing={20}>
          <Callout
            intent={
              importPreview.createdCount <= 0 ? Intent.DANGER : Intent.NONE
            }
          >
            {importPreview.createdCount} de {importPreview.totalCount} Los registros de tu archivo están listos para importarse.
          </Callout>

          <ImportFilePreviewImported />
          <ImportFilePreviewSkipped />
          <ImportFilePreviewUnmapped />
        </Stack>
      </ImportFileContainer>
      <ImportFilePreviewFloatingActions />
    </Box>
  );
}

function ImportFilePreviewImported() {
  const { importPreview } = useImportFilePreviewBootContext();

  return (
    <Section
      collapseProps={{ defaultIsOpen: false }}
      title={`(${importPreview.createdCount}) Items are ready to import`}
    >
      <SectionCard padded={true}>
        <Text>
          Registros listos para importar - {importPreview.createdCount}
        </Text>
        <ul className={styles.previewList}>
          <li>
            Registros que se crearán: <span>({importPreview.createdCount})</span>
          </li>
          <li>
            Registros que se omitirán: <span>({importPreview.skippedCount})</span>
          </li>
          <li>
            Los registros tienen errores: <span>({importPreview.errorsCount})</span>
          </li>
        </ul>
      </SectionCard>
    </Section>
  );
}

function ImportFilePreviewSkipped() {
  const { importPreview } = useImportFilePreviewBootContext();

  if (importPreview.skippedCount <= 0) return null;

  return (
    <Section
      collapseProps={{ defaultIsOpen: false }}
      collapsible={true}
      title={`(${importPreview.skippedCount}) Items are skipped`}
    >
      <SectionCard padded={true}>
        <table className={clsx('bp4-html-table', styles.skippedTable)}>
          <tbody>
            {importPreview?.errors.map((error, key) => (
              <tr key={key}>
                <td>{error.rowNumber}</td>
                <td>{error.uniqueValue}</td>
                <td>{error.errorMessage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </Section>
  );
}

function ImportFilePreviewUnmapped() {
  const { importPreview } = useImportFilePreviewBootContext();

  if (importPreview?.unmappedColumnsCount <= 0) return null;

  return (
    <Section
      collapseProps={{ defaultIsOpen: false }}
      collapsible={true}
      title={`(${importPreview?.unmappedColumnsCount}) Unmapped Columns`}
    >
      <SectionCard padded={true}>
        <ul className={styles.unmappedList}>
          {importPreview.unmappedColumns?.map((column, key) => (
            <li key={key}>{column}</li>
          ))}
        </ul>
      </SectionCard>
    </Section>
  );
}

function ImportFilePreviewFloatingActions() {
  const { importId, setStep, onImportSuccess, onImportFailed } =
    useImportFileContext();
  const { importPreview } = useImportFilePreviewBootContext();
  const { mutateAsync: importFile, isPending: isImportFileLoading } =
    useImportFileProcess();

  const isValidToImport = importPreview?.createdCount > 0;

  const handleSubmitBtn = () => {
    importFile(importId)
      .then(() => {
        AppToaster.show({
          intent: Intent.SUCCESS,
          message: `The ${importPreview.createdCount} of ${importPreview.totalCount} has imported successfully.`,
        });
        onImportSuccess && onImportSuccess();
      })
      .catch(() => {
        onImportFailed && onImportFailed();
      });
  };
  const handleCancelBtnClick = () => {
    setStep(ImportStepperStep.Mapping);
  };

  return (
    <div className={clsx(CLASSES.PAGE_FORM_FLOATING_ACTIONS)}>
      <Group spacing={10}>
        <Button onClick={handleCancelBtnClick}>Cancelar</Button>
        <Button
          type="submit"
          intent={Intent.PRIMARY}
          loading={isImportFileLoading}
          onClick={handleSubmitBtn}
          disabled={!isValidToImport}
        >
          Importar
        </Button>
      </Group>
    </div>
  );
}
