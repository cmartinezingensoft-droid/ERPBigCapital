import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { TenancyModule } from '@/modules/Tenancy/Tenancy.module';
import { TenancyDatabaseModule } from '@/modules/Tenancy/TenancyDB/TenancyDB.module';
import { VERIFACTU_QUEUE } from './Verifactu.constants';
import { VerifactuRecordService } from './VerifactuRecord.service';
import { VerifactuAeatClient } from './VerifactuAeatClient.service';
import { VerifactuDispatcher } from './VerifactuDispatcher.service';
import { VerifactuQueueService } from './VerifactuQueue.service';
import { VerifactuWorkflowService } from './VerifactuWorkflow.service';
import { VerifactuDispatchProcessor } from './processors/VerifactuDispatch.processor';
import { VerifactuInvoiceSubscriber } from './subscribers/VerifactuInvoice.subscriber';
import { VerifactuController } from './Verifactu.controller';
import { VerifactuRecoveryScheduler } from './VerifactuRecoveryScheduler.service';
import { VerifactuSettingsService } from './VerifactuSettings.service';

@Module({
  imports: [
    TenancyModule,
    TenancyDatabaseModule,
    BullModule.registerQueue({ name: VERIFACTU_QUEUE }),
    BullBoardModule.forFeature({ name: VERIFACTU_QUEUE, adapter: BullMQAdapter }),
  ],
  controllers: [VerifactuController],
  providers: [
    VerifactuRecordService,
    VerifactuAeatClient,
    VerifactuDispatcher,
    VerifactuQueueService,
    VerifactuWorkflowService,
    VerifactuDispatchProcessor,
    VerifactuInvoiceSubscriber,
    VerifactuRecoveryScheduler,
    VerifactuSettingsService,
  ],
  exports: [VerifactuRecordService, VerifactuWorkflowService, VerifactuSettingsService],
})
export class VerifactuModule {}
