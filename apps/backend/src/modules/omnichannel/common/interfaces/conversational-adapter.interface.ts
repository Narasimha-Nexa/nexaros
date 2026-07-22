import { ChannelAdapter } from './channel-adapter.interface';

export interface SendMessageOptions {
  to: string;
  text?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  imageUrl?: string;
  buttons?: Array<{ id: string; title: string }>;
  catalogItemId?: string;
}

export interface IncomingMessage {
  platformMessageId: string;
  from: string;
  text?: string;
  type: 'text' | 'image' | 'interactive' | 'order' | 'catalog' | 'payment';
  interactivePayload?: {
    buttonId?: string;
    listItemId?: string;
    orderDetails?: any;
  };
  timestamp: Date;
}

/**
 * Conversational commerce adapter interface.
 *
 * For WhatsApp/Instagram/Facebook, orders emerge from conversations.
 * This interface adds message-sending and catalog management methods
 * on top of the base ChannelAdapter.
 */
export interface ConversationalAdapter extends ChannelAdapter {
  // ── Messaging ──

  /**
   * Send a message back to the customer on the conversational channel.
   * Supports text, templates, images, and interactive buttons.
   */
  sendMessage(options: SendMessageOptions): Promise<{ messageId: string }>;

  /**
   * Mark a message as read to acknowledge receipt.
   */
  markAsRead(messageId: string): Promise<void>;

  // ── Catalog Sync ──

  /**
   * Sync the restaurant's menu as a product catalog to the channel
   * (e.g., WhatsApp Business Catalog, Facebook Shop).
   */
  syncCatalog(items: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isVeg?: boolean;
    category?: string;
  }>): Promise<{ success: boolean; catalogId?: string }>;

  /**
   * Send a catalog/carousel message showing menu items to the customer.
   */
  sendCatalogMessage(to: string, items: Array<{ id: string; name: string; price: number; imageUrl?: string }>): Promise<void>;

  // ── Session ──

  /**
   * Determine if a message starts a new conversation or continues an existing one.
   */
  detectSessionBoundary(message: IncomingMessage): 'new' | 'existing' | 'expired';
}
