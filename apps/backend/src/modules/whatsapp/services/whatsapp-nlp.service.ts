import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../ai-chat/llm.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppCloudApiService } from './whatsapp-cloud-api.service';
import { ChatMessage } from '../../ai-chat/providers/llm-provider.interface';

/**
 * WhatsApp NLP Integration Service
 *
 * Uses LLM to process natural language WhatsApp messages and generate
 * intelligent responses for restaurant ordering conversations.
 *
 * Features:
 * - Intent recognition with high accuracy
 * - Menu item extraction from free text
 * - Context-aware responses
 * - Multi-language support
 * - Conversation memory
 */
@Injectable()
export class WhatsAppNlpService {
  private readonly logger = new Logger(WhatsAppNlpService.name);

  constructor(
    private llmService: LlmService,
    private prisma: PrismaService,
    private cloudApiService: WhatsAppCloudApiService,
  ) {}

  /**
   * Process an incoming WhatsApp message with NLP
   */
  async processMessage(params: {
    accountId: string;
    tenantId: string;
    branchId: string;
    from: string;
    textContent: string;
    sessionId?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<NlpResult> {
    const { accountId, tenantId, branchId, from, textContent, conversationHistory = [] } = params;

    try {
      // Get menu items for context
      const menuItems = await this.getMenuItems(tenantId);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(menuItems);

      // Build messages array
      const messages: ChatMessage[] = [
        ...conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: textContent },
      ];

      // Call LLM
      const response = await this.llmService.complete({
        systemPrompt,
        messages,
        temperature: 0.3,
        maxTokens: 500,
      });

      // Parse the response
      const parsed = this.parseLlmResponse(response.content);

      return {
        success: true,
        reply: parsed.reply,
        intent: parsed.intent,
        items: parsed.items,
        confidence: parsed.confidence,
        rawResponse: response.content,
      };
    } catch (error) {
      this.logger.error(`NLP processing failed: ${(error as Error).message}`);

      // Fallback to rule-based intent extraction
      return this.fallbackIntentExtraction(textContent, tenantId);
    }
  }

  /**
   * Build system prompt with menu context
   */
  private buildSystemPrompt(menuItems: Array<{ id: string; name: string; price: number; category: string }>): string {
    const menuContext = menuItems
      .map((item) => `- ${item.name}: ₹${item.price} (${item.category})`)
      .join('\n');

    return `You are a friendly restaurant ordering assistant for a restaurant. Your job is to help customers place orders via WhatsApp.

MENU ITEMS:
${menuContext}

CAPABILITIES:
1. Greet customers warmly
2. Help them browse the menu
3. Add items to their cart
4. Modify quantities
5. Remove items
6. Review the cart
7. Proceed to checkout
8. Handle payment inquiries

RESPONSE FORMAT:
Always respond in JSON format:
{
  "intent": "greeting|menu_request|add_item|remove_item|modify_quantity|review_cart|confirm_order|cancel_order|payment_inquiry|help|unknown",
  "reply": "Your friendly response to the customer",
  "items": [{"name": "item name", "quantity": 1, "price": 100}],
  "confidence": 0.95
}

RULES:
- Be friendly and use emojis appropriately
- If customer asks for menu, show categories and popular items
- If customer mentions items, extract them with quantities
- If quantity not specified, default to 1
- Always confirm before adding items
- Show running total when items are added
- Use ₹ symbol for prices
- Keep responses concise for WhatsApp
- If unsure about intent, ask clarifying questions`;
  }

  /**
   * Parse LLM response
   */
  private parseLlmResponse(response: string): ParsedIntent {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reply: parsed.reply || response,
          intent: parsed.intent || 'unknown',
          items: parsed.items || [],
          confidence: parsed.confidence || 0.5,
        };
      }

