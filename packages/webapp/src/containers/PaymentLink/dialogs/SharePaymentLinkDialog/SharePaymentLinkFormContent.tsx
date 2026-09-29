// @ts-nocheck
import {
  Button,
  Classes,
  DialogBody,
  DialogFooter,
  FormGroup,
  InputGroup,
  Intent,
  Position,
  Tooltip,
} from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { useSharePaymentLink } from './SharePaymentLinkProvider';
import {
  DialogFooterActions,
  FDateInput,
  FFormGroup,
  FSelect,
  Icon,
  Stack,
} from '@/components';
import { useDialogContext } from '@/components/Dialog/DialogProvider';
import { useDateInputFormatter } from '@/hooks';
import { useDialogActions } from '@/hooks/state';
import { useClipboard } from '@/hooks/utils/useClipboard';

export function SharePaymentLinkFormContent() {
  const { url } = useSharePaymentLink();
  const { closeDialog } = useDialogActions();
  const { name } = useDialogContext();
  const { isSubmitting } = useFormikContext();

  const clipboard = useClipboard();
  const dateInputFormatter = useDateInputFormatter();

  const handleCopyBtnClick = () => {
    clipboard.copy(url);
  };
  const handleCancelBtnClick = () => {
    closeDialog(name);
  };

  return (
    <>
      <DialogBody>
        <Stack spacing={0}>
          <FFormGroup
            name={'publicity'}
            label={'Visibilidad'}
            style={{ marginBottom: 10 }}
            inline
          >
            <FSelect
              name={'publicity'}
              items={[
                { value: 'private', text: 'Private' },
                { value: 'public', text: 'Public' },
              ]}
              input={({ activeItem, text, label, value }) => (
                <Button
                  text={text || 'Select an item ...'}
                  rightIcon={<Icon icon={'caret-down-16'} iconSize={16} />}
                  minimal
                />
              )}
              searchable={false}
              fastField
            />
          </FFormGroup>

          <p className={Classes.TEXT_MUTED} style={{ marginBottom: 20 }}>
            Selecciona una fecha de caducidad y genera el enlace para compartirlo con tu cliente. Cualquier persona con acceso al enlace podrá ver, imprimir o descargar el documento.
          </p>

          <FFormGroup
            name={'expiryDate'}
            label={'Fecha de caducidad'}
            helperText={
              'De forma predeterminada, el enlace caduca 90 días después de hoy.'
            }
            fastField
          >
            <FDateInput
              name={'expiryDate'}
              popoverProps={{ position: Position.BOTTOM, minimal: true }}
              {...dateInputFormatter}
              inputProps={{
                fill: true,
                style: { minWidth: 260 },
                leftElement: <Icon icon={'date-range'} />,
              }}
              fastField
            />
          </FFormGroup>

          {url && (
            <FormGroup name={'link'} label={'Enlace de pago'}>
              <InputGroup
                name={'link'}
                value={url}
                disabled
                leftElement={
                  <Tooltip content="Copiar al portapapeles" position={Position.TOP}>
                    <Button
                      onClick={handleCopyBtnClick}
                      minimal
                      icon={<Icon icon={'clipboard'} iconSize={16} />}
                    />
                  </Tooltip>
                }
              />
            </FormGroup>
          )}
        </Stack>
      </DialogBody>

      <DialogFooter>
        <DialogFooterActions>
          {url ? (
            <Button intent={Intent.PRIMARY} onClick={handleCopyBtnClick}>
              Copy Link
            </Button>
          ) : (
            <>
              <Button onClick={handleCancelBtnClick}>Cancelar</Button>
              <Button
                type={'submit'}
                intent={Intent.PRIMARY}
                loading={isSubmitting}
                style={{ minWidth: 100 }}
              >
                Generar
              </Button>
            </>
          )}
        </DialogFooterActions>
      </DialogFooter>
    </>
  );
}
