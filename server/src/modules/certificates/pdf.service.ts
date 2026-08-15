import type { CertificateTemplate, CertificateType } from '@prisma/client';
import QRCode from 'qrcode';
import { env } from '../../config/env';
import { getBrowser } from '../../lib/browser';
import { sanitizeMetadataFields } from '../../lib/participantFields';
import { renderTemplate, type TemplateContext } from '../../lib/templateEngine';

export interface SignatoryContext {
  [key: string]: string | undefined;
  name: string;
  designation: string;
  signatureImageUrl?: string;
}

export interface CertificateRenderInput {
  organizationName: string;
  organizationLogoUrl?: string | null;
  eventName: string;
  eventVenue?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  certificateType: Pick<CertificateType, 'title' | 'description' | 'signatories'>;
  template: Pick<CertificateTemplate, 'htmlContent' | 'cssContent'>;
  participantName: string;
  participantMetadata?: unknown;
  certificateId: string;
  issuedAt: Date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function parseSignatories(raw: CertificateType['signatories']): SignatoryContext[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((item) => typeof item === 'object' && item !== null && !Array.isArray(item))
    .map((item) => {
      const obj = item as unknown as Record<string, unknown>;
      return {
        name: typeof obj.name === 'string' ? obj.name : '',
        designation: typeof obj.designation === 'string' ? obj.designation : '',
        signatureImageUrl: typeof obj.signatureImageUrl === 'string' ? obj.signatureImageUrl : undefined,
      };
    });
}

export function buildVerifyUrl(certificateId: string): string {
  return `${env.PUBLIC_VERIFY_BASE_URL}/verify/${certificateId}`;
}

export async function buildCertificateHtml(input: CertificateRenderInput): Promise<string> {
  const verifyUrl = buildVerifyUrl(input.certificateId);
  const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });

  // Personalization pass: lets a certificate type's title/description reference
  // per-participant CSV columns (e.g. "for securing {{position}} in {{eventName}}")
  // before those resolved strings become the outer template's certificateTitle/Subtitle.
  const personalizationContext: TemplateContext = {
    ...sanitizeMetadataFields(input.participantMetadata),
    participantName: input.participantName,
    organizationName: input.organizationName,
    eventName: input.eventName,
    eventVenue: input.eventVenue ?? undefined,
    eventStartDate: input.eventStartDate ? formatDate(input.eventStartDate) : undefined,
    eventEndDate: input.eventEndDate ? formatDate(input.eventEndDate) : undefined,
    issueDate: formatDate(input.issuedAt),
    certificateId: input.certificateId,
  };

  const certificateTitle = renderTemplate(input.certificateType.title, personalizationContext);
  const certificateSubtitle = input.certificateType.description
    ? renderTemplate(input.certificateType.description, personalizationContext)
    : undefined;

  const context: TemplateContext = {
    ...personalizationContext,
    organizationLogoUrl: input.organizationLogoUrl ?? undefined,
    certificateTitle,
    certificateSubtitle,
    verifyUrl,
    qrCodeDataUrl,
    signatories: parseSignatories(input.certificateType.signatories),
  };

  const body = renderTemplate(input.template.htmlContent, context);
  const css = renderTemplate(input.template.cssContent, context);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; padding: 0; }
${css}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

export async function renderCertificatePdf(input: CertificateRenderInput): Promise<Buffer> {
  const html = await buildCertificateHtml(input);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
