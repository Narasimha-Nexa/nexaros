import { ChannelAdapter } from './channel-adapter.interface';

export interface MenuItemSync {
  id?: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  category?: string;
  imageUrl?: string;
  isVeg?: boolean;
  prepTimeMin?: number;
}

export interface MenuSyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors?: Array<{ itemName: string; error: string }>;
}

export interface SettlementLineItem {
  channelOrderId: string;
  orderAmount: number;
  commissionAmount: number;
  netAmount: number;
  settlementDate: Date;
  status: 'settled' | 'pending' | 'disputed';
}

/**
 * Aggregator-specific adapter interface extending the base ChannelAdapter.
 *
 * Adds menu synchronization and reconciliation methods specific to
 * food delivery aggregators (Swiggy, Zomato, etc.).
 */
export interface AggregatorAdapter extends ChannelAdapter {
  // ── Menu Sync ──

  /**
   * Push the current menu (or a delta) to the aggregator platform.
   * Called on schedule and on menu item changes.
   */
  syncMenu(menu: MenuItemSync[]): Promise<MenuSyncResult>;

  /**
   * Mark an item as unavailable on the aggregator platform.
   * Called when inventory runs out or item is 86'd.
   */
  markItemUnavailable(externalItemId: string): Promise<void>;

  /**
   * Mark an item as available again.
   */
  markItemAvailable(externalItemId: string): Promise<void>;

  // ── Reconciliation ──

  /**
   * Fetch settlement report from the aggregator for order reconciliation.
   * Format and availability vary per platform.
   */
  fetchSettlements(fromDate: Date, toDate: Date): Promise<SettlementLineItem[]>;

  /**
   * Fetch commission rate configured for this restaurant on the aggregator.
   */
  getCommissionRate(): Promise<number>;
}
