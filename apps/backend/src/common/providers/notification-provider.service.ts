import { Injectable, Logger } from '@nestjs/common';

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
}

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
}

export interface SmsPayload {
  to: string;
  message: string;
  from?: string;
}

export interface WhatsAppPayload {
  to: string;
  message: string;
  templateName?: string;
  templateLanguage?: string;
  templateParams?: string[];
  phoneNumberId?: string;
  accessToken?: string;
  from?: string;
}

/**
 * Unified notification provider service.
 * Supports email (SendGrid/SMTP), push (Firebase), and SMS (Twilio/MSG91).
 * Falls back gracefully when provider credentials are not configured.
 */
@Injectable()
export class NotificationProviderService {
  private readonly logger = new Logger(NotificationProviderService.name);

  constructor() {}

  // ─── Email ───

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const provider = process.env.EMAIL_PROVIDER || 'log';

    switch (provider) {
      case 'sendgrid':
        return this.sendViaSendGrid(payload);
      case 'smtp':
        return this.sendViaSmtp(payload);
      case 'ses':
        return this.sendViaSes(payload);
      default:
        this.logger.log(`[EMAIL-LOG] To: ${payload.to} | Subject: ${payload.subject}`);
        this.logger.log(`[EMAIL-LOG] Body: ${payload.text || payload.html?.substring(0, 200)}`);
        return { success: true, messageId: `log-${Date.now()}` };
    }
  }

  private async sendViaSendGrid(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = payload.from || process.env.EMAIL_FROM || 'noreply@nexaros.in';

    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY not configured, falling back to log');
      return this.sendEmail({ ...payload, to: payload.to });
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: fromEmail },
          subject: payload.subject,
          content: [
            ...(payload.text ? [{ type: 'text/plain', value: payload.text }] : []),
            ...(payload.html ? [{ type: 'text/html', value: payload.html }] : []),
          ],
        }),
      });

      if (response.ok) {
        return { success: true, messageId: response.headers.get('x-message-id') || undefined };
      }

      const errorBody = await response.text();
      this.logger.error(`SendGrid error ${response.status}: ${errorBody}`);
      return { success: false, error: `SendGrid ${response.status}: ${errorBody.substring(0, 200)}` };
    } catch (err) {
      this.logger.error(`SendGrid request failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  private async sendViaSmtp(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
      this.logger.warn('SMTP_HOST not configured, falling back to log');
      return this.sendEmail({ ...payload, to: payload.to });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host, port, secure: port === 465,
        auth: user ? { user, pass } : undefined,
      });

      const info = await transporter.sendMail({
        from: payload.from || process.env.EMAIL_FROM || 'noreply@nexaros.in',
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      this.logger.error(`SMTP send failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  private async sendViaSes(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const region = process.env.AWS_SES_REGION || 'ap-south-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId) {
      this.logger.warn('AWS_ACCESS_KEY_ID not configured, falling back to log');
      return this.sendEmail({ ...payload, to: payload.to });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
      const ses = new SESClient({ region, credentials: { accessKeyId, secretAccessKey } });

      const result = await ses.send(new SendEmailCommand({
        Source: payload.from || process.env.EMAIL_FROM || 'noreply@nexaros.in',
        Destination: { ToAddresses: [payload.to] },
        Message: {
          Subject: { Data: payload.subject },
          Body: {
            ...(payload.text ? { Text: { Data: payload.text } } : {}),
            ...(payload.html ? { Html: { Data: payload.html } } : {}),
          },
        },
      }));

      return { success: true, messageId: result.MessageId };
    } catch (err) {
      this.logger.error(`SES send failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  // ─── Push Notifications ───

  async sendPush(payload: PushPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const provider = process.env.PUSH_PROVIDER || 'log';

    switch (provider) {
      case 'firebase':
        return this.sendViaFirebase(payload);
      case 'onesignal':
        return this.sendViaOneSignal(payload);
      default:
        this.logger.log(`[PUSH-LOG] Token: ${payload.token.substring(0, 20)}... | Title: ${payload.title}`);
        return { success: true, messageId: `log-${Date.now()}` };
    }
  }

  private async sendViaFirebase(payload: PushPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase credentials not configured, falling back to log');
      return this.sendPush({ ...payload, token: payload.token });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin').default;

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') }),
        });
      }

      const result = await admin.messaging().send({
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        },
        data: payload.data,
        android: { priority: 'high', notification: { sound: payload.sound || 'default' } },
        apns: { payload: { aps: { sound: payload.sound || 'default', badge: payload.badge } } },
      });

      return { success: true, messageId: result };
    } catch (err) {
      this.logger.error(`Firebase push failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  private async sendViaOneSignal(payload: PushPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      this.logger.warn('OneSignal credentials not configured, falling back to log');
      return this.sendPush({ ...payload, token: payload.token });
    }

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${apiKey}` },
        body: JSON.stringify({
          app_id: appId,
          include_player_ids: [payload.token],
          headings: { en: payload.title },
          contents: { en: payload.body },
          data: payload.data,
          ...(payload.imageUrl ? { big_picture: payload.imageUrl } : {}),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        return { success: true, messageId: result.id };
      }
      return { success: false, error: result.errors?.[0] || 'OneSignal error' };
    } catch (err) {
      this.logger.error(`OneSignal push failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  // ─── SMS ───

  async sendSms(payload: SmsPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const provider = process.env.SMS_PROVIDER || 'log';

    switch (provider) {
      case 'twilio':
        return this.sendViaTwilio(payload);
      case 'msg91':
        return this.sendViaMsg91(payload);
      default:
        this.logger.log(`[SMS-LOG] To: ${payload.to} | Message: ${payload.message.substring(0, 100)}`);
        return { success: true, messageId: `log-${Date.now()}` };
    }
  }

  private async sendViaTwilio(payload: SmsPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = payload.from || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn('Twilio credentials not configured, falling back to log');
      return this.sendSms({ ...payload, to: payload.to });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio')(accountSid, authToken);
      const message = await twilio.messages.create({
        body: payload.message,
        from: fromNumber,
        to: payload.to,
      });
      return { success: true, messageId: message.sid };
    } catch (err) {
      this.logger.error(`Twilio SMS failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  private async sendViaMsg91(payload: SmsPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiKey = process.env.MSG91_API_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!apiKey) {
      this.logger.warn('MSG91_API_KEY not configured, falling back to log');
      return this.sendSms({ ...payload, to: payload.to });
    }

    try {
      const response = await fetch('https://api.msg91.com/api/v5/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authkey: apiKey },
        body: JSON.stringify({
          flow_id: templateId,
          recipients: [{ mobiles: `91${payload.to}`, VAR1: payload.message }],
        }),
      });

      const result = await response.json();
      return { success: result.type === 'success', messageId: result.request_id, error: result.message };
    } catch (err) {
      this.logger.error(`MSG91 SMS failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  // ─── Batch Operations ───

  async sendBatchEmail(payloads: EmailPayload[]): Promise<{ success: boolean; results: { to: string; success: boolean; error?: string }[] }> {
    const results = await Promise.allSettled(
      payloads.map(async (p) => {
        const result = await this.sendEmail(p);
        return { to: p.to, success: result.success, error: result.error };
      })
    );

    return {
      success: results.every(r => r.status === 'fulfilled' && r.value.success),
      results: results.map(r => r.status === 'fulfilled' ? r.value : { to: '', success: false, error: (r.reason as Error)?.message }),
    };
  }

  async sendBatchPush(payloads: PushPayload[]): Promise<{ success: boolean; results: { token: string; success: boolean; error?: string }[] }> {
    const results = await Promise.allSettled(
      payloads.map(async (p) => {
        const result = await this.sendPush(p);
        return { token: p.token.substring(0, 20), success: result.success, error: result.error };
      })
    );

    return {
      success: results.every(r => r.status === 'fulfilled' && r.value.success),
      results: results.map(r => r.status === 'fulfilled' ? r.value : { token: '', success: false, error: (r.reason as Error)?.message }),
    };
  }

  // ─── WhatsApp ───

  async sendWhatsApp(payload: WhatsAppPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const provider = process.env.WHATSAPP_PROVIDER || 'log';

    switch (provider) {
      case 'cloud_api':
        return this.sendViaWhatsAppCloudApi(payload);
      case 'twilio':
        return this.sendViaTwilioWhatsApp(payload);
      default:
        this.logger.log(`[WHATSAPP-LOG] To: ${payload.to} | Message: ${payload.message.substring(0, 100)}`);
        return { success: true, messageId: `log-${Date.now()}` };
    }
  }

  private async sendViaWhatsAppCloudApi(payload: WhatsAppPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const phoneNumberId = payload.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = payload.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      this.logger.warn('WhatsApp Cloud API credentials not configured, falling back to log');
      return this.sendWhatsApp({ ...payload, to: payload.to });
    }

    try {
      const apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
      const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: payload.to,
          type: payload.templateName ? 'template' : 'text',
          ...(payload.templateName ? {
            template: {
              name: payload.templateName,
              language: { code: payload.templateLanguage || 'en' },
              ...(payload.templateParams && {
                components: [{
                  type: 'body',
                  parameters: payload.templateParams.map(p => ({ type: 'text', text: p })),
                }],
              }),
            },
          } : {
            text: { body: payload.message },
          }),
        }),
      });

      const result = await response.json();

      if (response.ok && result.messages?.[0]?.id) {
        return { success: true, messageId: result.messages[0].id };
      }

      return { success: false, error: result.error?.message || 'WhatsApp send failed' };
    } catch (err) {
      this.logger.error(`WhatsApp Cloud API failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  private async sendViaTwilioWhatsApp(payload: WhatsAppPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = payload.from || process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn('Twilio WhatsApp credentials not configured, falling back to log');
      return this.sendWhatsApp({ ...payload, to: payload.to });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio')(accountSid, authToken);
      const message = await twilio.messages.create({
        body: payload.message,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${payload.to}`,
      });
      return { success: true, messageId: message.sid };
    } catch (err) {
      this.logger.error(`Twilio WhatsApp failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  async sendBatchWhatsApp(payloads: WhatsAppPayload[]): Promise<{ success: boolean; results: { to: string; success: boolean; error?: string }[] }> {
    const results = await Promise.allSettled(
      payloads.map(async (p) => {
        const result = await this.sendWhatsApp(p);
        return { to: p.to, success: result.success, error: result.error };
      })
    );

    return {
      success: results.every(r => r.status === 'fulfilled' && r.value.success),
      results: results.map(r => r.status === 'fulfilled' ? r.value : { to: '', success: false, error: (r.reason as Error)?.message }),
    };
  }
}
