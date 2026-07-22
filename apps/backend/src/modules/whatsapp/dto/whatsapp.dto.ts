import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a WhatsApp template
 */
export class CreateWhatsAppTemplateDto {
  @IsString()
  name: string;

  @IsEnum(['MARKETING', 'UTILITY', 'AUTHENTICATION'])
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'video'])
  headerType?: 'text' | 'image' | 'video';

  @IsOptional()
  @IsString()
  headerText?: string;

  @IsOptional()
  @IsString()
  headerMediaUrl?: string;

  @IsString()
  bodyText: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsArray()
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}

/**
 * DTO for updating a WhatsApp template
 */
export class UpdateWhatsAppTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['MARKETING', 'UTILITY', 'AUTHENTICATION'])
  category?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'video'])
  headerType?: 'text' | 'image' | 'video';

  @IsOptional()
  @IsString()
  headerText?: string;

  @IsOptional()
  @IsString()
  headerMediaUrl?: string;

  @IsOptional()
  @IsString()
  bodyText?: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsArray()
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}

/**
 * DTO for creating a WhatsApp campaign
 */
export class CreateWhatsAppCampaignDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  templateId: string;

  @IsOptional()
  @IsString()
  audienceSegmentId?: string;

  @IsOptional()
  scheduledAt?: Date;
}

/**
 * DTO for creating a WhatsApp automation
 */
export class CreateWhatsAppAutomationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum([
    'NEW_SESSION',
    'GREETING',
    'MENU_REQUEST',
    'ORDER_PLACED',
    'PAYMENT_RECEIVED',
    'ORDER_READY',
    'DELIVERY_UPDATE',
    'CUSTOM_KEYWORD',
    'INACTIVITY_TIMEOUT',
    'FIRST_ORDER',
  ])
  trigger: 'NEW_SESSION' | 'GREETING' | 'MENU_REQUEST' | 'ORDER_PLACED' | 'PAYMENT_RECEIVED' | 'ORDER_READY' | 'DELIVERY_UPDATE' | 'CUSTOM_KEYWORD' | 'INACTIVITY_TIMEOUT' | 'FIRST_ORDER';

  @IsOptional()
  triggerConditions?: Record<string, any>;

  @IsEnum([
    'SEND_TEMPLATE',
    'SEND_TEXT',
    'SEND_CATALOG',
    'REQUEST_LOCATION',
    'REQUEST_CONTACT',
    'TRANSFER_TO_AGENT',
    'CREATE_ORDER',
    'APPLY_DISCOUNT',
    'SEND_MENU',
  ])
  action: 'SEND_TEMPLATE' | 'SEND_TEXT' | 'SEND_CATALOG' | 'REQUEST_LOCATION' | 'REQUEST_CONTACT' | 'TRANSFER_TO_AGENT' | 'CREATE_ORDER' | 'APPLY_DISCOUNT' | 'SEND_MENU';

  @IsOptional()
  actionConfig?: Record<string, any>;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsNumber()
  maxExecutions?: number;

  @IsOptional()
  @IsNumber()
  cooldownSeconds?: number;
}

/**
 * DTO for sending a message
 */
export class SendWhatsAppMessageDto {
  @IsString()
  to: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  templateLanguage?: string;

  @IsOptional()
  @IsArray()
  parameters?: Array<{ type: string; text: string }>;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  caption?: string;
}

/**
 * DTO for querying analytics
 */
export class WhatsAppAnalyticsQueryDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}
