import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { SaleInvoiceAction } from '@/modules/SaleInvoices/SaleInvoice.types';
import {
  CreateElectronicInvoiceStatusEventDto,
  GenerateElectronicInvoiceDto,
  ImportSignedElectronicInvoiceDto,
  UpdateElectronicInvoiceDeliveryDto,
} from './dtos/ElectronicInvoice.dto';
import { ElectronicInvoicingService } from './ElectronicInvoicing.service';

@Controller('electronic-invoices')
@ApiTags('Electronic invoicing Spain')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class ElectronicInvoicingController {
  constructor(private readonly electronicInvoicing: ElectronicInvoicingService) {}

  @Get('capabilities')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  capabilities() {
    return this.electronicInvoicing.capabilities();
  }

  @Get('console')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  console(@Query() query: Record<string, string>) {
    return this.electronicInvoicing.console(query);
  }

  @Get('invoices/:id/documents')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  listByInvoice(@Param('id', ParseIntPipe) invoiceId: number) {
    return this.electronicInvoicing.listByInvoice(invoiceId);
  }

  @Post('invoices/:id/generate')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Generates and versions an immutable Facturae or UBL electronic invoice.' })
  generate(
    @Param('id', ParseIntPipe) invoiceId: number,
    @Body() body: GenerateElectronicInvoiceDto,
  ) {
    return this.electronicInvoicing.generate(invoiceId, body);
  }

  @Get('documents/:id')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  getDocument(@Param('id', ParseIntPipe) id: number) {
    return this.electronicInvoicing.getDocument(id);
  }

  @Get('documents/:id/download')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Query('variant') variant: 'original' | 'signed' = 'original',
    @Res() res: Response,
  ) {
    const output = await this.electronicInvoicing.getDownload(
      id,
      variant === 'signed' ? 'signed' : 'original',
    );
    res.setHeader('Content-Type', output.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${output.filename}"`);
    res.send(output.content);
  }

  @Post('documents/:id/signed')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Imports a previously XAdES/advanced-signed XML payload.' })
  importSigned(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ImportSignedElectronicInvoiceDto,
  ) {
    return this.electronicInvoicing.importSigned(id, body);
  }

  @Post('documents/:id/delivery')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  updateDelivery(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateElectronicInvoiceDeliveryDto,
  ) {
    return this.electronicInvoicing.updateDelivery(id, body);
  }

  @Post('documents/:id/status-events')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  createStatusEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateElectronicInvoiceStatusEventDto,
  ) {
    return this.electronicInvoicing.createStatusEvent(id, body);
  }
}
