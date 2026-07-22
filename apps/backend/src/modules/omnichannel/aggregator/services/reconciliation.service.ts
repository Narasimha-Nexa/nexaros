import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AggregatorAdapter } from '../../common/interfaces/aggregator-adapter.interface';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run reconciliation for a given aggregator channel and date range.
   * Compares aggregator settlement data with internal orders.
   */
  async runReconciliation(
    channel: string,
    fromDate: Date,
    toDate: Date,
    adapter: AggregatorAdapter,
  ): Promise<ReconciliationResult> {
    this.logger.log(`Running reconciliation for ${channel} from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

    // 1. Fetch settlement data from aggregator
    const settlements = await adapter.fetchSettlements(fromDate, toDate);

    // 2. Fetch internal orders for the same period and channel
    const internalOrders = await this.prisma.order.findMany({
      where: {
        channel: channel.toUpperCase() as any,
        createdAt: { gte: fromDate, lte: toDate },
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        orderNumber: true,
        channelOrderId: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    // 3. Match settlements to internal orders
    const settlementMap = new Map(settlements.map((s) => [s.channelOrderId, s]));
    const results: ReconciliationItem[] = [];
    let matched = 0;
    let missingFromAggregator = 0;
    let missingFromInternal = 0;
    let amountMismatches = 0;

    for (const order of internalOrders) {
      if (!order.channelOrderId) continue;

      const settlement = settlementMap.get(order.channelOrderId);
      if (!settlement) {
        missingFromAggregator++;
        results.push({
          channelOrderId: order.channelOrderId,
          internalOrderNumber: order.orderNumber,
          internalAmount: Number(order.totalAmount),
          settlementAmount: null,
          commissionAmount: null,
          discrepancy: Number(order.totalAmount),
          status: 'missing_from_aggregator',
        });
        continue;
      }

      const diff = Math.abs(Number(order.totalAmount) - settlement.orderAmount);
      if (diff > 1) {
        // More than ₹1 difference is a discrepancy
        amountMismatches++;
        results.push({
          channelOrderId: order.channelOrderId,
          internalOrderNumber: order.orderNumber,
          internalAmount: Number(order.totalAmount),
          settlementAmount: settlement.orderAmount,
          commissionAmount: settlement.commissionAmount,
          discrepancy: diff,
          status: 'amount_mismatch',
        });
      } else {
        matched++;
      }

      // Remove matched settlements
      settlementMap.delete(order.channelOrderId);
    }

    // Remaining settlements have no matching internal order
    for (const [orderId, settlement] of settlementMap) {
      missingFromInternal++;
      results.push({
        channelOrderId: orderId,
        internalOrderNumber: null,
        internalAmount: null,
        settlementAmount: settlement.orderAmount,
        commissionAmount: settlement.commissionAmount,
        discrepancy: settlement.orderAmount,
        status: 'missing_from_internal',
      });
    }

    return {
      channel,
      fromDate,
      toDate,
      totalSettlements: settlements.length,
      totalInternalOrders: internalOrders.length,
      matched,
      missingFromAggregator,
      missingFromInternal,
      amountMismatches,
      details: results,
    };
  }

  /**
   * Get reconciliation summary for dashboard display.
   */
  async getReconciliationSummary(channel: string, period: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    const now = new Date();
    let fromDate: Date;

    switch (period) {
      case 'daily':
        fromDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        fromDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        fromDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        fromDate = new Date(now.setDate(now.getDate() - 7));
    }

    const orders = await this.prisma.order.findMany({
      where: {
        channel: channel.toUpperCase() as any,
        createdAt: { gte: fromDate },
      },
      select: {
        id: true,
        channelOrderId: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

    return {
      channel,
      period,
      totalOrders,
      totalRevenue,
      cancelledOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }

  /**
   * Flag a specific order for manual reconciliation review.
   */
  async flagForReview(channelOrderId: string, reason: string): Promise<void> {
    await this.prisma.order.updateMany({
      where: { channelOrderId },
      data: { needsManualReview: true },
    });
    this.logger.warn(`Flagged order ${channelOrderId} for manual review: ${reason}`);
  }
}

export interface ReconciliationItem {
  channelOrderId: string;
  internalOrderNumber: number | null;
  internalAmount: number | null;
  settlementAmount: number | null;
  commissionAmount: number | null;
  discrepancy: number;
  status: 'matched' | 'amount_mismatch' | 'missing_from_aggregator' | 'missing_from_internal';
}

export interface ReconciliationResult {
  channel: string;
  fromDate: Date;
  toDate: Date;
  totalSettlements: number;
  totalInternalOrders: number;
  matched: number;
  missingFromAggregator: number;
  missingFromInternal: number;
  amountMismatches: number;
  details: ReconciliationItem[];
}
