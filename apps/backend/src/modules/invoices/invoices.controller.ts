import {
  Controller, Get, Post,
  Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('payments/:paymentId')
  @ApiOperation({ summary: 'Generate invoice for a payment' })
  generateInvoice(@Param('paymentId') paymentId: string) {
    return this.invoicesService.generateInvoice(paymentId);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices for a branch' })
  @ApiQuery({ name: 'branchId', required: true })
  getInvoices(@Query('branchId') branchId: string) {
    return this.invoicesService.getInvoices(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details' })
  getInvoice(@Param('id') id: string) {
    return this.invoicesService.getInvoice(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Get invoice PDF data (structured for client rendering)' })
  getInvoicePdf(@Param('id') id: string) {
    return this.invoicesService.getInvoicePdf(id);
  }
}
