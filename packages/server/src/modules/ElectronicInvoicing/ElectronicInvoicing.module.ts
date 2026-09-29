import { Module } from '@nestjs/common';
import { TenancyModule } from '@/modules/Tenancy/Tenancy.module';
import { TenancyDatabaseModule } from '@/modules/Tenancy/TenancyDB/TenancyDB.module';
import { ElectronicInvoicingController } from './ElectronicInvoicing.controller';
import { ElectronicInvoicingService } from './ElectronicInvoicing.service';
import { ElectronicInvoiceBuilderService } from './ElectronicInvoiceBuilder.service';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule],
  controllers: [ElectronicInvoicingController],
  providers: [ElectronicInvoicingService, ElectronicInvoiceBuilderService],
  exports: [ElectronicInvoicingService],
})
export class ElectronicInvoicingModule {}
