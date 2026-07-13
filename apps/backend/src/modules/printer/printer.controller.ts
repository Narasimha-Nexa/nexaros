import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrinterService } from './printer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { SavePrinterConfigDto } from './dto/save-printer-config.dto';

@ApiTags('printer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get printer configuration' })
  getConfig(@CurrentTenant() tenantId: string) {
    return this.printerService.getConfig(tenantId);
  }

  @Post('config')
  @ApiOperation({ summary: 'Save printer configuration' })
  saveConfig(@CurrentTenant() tenantId: string, @Body() dto: SavePrinterConfigDto) {
    return this.printerService.saveConfig(tenantId, dto);
  }

  @Post('test/:printerId')
  @ApiOperation({ summary: 'Send test print to a printer' })
  testPrint(@CurrentTenant() tenantId: string, @Param('printerId') printerId: string) {
    return this.printerService.testPrint(tenantId, printerId);
  }

  @Get('discover')
  @ApiOperation({ summary: 'Discover network printers' })
  discover() {
    return this.printerService.discoverPrinters();
  }
}
