import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { AccountAction } from '@/interfaces/Account';
import { ReportsAction } from '@/modules/FinancialStatements/types/Report.types';
import {
  CreateSepaMandateDto,
  CreateSepaRemittanceDto,
  PgcReportQueryDto,
  UpdateContactSepaDto,
  UpdateSepaBankAccountDto,
  UpdateSepaMandateDto,
  UpdateSpainFinanceConfigDto,
} from './dtos/SpainFinance.dto';
import { SpainFinanceService } from './SpainFinance.service';

@Controller('spain/finance')
@ApiTags('Spain Finance')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class SpainFinanceController {
  constructor(private readonly service: SpainFinanceService) {}

  @Get('config')
  @RequirePermission(ReportsAction.READ_BALANCE_SHEET, AbilitySubject.Report)
  config() { return this.service.getConfig(); }

  @Put('config')
  @RequirePermission(AccountAction.EDIT, AbilitySubject.Account)
  updateConfig(@Body() input: UpdateSpainFinanceConfigDto) { return this.service.saveConfig(input); }

  @Get('pgc/catalog')
  @RequirePermission(ReportsAction.READ_BALANCE_SHEET, AbilitySubject.Report)
  catalog() { return this.service.pgcCatalog(); }

  @Post('pgc/initialize')
  @RequirePermission(AccountAction.CREATE, AbilitySubject.Account)
  @ApiOperation({ summary: 'Creates missing operational PGC/PGC-PYMES accounts and maps existing codes.' })
  initializePgc() { return this.service.initializePgc(); }

  @Get('pgc/diagnostics')
  @RequirePermission(ReportsAction.READ_BALANCE_SHEET, AbilitySubject.Report)
  diagnostics() { return this.service.pgcDiagnostics(); }

  @Get('pgc/balance-sheet')
  @RequirePermission(ReportsAction.READ_BALANCE_SHEET, AbilitySubject.Report)
  balanceSheet(@Query() query: PgcReportQueryDto) { return this.service.balanceSheet(query); }

  @Get('pgc/profit-loss')
  @RequirePermission(ReportsAction.READ_PROFIT_LOSS, AbilitySubject.Report)
  profitLoss(@Query() query: PgcReportQueryDto) { return this.service.profitLoss(query); }

  @Get('pgc/trial-balance')
  @RequirePermission(ReportsAction.READ_TRIAL_BALANCE_SHEET, AbilitySubject.Report)
  trialBalance(@Query() query: PgcReportQueryDto) { return this.service.trialBalance(query); }

  @Get('bank-accounts')
  @RequirePermission(AccountAction.VIEW, AbilitySubject.Account)
  bankAccounts() { return this.service.bankAccounts(); }

  @Put('bank-accounts/:id')
  @RequirePermission(AccountAction.EDIT, AbilitySubject.Account)
  updateBank(@Param('id', ParseIntPipe) id: number, @Body() input: UpdateSepaBankAccountDto) {
    return this.service.updateBankAccount(id, input);
  }

  @Get('contacts')
  @RequirePermission(AccountAction.VIEW, AbilitySubject.Account)
  contacts(@Query('search') search?: string) { return this.service.contacts(search); }

  @Put('contacts/:id/sepa')
  @RequirePermission(AccountAction.EDIT, AbilitySubject.Account)
  updateContact(@Param('id', ParseIntPipe) id: number, @Body() input: UpdateContactSepaDto) {
    return this.service.updateContact(id, input);
  }

  @Get('sepa/validate')
  @RequirePermission(AccountAction.VIEW, AbilitySubject.Account)
  validateSepa(@Query('iban') iban: string, @Query('bic') bic?: string) { return this.service.validateIban(iban, bic); }

  @Get('sepa/mandates')
  @RequirePermission(AccountAction.VIEW, AbilitySubject.Account)
  mandates() { return this.service.mandates(); }

  @Post('sepa/mandates')
  @RequirePermission(AccountAction.EDIT, AbilitySubject.Account)
  createMandate(@Body() input: CreateSepaMandateDto) { return this.service.createMandate(input); }

  @Put('sepa/mandates/:id')
  @RequirePermission(AccountAction.EDIT, AbilitySubject.Account)
  updateMandate(@Param('id', ParseIntPipe) id: number, @Body() input: UpdateSepaMandateDto) {
    return this.service.updateMandate(id, input);
  }

  @Get('sepa/remittances')
  @RequirePermission(AccountAction.VIEW, AbilitySubject.Account)
  remittances() { return this.service.remittances(); }

  @Get('sepa/remittances/:id')
  @RequirePermission(AccountAction.VIEW, AbilitySubject.Account)
  remittance(@Param('id', ParseIntPipe) id: number) { return this.service.getRemittance(id); }

  @Post('sepa/remittances')
  @RequirePermission(AccountAction.EDIT, AbilitySubject.Account)
  createRemittance(@Body() input: CreateSepaRemittanceDto) { return this.service.createRemittance(input); }

  @Post('sepa/remittances/:id/generate')
  @RequirePermission(AccountAction.EDIT, AbilitySubject.Account)
  generateRemittance(@Param('id', ParseIntPipe) id: number) { return this.service.generateRemittance(id); }

  @Post('sepa/remittances/:id/exported')
  @RequirePermission(AccountAction.EDIT, AbilitySubject.Account)
  markExported(@Param('id', ParseIntPipe) id: number) { return this.service.markRemittanceExported(id); }

  @Get('territory')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  territory() { return this.service.territorySummary(); }
}
