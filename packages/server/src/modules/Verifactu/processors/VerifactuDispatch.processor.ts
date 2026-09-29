import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Scope } from '@nestjs/common';
import { Job } from 'bullmq';
import { ClsService, UseCls } from 'nestjs-cls';
import { VerifactuDispatcher } from '../VerifactuDispatcher.service';
import { VERIFACTU_QUEUE } from '../Verifactu.constants';
import { VerifactuJobPayload } from '../Verifactu.types';

@Processor({ name: VERIFACTU_QUEUE, scope: Scope.REQUEST })
export class VerifactuDispatchProcessor extends WorkerHost {
  constructor(
    private readonly dispatcher: VerifactuDispatcher,
    private readonly cls: ClsService,
  ) {
    super();
  }

  @UseCls()
  async process(job: Job<VerifactuJobPayload>) {
    this.cls.set('organizationId', job.data.organizationId);
    this.cls.set('userId', job.data.userId);
    return this.dispatcher.processPending(50);
  }
}
