import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames } from '../queue/queue.constants';

@Processor(QueueNames.NOTIFICATIONS, { concurrency: 5 })
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  async process(job: Job): Promise<{ sent: boolean; channel: string }> {
    const { type, to, subject, template, payload } = job.data;

    this.logger.debug(`Processing notification ${job.id}: ${type} to ${to}`);

    switch (type) {
      case 'email':
        return this.sendEmail(to, subject || '', template, payload);
      case 'sms':
        return this.sendSms(to, template, payload);
      case 'push':
        return this.sendPush(to, template, payload);
      case 'whatsapp':
        return this.sendWhatsApp(to, template, payload);
      default:
        this.logger.warn(`Unknown notification type: ${type}`);
        return { sent: false, channel: type };
    }
  }

  private async sendEmail(to: string, subject: string, _template: string, _payload: Record<string, unknown>) {
    // TODO: Integrate with email provider (SendGrid, AWS SES, etc.)
    // For now, log the intent
    this.logger.log(`EMAIL → ${to}: ${subject}`);
    return { sent: true, channel: 'email' };
  }

  private async sendSms(to: string, _template: string, _payload: Record<string, unknown>) {
    // TODO: Integrate with SMS provider (Twilio, MSG91, etc.)
    this.logger.log(`SMS → ${to}`);
    return { sent: true, channel: 'sms' };
  }

  private async sendPush(to: string, _template: string, _payload: Record<string, unknown>) {
    // TODO: Integrate with push provider (Firebase, OneSignal, etc.)
    this.logger.log(`PUSH → ${to}`);
    return { sent: true, channel: 'push' };
  }

  private async sendWhatsApp(to: string, _template: string, _payload: Record<string, unknown>) {
    // TODO: Integrate with WhatsApp Business API
    this.logger.log(`WHATSAPP → ${to}`);
    return { sent: true, channel: 'whatsapp' };
  }
}
