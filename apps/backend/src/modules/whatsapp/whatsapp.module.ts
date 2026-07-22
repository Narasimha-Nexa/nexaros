import { Module } from '@nestjs/common';
import { WhatsAppCloudApiService } from './services/whatsapp-cloud-api.service';
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service';
import { WhatsAppTemplateService } from './services/whatsapp-template.service';
import { WhatsAppBulkMessagingService } from './services/whatsapp-bulk-messaging.service';
import { WhatsAppAutomationService } from './services/whatsapp-automation.service';
import { WhatsAppAnalyticsService } from './services/whatsapp-analytics.service';
import { WhatsAppNlpService } from './services/whatsapp-nlp.service';
import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller';
import { WhatsAppManagementController } from './controllers/whatsapp-management.controller';
import { AiChatModule } from '../ai-chat/ai-chat.module';

/**
 * WhatsApp Business Platform Module
 *
 * Provides comprehensive WhatsApp Business API integration:
 * - Cloud API communication
 * - Webhook handling
 * - Template management
 * - Bulk messaging with rate limiting
 * - Automation rules
 * - Analytics tracking
 * - NLP-powered conversations
 */
@Module({
  imports: [AiChatModule],
  controllers: [WhatsAppWebhookController, WhatsAppManagementController],
  providers: [
    WhatsAppCloudApiService,
    WhatsAppWebhookService,
    WhatsAppTemplateService,
    WhatsAppBulkMessagingService,
    WhatsAppAutomationService,
    WhatsAppAnalyticsService,
    WhatsAppNlpService,
  ],
  exports: [
    WhatsAppCloudApiService,
    WhatsAppWebhookService,
    WhatsAppTemplateService,
    WhatsAppBulkMessagingService,
    WhatsAppAutomationService,
    WhatsAppAnalyticsService,
    WhatsAppNlpService,
  ],
})
export class WhatsAppModule {}
