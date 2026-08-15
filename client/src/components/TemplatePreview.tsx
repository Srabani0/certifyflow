import { renderTemplate, type TemplateContext } from '../lib/templateEngine';
import type { CertificateTemplateSummary } from '../lib/types';

const PREVIEW_WIDTH_PX = 1122;
const PREVIEW_HEIGHT_PX = 793;

const QR_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
    '<rect width="100" height="100" fill="white"/>' +
    '<rect width="100" height="100" fill="none" stroke="black" stroke-width="4"/>' +
    '<rect x="10" y="10" width="25" height="25" fill="black"/>' +
    '<rect x="65" y="10" width="25" height="25" fill="black"/>' +
    '<rect x="10" y="65" width="25" height="25" fill="black"/>' +
    '<rect x="45" y="45" width="10" height="10" fill="black"/>' +
    '</svg>',
)}`;

const SAMPLE_CONTEXT: TemplateContext = {
  organizationName: 'Acme Organization',
  eventName: 'Annual Innovation Summit',
  certificateTitle: 'Achievement',
  certificateSubtitle: 'has demonstrated outstanding performance and dedication',
  participantName: 'Jordan Sample',
  issueDate: 'January 1, 2026',
  certificateId: 'CF-2026-SAMPLE01',
  verifyUrl: 'https://certifyflow.app/verify/CF-2026-SAMPLE01',
  qrCodeDataUrl: QR_PLACEHOLDER,
  signatories: [
    { name: 'Alex Rivera', designation: 'Program Director' },
    { name: 'Sam Lee', designation: 'Event Coordinator' },
  ],
};

function buildPreviewHtml(template: Pick<CertificateTemplateSummary, 'htmlContent' | 'cssContent'>): string {
  const body = renderTemplate(template.htmlContent, SAMPLE_CONTEXT);
  const css = renderTemplate(template.cssContent, SAMPLE_CONTEXT);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>* { box-sizing: border-box; } body { margin: 0; padding: 0; } ${css}</style>
</head>
<body>${body}</body>
</html>`;
}

interface TemplatePreviewProps {
  template: Pick<CertificateTemplateSummary, 'name' | 'htmlContent' | 'cssContent'>;
  displayWidth?: number;
}

export function TemplatePreview({ template, displayWidth = 320 }: TemplatePreviewProps): JSX.Element {
  const scale = displayWidth / PREVIEW_WIDTH_PX;
  const html = buildPreviewHtml(template);

  return (
    <div
      className="overflow-hidden rounded-t-xl border-b border-gray-200 bg-gray-50"
      style={{ width: displayWidth, height: PREVIEW_HEIGHT_PX * scale }}
    >
      <iframe
        title={template.name}
        srcDoc={html}
        style={{
          width: PREVIEW_WIDTH_PX,
          height: PREVIEW_HEIGHT_PX,
          border: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
