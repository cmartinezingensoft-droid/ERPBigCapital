import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { SaleInvoiceAction } from '@/modules/SaleInvoices/SaleInvoice.types';
import { PreferencesAction } from '@/modules/Settings/Settings.types';
import { VerifactuWorkflowService } from './VerifactuWorkflow.service';
import { CreateVerifactuAnulacionDto, CreateVerifactuSubsanacionDto } from './dtos/Verifactu.dto';
import { UpdateVerifactuConfigDto } from './dtos/VerifactuConfig.dto';

@Controller('verifactu')
@ApiTags('VERI*FACTU')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class VerifactuController {
  constructor(private readonly workflow: VerifactuWorkflowService) {}

  @Get('config')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  getConfig() {
    return this.workflow.getConfig();
  }

  @Put('config')
  @RequirePermission(PreferencesAction.Mutate, AbilitySubject.Preferences)
  updateConfig(@Body() body: UpdateVerifactuConfigDto) {
    return this.workflow.updateConfig(body);
  }

  @Post('config/validate-certificate')
  @RequirePermission(PreferencesAction.Mutate, AbilitySubject.Preferences)
  validateCertificate() {
    return this.workflow.validateCertificate();
  }

  @Get('stats')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  getStats() {
    return this.workflow.getStats();
  }

  @Get('console')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  getConsole(@Query() query: Record<string, string>) {
    return this.workflow.getConsole(query);
  }

  @Get('records')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Lists immutable VERI*FACTU records and AEAT state.' })
  getRecords(@Query('invoiceId') invoiceId?: string) {
    return this.workflow.getRecords(invoiceId ? Number(invoiceId) : undefined);
  }

  @Get('records/:id')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  getRecord(@Param('id', ParseIntPipe) id: number) {
    return this.workflow.getRecord(id);
  }

  @Post('records/:id/retry')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  retryRecord(@Param('id', ParseIntPipe) id: number) {
    return this.workflow.retryRecord(id);
  }

  @Post('dispatch')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Processes pending rows from the persistent VERI*FACTU outbox.' })
  dispatchPending() {
    return this.workflow.dispatchPending();
  }

  @Post('invoices/:id/subsanacion')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Creates a new chained subsanación record without modifying prior records.' })
  createSubsanacion(
    @Param('id', ParseIntPipe) invoiceId: number,
    @Body() body: CreateVerifactuSubsanacionDto,
  ) {
    return this.workflow.createSubsanacion(invoiceId, body);
  }

  @Post('invoices/:id/reconcile')
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Queries AEAT and reconciles the latest submitted invoice record.' })
  reconcileInvoice(@Param('id', ParseIntPipe) invoiceId: number) {
    return this.workflow.reconcileInvoice(invoiceId);
  }

  @Post('invoices/:id/anulacion')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Creates a new chained cancellation record.' })
  createAnulacion(
    @Param('id', ParseIntPipe) invoiceId: number,
    @Body() body: CreateVerifactuAnulacionDto = {},
  ) {
    return this.workflow.createAnulacion(invoiceId, body);
  }
}
