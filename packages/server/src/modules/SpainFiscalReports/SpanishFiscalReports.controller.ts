import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { ReportsAction } from '@/modules/FinancialStatements/types/Report.types';
import { SpanishFiscalReportsService } from './SpanishFiscalReports.service';
import { SpanishFiscalSettingsService } from './SpanishFiscalSettings.service';
import { SpanishViesService } from './SpanishVies.service';
import { SpanishFiscalReportsQueryDto } from './dtos/SpanishFiscalReportsQuery.dto';
import { UpdateSpanishFiscalConfigDto } from './dtos/SpanishFiscalConfig.dto';
import { ViesCheckDto } from './dtos/ViesCheck.dto';

@Controller('spain/fiscal')
@ApiTags('Spain Fiscal')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class SpanishFiscalReportsController {
  constructor(
    private readonly reports: SpanishFiscalReportsService,
    private readonly settings: SpanishFiscalSettingsService,
    private readonly vies: SpanishViesService,
  ) {}

  @Get('config')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Spanish advanced fiscal configuration.' })
  config() {
    return this.settings.getConfig();
  }

  @Put('config')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Updates Spanish advanced fiscal configuration.' })
  updateConfig(@Body() input: UpdateSpanishFiscalConfigDto) {
    return this.settings.saveConfig(input);
  }

  @Get('vat-books')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Spanish VAT books (issued and received) from fiscal snapshots.' })
  vatBooks(@Query() query: SpanishFiscalReportsQueryDto) {
    return this.reports.vatBooks(query);
  }

  @Get('model-303-preview')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Control preview for Spanish Modelo 303 VAT settlement.' })
  model303Preview(@Query() query: SpanishFiscalReportsQueryDto) {
    return this.reports.model303Preview(query);
  }

  @Get('model-349-preview')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Control preview for Spanish Modelo 349 intra-community statement.' })
  model349Preview(@Query() query: SpanishFiscalReportsQueryDto) {
    return this.reports.model349Preview(query);
  }

  @Get('model-347-preview')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Control preview for Spanish Modelo 347 annual third-party operations.' })
  model347Preview(@Query() query: SpanishFiscalReportsQueryDto) {
    return this.reports.model347Preview(query);
  }

  @Get('model-369-preview')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Control preview for Spanish Modelo 369 OSS/IOSS.' })
  model369Preview(@Query() query: SpanishFiscalReportsQueryDto) {
    return this.reports.model369Preview(query);
  }

  @Get('export')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'CSV export for Spanish fiscal books and previews.' })
  exportCsv(
    @Query('report') report: 'vat-issued' | 'vat-received' | '349' | '347' | '369',
    @Query() query: SpanishFiscalReportsQueryDto,
  ) {
    return this.reports.exportCsv(report, query);
  }

  @Post('vies/check')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Checks an intra-EU VAT number using the European Commission VIES service.' })
  viesCheck(@Body() input: ViesCheckDto) {
    return this.vies.check(input);
  }
}
