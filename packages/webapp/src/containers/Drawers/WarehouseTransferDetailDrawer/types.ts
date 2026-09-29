import type { WarehouseTransfer } from '@farocapital/sdk-ts';

export type WarehouseTransferDetailDrawerContextValue = {
  warehouseTransfer: WarehouseTransfer | undefined;
  warehouseTransferId: number | null | undefined;
};
