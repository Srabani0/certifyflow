import { env } from '../config/env';
import { AppError } from '../errors/AppError';

const BREVO_API_BASE = 'https://api.brevo.com/v3';

interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

export function requireBrevoConfig(): BrevoConfig {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    throw AppError.badRequest(
      'Email sending is not configured on this server (missing BREVO_API_KEY/BREVO_SENDER_EMAIL)',
    );
  }
  return {
    apiKey: env.BREVO_API_KEY,
    senderEmail: env.BREVO_SENDER_EMAIL,
    senderName: env.BREVO_SENDER_NAME ?? 'CertifyFlow',
  };
}

export interface SendEmailInput {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  attachment?: { name: string; content: string }[];
}

export interface SendEmailResult {
  messageId: string;
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = requireBrevoConfig();

  const response = await fetch(`${BREVO_API_BASE}/smtp/email`, {
    method: 'POST',
    headers: {
      'api-key': config.apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: config.senderEmail, name: config.senderName },
      to: [input.to],
      subject: input.subject,
      htmlContent: input.htmlContent,
      ...(input.attachment && { attachment: input.attachment }),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw AppError.badRequest(`Brevo email send failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { messageId: string };
  return { messageId: data.messageId };
}

export interface BrevoEmailEvent {
  event: string;
  date: string;
}

export async function getMessageEvents(messageId: string): Promise<BrevoEmailEvent[]> {
  const config = requireBrevoConfig();

  const url = new URL(`${BREVO_API_BASE}/smtp/statistics/events`);
  url.searchParams.set('messageId', messageId);
  url.searchParams.set('limit', '50');

  const response = await fetch(url, {
    headers: { 'api-key': config.apiKey, accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw AppError.badRequest(`Brevo tracking lookup failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { events?: BrevoEmailEvent[] };
  return data.events ?? [];
}
