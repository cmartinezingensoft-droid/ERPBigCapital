import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { ReportsAction } from '@/modules/FinancialStatements/types/Report.types';
import { PreferencesAction } from '@/modules/Settings/Settings.types';
import { SiiPeriodDto, UpdateSiiConfigDto } from './dtos/Sii.dto';
import { SiiService } from './Sii.service';

@Controller('sii')
@ApiTags('SII Spain')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class SiiController {
  constructor(private readonly service: SiiService) {}

  @Get('config')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  getConfig() { return this.service.getConfig(); }

  @Put('config')
  @RequirePermission(PreferencesAction.Mutate, AbilitySubject.Preferences)
  updateConfig(@Body() input: UpdateSiiConfigDto) { return this.service.updateConfig(input); }

  @Post('sync')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Generates immutable SII records for the selected period.' })
  sync(@Body() period: SiiPeriodDto) { return this.service.sync(period); }

  @Get('records')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  list(@Query() query: Record<string, string>) { return this.service.list(query); }

  @Get('records/:id')
  @RequirePermission(ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY, AbilitySubject.Report)
  get(@Param('id', ParseIntPipe) id: number) { return this.service.get(id); }

  @Post('records/:id/submit')
  @RequirePermission(PreferencesAction.Mutate, AbilitySubject.Preferences)
  submit(@Param('id', ParseIntPipe) id: number) { return this.service.submit(id); }

  @Post('records/:id/retry')
  @RequirePermission(PreferencesAction.Mutate, AbilitySubject.Preferences)
  retry(@Param('id', ParseIntPipe) id: number) { return this.service.retry(id); }
}
