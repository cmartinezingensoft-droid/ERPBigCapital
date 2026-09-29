import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { VERIFACTU_DISPATCH_JOB, VERIFACTU_QUEUE } from './Verifactu.constants';
import { VerifactuJobPayload } from './Verifactu.types';
import { VerifactuSettingsService } from './VerifactuSettings.service';

@Injectable()
export class VerifactuQueueService {
  constructor(
    @InjectQueue(VERIFACTU_QUEUE) private readonly queue: Queue,
    private readonly context: TenancyContext,
    private readonly settings: VerifactuSettingsService,
  ) {}

  async enqueuePending(requestedRecordId?: number): Promise<void> {
    const runtime = await this.settings.getRuntimeConfig();
    if (!runtime.effectiveEnabled) return;
    const payload = (await this.context.getTenantJobPayload()) as VerifactuJobPayload;
    payload.requestedRecordId = requestedRecordId;
    await this.queue.add(VERIFACTU_DISPATCH_JOB, payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
