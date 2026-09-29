import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { TenantModel } from '@/modules/System/models/TenantModel';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { VERIFACTU_QUEUE, VERIFACTU_SWEEP_JOB } from './Verifactu.constants';

/**
 * Recreates tenant sweep jobs periodically from the system database.
 *
 * This closes the failure mode where Redis is unavailable exactly when an
 * invoice commits: the immutable fiscal record and DB outbox survive, and as
 * soon as Redis is available again this scheduler recreates a wake-up job.
 */
@Injectable()
export class VerifactuRecoveryScheduler {
  constructor(
    private readonly config: ConfigService,
    @InjectQueue(VERIFACTU_QUEUE) private readonly queue: Queue,
    @Inject(TenantModel.name) private readonly tenantModel: typeof TenantModel,
    @Inject(UserTenant.name) private readonly userTenantModel: typeof UserTenant,
  ) {}

  @Cron('*/1 * * * *')
  async recoverPendingOutboxes(): Promise<void> {
    // The server flag is the master switch. Tenant-level settings can only
    // enable VERI*FACTU when the deployment explicitly allows it.
    if (!this.config.get<boolean>('verifactu.enabled')) return;

    const tenants = await this.tenantModel
      .query()
      .whereNotNull('initializedAt')
      .whereNotNull('seededAt')
      .where((builder) => builder.whereNull('isDeleting').orWhere('isDeleting', false))
      .where((builder) => builder.whereNull('isInactive').orWhere('isInactive', false));

    const minuteBucket = Math.floor(Date.now() / 60_000);
    for (const tenant of tenants) {
      try {
        const membership = await this.userTenantModel
          .query()
          .where({ tenantId: tenant.id })
          .orderByRaw("CASE WHEN role = 'owner' THEN 0 ELSE 1 END")
          .first();
        if (!membership) continue;

        await this.queue.add(
          VERIFACTU_SWEEP_JOB,
          { organizationId: tenant.organizationId, userId: membership.userId },
          {
            jobId: `verifactu-recovery-${tenant.organizationId}-${minuteBucket}`,
            removeOnComplete: 10,
            removeOnFail: 10,
          },
        );
      } catch (error) {
        // Redis may still be unavailable. The next cron tick retries; the DB
        // outbox remains the source of truth and no fiscal record is lost.
        console.error(
          `VERI*FACTU recovery wake failed for tenant ${tenant.organizationId}:`,
          error,
        );
      }
    }
  }
}
