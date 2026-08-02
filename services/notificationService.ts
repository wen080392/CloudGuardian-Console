import { prisma } from './db';
import axios from 'axios';
import nodemailer from 'nodemailer';

export class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  /** True quando SMTP está configurado (EMAIL_HOST/USER/PASS). */
  emailConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Email direto para um destinatário arbitrário (ex.: lead sem conta),
   * fora do fluxo de NotificationSetting por tenant. No-op sem SMTP.
   * Lança em falha de envio — quem chama decide se degrada.
   */
  async sendDirectEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) return false;
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'notifications@cloudguardian.io',
      to,
      subject,
      html,
    });
    return true;
  }

  async sendNotification(tenantId: string, eventType: string, title: string, message: string, details?: any) {
    const settings = await prisma.notificationSetting.findUnique({
      where: { tenantId }
    });

    if (!settings) return;

    if (!settings.enabledEvents.includes(eventType)) return;

    const promises = [];

    if (settings.slackWebhook) {
      promises.push(this.sendSlack(settings.slackWebhook, title, message, details));
    }

    if (settings.teamsWebhook) {
      promises.push(this.sendTeams(settings.teamsWebhook, title, message, details));
    }

    if (settings.emailRecipients && settings.emailRecipients.length > 0 && this.transporter) {
      promises.push(this.sendEmail(settings.emailRecipients, title, message, details));
    }

    await Promise.allSettled(promises);
  }

  private async sendSlack(webhookUrl: string, title: string, message: string, details?: any) {
    try {
        const payload: any = {
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `🔔 ${title}`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: message,
              },
            },
          ],
        };
        if (details) {
          payload.blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
            },
          });
        }
        await axios.post(webhookUrl, payload);
    } catch(e) {
        console.error("Failed to send Slack notification", e);
    }
  }

  private async sendTeams(webhookUrl: string, title: string, message: string, details?: any) {
    try {
        const payload: any = {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          summary: title,
          themeColor: '0072C6',
          sections: [
            {
              activityTitle: title,
              text: message,
            },
          ],
        };
        if (details) {
          payload.sections.push({
            text: `\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
          });
        }
        await axios.post(webhookUrl, payload);
    } catch(e) {
        console.error("Failed to send Teams notification", e);
    }
  }

  private async sendEmail(recipients: string[], title: string, message: string, details?: any) {
    if (!this.transporter) return;
    try {
        const html = `
          <h2>${title}</h2>
          <p>${message}</p>
          ${details ? `<pre>${JSON.stringify(details, null, 2)}</pre>` : ''}
        `;
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || 'notifications@cloudguardian.io',
          to: recipients.join(', '),
          subject: title,
          html,
        });
    } catch(e) {
        console.error("Failed to send Email notification", e);
    }
  }
}
