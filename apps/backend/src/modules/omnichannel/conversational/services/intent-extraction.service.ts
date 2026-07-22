import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

/**
 * Intent Extraction Service for Conversational Commerce
 *
 * Parses free-text customer messages into structured cart operations
 * (add item, remove item, modify quantity, ask for menu, confirm order, etc.)
 *
 * Uses a lightweight NLP approach scoped strictly to the restaurant's
 * own menu vocabulary to avoid hallucinated items.
 *
 * Can be replaced with an LLM-based approach later for better accuracy,
 * but the scope must remain within the known menu vocabulary.
 */
@Injectable()
export class IntentExtractionService {
  private readonly logger = new Logger(IntentExtractionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Parse a customer's message and return a structured intent.
   */
  async extractIntent(
    message: string,
    tenantId: string,
  ): Promise<ExtractedIntent> {
    const lowerMsg = message.toLowerCase().trim();

    // ── Greetings / Small Talk ──
    if (this.matchAny(lowerMsg, ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaste'])) {
      return { type: 'greeting', confidence: 1.0 };
    }

    // ── Menu Requests ──
    if (this.matchAny(lowerMsg, ['menu', 'what do you have', 'show menu', 'items', 'food menu', 'what can i order', 'list'])) {
      return { type: 'request_menu', confidence: 0.95 };
    }

    // ── Cart Operations ──
    const addResult = await this.parseAddItem(lowerMsg, tenantId);
    if (addResult) return addResult;

    const removeResult = this.parseRemoveItem(lowerMsg);
    if (removeResult) return removeResult;

    // ── Cart Review / Summary ──
    if (this.matchAny(lowerMsg, ['cart', 'my order', 'summary', 'what i ordered', 'show cart', 'basket', 'review'])) {
      return { type: 'review_cart', confidence: 0.9 };
    }

    // ── Checkout / Confirm ──
    if (this.matchAny(lowerMsg, ['confirm', 'place order', 'order now', 'checkout', 'yes please', 'go ahead', 'place it', 'book it'])) {
      return { type: 'confirm_order', confidence: 0.8 };
    }

    // ── Modify Quantity ──
    const modifyResult = this.parseModifyQuantity(lowerMsg);
    if (modifyResult) return modifyResult;

    // ── Cancel ──
    if (this.matchAny(lowerMsg, ['cancel', 'never mind', 'forget it', 'remove all', 'clear cart'])) {
      return { type: 'cancel_order', confidence: 0.85 };
    }

    // ── Status Inquiry ──
    if (this.matchAny(lowerMsg, ['status', 'where is my order', 'how long', 'ready yet', 'track', 'delivery time', 'eta'])) {
      return { type: 'inquire_status', confidence: 0.9 };
    }

    // ── Help ──
    if (this.matchAny(lowerMsg, ['help', 'what can you do', 'how to order', 'options', 'support'])) {
      return { type: 'help', confidence: 0.9 };
    }

    // ── Contact / Address ──
    if (this.matchAny(lowerMsg, ['address', 'location', 'where are you', 'delivery address', 'my address'])) {
      return { type: 'provide_address', confidence: 0.7 };
    }

    // ── Payment ──
    if (this.matchAny(lowerMsg, ['pay', 'payment', 'pay now', 'payment link', 'how to pay', 'cash', 'upi', 'card'])) {
      return { type: 'payment_inquiry', confidence: 0.8 };
    }

    // ── Hours ──
    if (this.matchAny(lowerMsg, ['open', 'timing', 'hours', 'when are you open', 'closing', 'time'])) {
      return { type: 'inquire_hours', confidence: 0.85 };
    }

    // ── Unknown ──
    return { type: 'unknown', confidence: 0.3, rawText: message };
  }

  /**
   * Try to parse an "add item" intent from free text.
   * Examples: "2 butter chicken", "I want one naan", "add 3 samosas"
   */
  private async parseAddItem(text: string, tenantId: string): Promise<ExtractedIntent | null> {
    const addPatterns = [
      /(?:\badd\s+)?(\d+)\s+(.+)/i,
      /(?:i\s+want|i'll\s+have|give\s+me)\s+(\d+)?\s*(.+)/i,
      /(?:can\s+i\s+get|i'd\s+like)\s+(\d+)?\s*(.+)/i,
      /(\d+)?\s*(.+?)\s*(?:please|thanks|thank you)?$/i,
    ];

    // Remove words that indicate non-add intent
    const removeIndicators = ['remove', 'delete', 'cancel', 'clear', 'less', 'fewer'];
    for (const indicator of removeIndicators) {
      if (text.includes(indicator)) return null;
    }

    // Also detect "add X" pattern
    const addMatch = text.match(/add\s+(\d+)?\s*(.+)/i);
    const baseText = addMatch ? addMatch[2] : text;
    const baseQty = addMatch ? parseInt(addMatch[1]) || 1 : null;

    // Search menu items by name
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        tenantId,
        isAvailable: true,
        deletedAt: null,
      },
      select: { id: true, name: true, price: true },
    });

    // Find matching menu item
    const searchText = baseText.toLowerCase().trim();
    let bestMatch: { id: string; name: string; price: number; score: number } | null = null;

    for (const item of menuItems) {
      const itemName = item.name.toLowerCase();
      let score = 0;

      // Exact match
      if (searchText === itemName) {
        score = 1.0;
      }
      // Item name is contained in search text
      else if (searchText.includes(itemName)) {
        score = 0.9;
      }
      // Search text is contained in item name
      else if (itemName.includes(searchText)) {
        score = 0.8;
      }
      // Partial word match
      else {
        const searchWords = searchText.split(/\s+/);
        const itemWords = itemName.split(/\s+/);
        const matchingWords = searchWords.filter((w) =>
          itemWords.some((iw) => iw.startsWith(w) || w.startsWith(iw)),
        ).length;
        if (matchingWords > 0) {
          score = matchingWords / Math.max(searchWords.length, itemWords.length) * 0.7;
        }
      }

      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: item.id, name: item.name, price: Number(item.price), score };
      }
    }

