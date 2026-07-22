import {
  Controller, Get, Post,
  Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('payments/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate invoice for a payment' })
  generateInvoice(@Param('paymentId') paymentId: string, @CurrentTenant() tenantId: string) {
    return this.invoicesService.generateInvoice(paymentId, tenantId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List invoices for a branch' })
  @ApiQuery({ name: 'branchId', required: true })
  getInvoices(@Query('branchId') branchId: string, @CurrentTenant() tenantId: string) {
    return this.invoicesService.getInvoices(branchId, tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get invoice details' })
  getInvoice(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.invoicesService.getInvoice(id, tenantId);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get invoice PDF data (structured for client rendering)' })
  getInvoicePdf(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.invoicesService.getInvoicePdf(id, tenantId);
  }
}
