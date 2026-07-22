import { Injectable, Logger } from '@nestjs/common';

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /disregard\s+(all|every|your)\s+/i,
  /system\s*:\s*/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+if/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /reveal\s+(your|the)\s+(system|hidden|internal)/i,
  /show\s+me\s+(your|the)\s+(system|prompt|instructions|api.?key|secret)/i,
  /what\s+are\s+your\s+(system|hidden|internal)\s+instructions/i,
  /print\s+your\s+(system|initial)\s+prompt/i,
  /output\s+your\s+(full|entire)\s+prompt/i,
  /translate\s+.*into\s+.*and\s+repeat/i,
  /repeat\s+everything\s+above/i,
  /from\s+now\s+on.*you\s+(will|must|should)/i,
  /new\s+instructions/i,
  /override\s+(system|previous)/i,
];

const SENSITIVE_PATTERNS = [
  /api[_\s-]?key/i,
  /secret[_\s-]?key/i,
  /password/i,
  /DATABASE_URL/i,
  /JWT_SECRET/i,
  /private[_\s-]?key/i,
  /credential/i,
];

@Injectable()
export class GuardrailsService {
  private readonly logger = new Logger(GuardrailsService.name);

  validateInput(message: string): { safe: boolean; reason?: string } {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(message)) {
        this.logger.warn(`Prompt injection detected: ${pattern.source}`);
        return { safe: false, reason: 'Your message contains instructions that cannot be processed. Please ask a restaurant-related question.' };
      }
    }
    return { safe: true };
  }

  validateOutput(response: string): { safe: boolean; sanitized: string } {
    let sanitized = response;
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(sanitized)) {
        this.logger.warn('Sensitive data detected in AI response, redacting');
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
    }
    return { safe: true, sanitized };
  }

  isRestaurantRelated(question: string): boolean {
    const restaurantKeywords = [
      'revenue', 'sales', 'order', 'customer', 'inventory', 'menu', 'item',
      'forecast', 'predict', 'branch', 'staff', 'employee', 'reservation',
      'payment', 'refund', 'profit', 'cost', 'food', 'kitchen', 'dish',
      'restaurant', 'business', 'report', 'analytics', 'trend', 'compare',
      'performance', 'waste', 'stock', 'supplier', 'purchase', 'delivery',
      'tip', 'table', 'bill', 'invoice', 'tax', 'discount', 'coupon',
      'promotion', 'marketing', 'retention', 'churn', 'loyalty', 'feedback',
      'review', 'complaint', 'satisfaction', 'peak', 'hour', 'shift',
      'schedule', 'roster', 'payroll', 'labor', 'overhead', 'margin',
      'ROI', 'KPI', 'metric', 'target', 'goal', 'benchmark', 'alert',
      'summary', 'weekly', 'daily', 'monthly', 'quarterly', 'annual',
      'food cost', 'beverage', 'wine', 'beer', 'cocktail', 'coffee',
      'breakfast', 'lunch', 'dinner', 'brunch', 'takeaway', 'dine-in',
    ];
    const lower = question.toLowerCase();
    return restaurantKeywords.some(kw => lower.includes(kw));
  }
}