    if (bestMatch) {
      // Extract quantity: first number in the text or default to 1
      let quantity = baseQty || 1;
      if (!baseQty) {
        const numMatch = text.match(/(\d+)/);
        if (numMatch) quantity = parseInt(numMatch[1]);
      }

      return {
        type: 'add_item',
        confidence: bestMatch.score,
        items: [{
          menuItemId: bestMatch.id,
          name: bestMatch.name,
          quantity: Math.min(quantity, 50), // Sanity cap
          unitPrice: Number(bestMatch.price),
        }],
      };
    }

    return null;
  }

  /**
   * Parse "remove X" or "delete X" intent.
   */
  private parseRemoveItem(text: string): ExtractedIntent | null {
    const removeMatch = text.match(/(?:remove|delete|take\s+off)\s+(.+)/i);
    if (removeMatch) {
      return {
        type: 'remove_item',
        confidence: 0.8,
        itemName: removeMatch[1].trim(),
      };
    }
    return null;
  }

  /**
   * Parse quantity modifications like "make it 3" or "only 1".
   */
  private parseModifyQuantity(text: string): ExtractedIntent | null {
    const modMatch = text.match(/(?:make\s+it|change\s+to|only)\s+(\d+)\s*(.+)/i);
    if (modMatch) {
      return {
        type: 'modify_quantity',
        confidence: 0.75,
        quantity: parseInt(modMatch[1]),
        itemName: modMatch[2]?.trim(),
      };
    }
    return null;
  }

  private matchAny(text: string, patterns: string[]): boolean {
    return patterns.some((p) => text.includes(p));
  }
}

export type IntentType =
  | 'greeting'
  | 'request_menu'
  | 'add_item'
  | 'remove_item'
  | 'modify_quantity'
  | 'review_cart'
  | 'confirm_order'
  | 'cancel_order'
  | 'inquire_status'
  | 'inquire_hours'
  | 'provide_address'
  | 'payment_inquiry'
  | 'help'
  | 'unknown';

export interface ExtractedIntent {
  type: IntentType;
  confidence: number;
  items?: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  itemName?: string;
  quantity?: number;
  rawText?: string;
}
