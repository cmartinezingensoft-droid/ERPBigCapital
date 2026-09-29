import { Module } from '@nestjs/common';
import { TenancyModule } from '@/modules/Tenancy/Tenancy.module';
import { TenancyDatabaseModule } from '@/modules/Tenancy/TenancyDB/TenancyDB.module';
import { SpanishFiscalReportsModule } from '@/modules/SpainFiscalReports/SpanishFiscalReports.module';
import { SiiController } from './Sii.controller';
import { SiiService } from './Sii.service';
import { SiiSettingsService } from './SiiSettings.service';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule, SpanishFiscalReportsModule],
  controllers: [SiiController],
  providers: [SiiService, SiiSettingsService],
  exports: [SiiService, SiiSettingsService],
})
export class SiiModule {}
