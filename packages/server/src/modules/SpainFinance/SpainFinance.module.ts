import { Module } from '@nestjs/common';
import { TenancyModule } from '@/modules/Tenancy/Tenancy.module';
import { TenancyDatabaseModule } from '@/modules/Tenancy/TenancyDB/TenancyDB.module';
import { SpainFinanceController } from './SpainFinance.controller';
import { SpainFinanceService } from './SpainFinance.service';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule],
  controllers: [SpainFinanceController],
  providers: [SpainFinanceService],
  exports: [SpainFinanceService],
})
export class SpainFinanceModule {}
