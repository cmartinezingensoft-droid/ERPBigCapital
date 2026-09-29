import { Module } from '@nestjs/common';
import { TenancyModule } from '@/modules/Tenancy/Tenancy.module';
import { TenancyDatabaseModule } from '@/modules/Tenancy/TenancyDB/TenancyDB.module';
import { SpanishFiscalReportsController } from './SpanishFiscalReports.controller';
import { SpanishFiscalReportsService } from './SpanishFiscalReports.service';
import { SpanishFiscalSettingsService } from './SpanishFiscalSettings.service';
import { SpanishViesService } from './SpanishVies.service';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule],
  controllers: [SpanishFiscalReportsController],
  providers: [SpanishFiscalReportsService, SpanishFiscalSettingsService, SpanishViesService],
  exports: [SpanishFiscalReportsService, SpanishFiscalSettingsService],
})
export class SpanishFiscalReportsModule {}