      // If no JSON, treat entire response as reply
      return {
        reply: response,
        intent: 'unknown',
        items: [],
        confidence: 0.3,
      };
    } catch {
      return {
        reply: response,
        intent: 'unknown',
        items: [],
        confidence: 0.3,
      };
    }
  }

  /**
   * Fallback rule-based intent extraction
   */
  private async fallbackIntentExtraction(
    text: string,
    tenantId: string,
  ): Promise<NlpResult> {
    const lowerText = text.toLowerCase().trim();

    // Simple rule-based extraction
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
    if (greetings.some((g) => lowerText.includes(g))) {
      return {
        success: true,
        reply: 'Hello! 👋 Welcome to our restaurant! Would you like to see our menu?',
        intent: 'greeting',
        items: [],
        confidence: 0.9,
      };
    }

    const menuKeywords = ['menu', 'food', 'what do you have', 'show menu'];
    if (menuKeywords.some((k) => lowerText.includes(k))) {
      return {
        success: true,
        reply: '📋 Here\'s our menu! What would you like to order?',
        intent: 'menu_request',
        items: [],
        confidence: 0.9,
      };
    }

    // Try to extract items
    const items = await this.extractItemsFromText(text, tenantId);
    if (items.length > 0) {
      const itemList = items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      return {
        success: true,
        reply: `Got it! Adding ${itemList} to your cart. Anything else?`,
        intent: 'add_item',
        items,
        confidence: 0.7,
      };
    }

    return {
      success: true,
      reply: 'I\'m not sure I understand. Could you please rephrase? You can say "menu" to see our items or "help" for assistance.',
      intent: 'unknown',
      items: [],
      confidence: 0.3,
    };
  }

  /**
   * Extract items from text using menu matching
   */
  private async extractItemsFromText(
    text: string,
    tenantId: string,
  ): Promise<Array<{ name: string; quantity: number; price: number; menuItemId: string }>> {
    const menuItems = await this.getMenuItems(tenantId);
    const lowerText = text.toLowerCase();
    const items: Array<{ name: string; quantity: number; price: number; menuItemId: string }> = [];

    // Simple pattern matching for quantities and items
    const quantityPatterns = [
      /(\d+)\s*(?:x\s*)?/i,
      /(?:one|two|three|four|five|six|seven|eight|nine|ten)\s*/i,
    ];

    const quantityWords: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    };

    for (const menuItem of menuItems) {
      const itemName = menuItem.name.toLowerCase();
      if (lowerText.includes(itemName)) {
        // Find quantity
        let quantity = 1;
        const beforeItem = lowerText.substring(0, lowerText.indexOf(itemName));

        for (const pattern of quantityPatterns) {
          const match = beforeItem.match(pattern);
          if (match) {
            if (match[1] && !isNaN(parseInt(match[1]))) {
              quantity = parseInt(match[1]);
            } else if (quantityWords[match[0].trim()]) {
              quantity = quantityWords[match[0].trim()];
            }
          }
        }

        items.push({
          name: menuItem.name,
          quantity: Math.min(quantity, 50),
          price: menuItem.price,
          menuItemId: menuItem.id,
        });
      }
    }

    return items;
  }

  /**
   * Get menu items for tenant
   */
  private async getMenuItems(
    tenantId: string,
  ): Promise<Array<{ id: string; name: string; price: number; category: string }>> {
    const items = await this.prisma.menuItem.findMany({
      where: {
        tenantId,
        isAvailable: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: {
          select: { name: true },
        },
      },
      take: 100,
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      category: item.category?.name || 'General',
    }));
  }

  /**
   * Generate contextual response based on conversation state
   */
  async generateContextualResponse(params: {
    accountId: string;
    tenantId: string;
    conversationState: string;
    cartItems: Array<{ name: string; quantity: number; price: number }>;
    lastMessage: string;
  }): Promise<string> {
    const { conversationState, cartItems, lastMessage } = params;

    const cartSummary = cartItems.length > 0
      ? cartItems.map((i) => `${i.quantity}x ${i.name} (₹${i.price})`).join('\n')
      : 'Empty';

    const systemPrompt = `You are a restaurant ordering assistant. Generate a contextual response based on the conversation state.

CONVERSATION STATE: ${conversationState}
CART CONTENTS:
${cartSummary}

LAST CUSTOMER MESSAGE: ${lastMessage}

Generate a brief, friendly response appropriate for the current state. Use emojis.`;

    try {
      const response = await this.llmService.complete({
        systemPrompt,
        messages: [{ role: 'user', content: lastMessage }],
        temperature: 0.5,
        maxTokens: 200,
      });

      return response.content;
    } catch {
      return this.getDefaultResponse(conversationState);
    }
  }

  /**
   * Get default response for conversation state
   */
  private getDefaultResponse(state: string): string {
    const responses: Record<string, string> = {
      GREETING: '👋 Welcome! Would you like to see our menu?',
      BROWSING: '📋 Take your time browsing! Let me know what you\'d like to order.',
      CART_BUILDING: '🛒 Great choices! Anything else you\'d like to add?',
      CART_REVIEW: '📝 Here\'s your order summary. Ready to checkout?',
      AWAITING_PAYMENT: '💳 How would you like to pay?',
      ORDER_PLACED: '🎉 Order confirmed! We\'ll start preparing it shortly.',
      POST_ORDER: '🙏 Thank you for your order! Enjoy your meal!',
    };

    return responses[state] || 'How can I help you today?';
  }
}

export interface NlpResult {
  success: boolean;
  reply: string;
  intent: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    menuItemId?: string;
  }>;
  confidence: number;
  rawResponse?: string;
}

interface ParsedIntent {
  reply: string;
  intent: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  confidence: number;
}
