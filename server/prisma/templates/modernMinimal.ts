import { BASE_CSS, type CertificateTemplateDefinition } from './shared';

const THEME_CSS = `
.certificate {
  background: #ffffff;
  color: #1f2937;
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
}
.content { border-top: 1.2mm solid #0f766e; }
.org-name { color: #0f766e; letter-spacing: 3px; }
.cert-kicker { color: #6b7280; font-weight: 400; }
.cert-title { color: #111827; font-weight: 300; letter-spacing: 1px; }
.participant-name { color: #111827; font-style: normal; font-weight: 700; }
.subtitle, .event-line, .issue-date { color: #4b5563; }
.sig-line { border-color: #0f766e; }
.cert-id { color: #0f766e; }
`.trim();

export const modernMinimal: CertificateTemplateDefinition = {
  name: 'Modern Minimal',
  category: 'General',
  description: 'Clean whitespace, a single accent line, and sans-serif type for a contemporary, no-frills certificate.',
  css: `${BASE_CSS}\n\n${THEME_CSS}`,
};
