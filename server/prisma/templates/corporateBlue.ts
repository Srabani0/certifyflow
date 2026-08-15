import { BASE_CSS, type CertificateTemplateDefinition } from './shared';

const THEME_CSS = `
.certificate {
  background: #ffffff;
  color: #111827;
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
}
.decoration-corner-tl {
  top: 0; left: 0; width: 100%; height: 14mm;
  background: #0b1f3a;
}
.decoration-corner-br {
  bottom: 0; right: 0; width: 100%; height: 4mm;
  background: #1d4ed8;
}
.content { padding-top: 22mm; }
.org-name { color: #0b1f3a; letter-spacing: 2px; }
.cert-kicker { color: #1d4ed8; font-weight: 600; }
.cert-title { color: #0b1f3a; }
.participant-name { color: #0b1f3a; font-style: normal; }
.subtitle, .event-line, .issue-date { color: #374151; }
.sig-line { border-color: #1d4ed8; }
.cert-id { color: #1d4ed8; }
`.trim();

export const corporateBlue: CertificateTemplateDefinition = {
  name: 'Corporate Blue',
  category: 'Workshop',
  description: 'A professional navy-and-blue layout well suited to workshops, internships, and training programs.',
  css: `${BASE_CSS}\n\n${THEME_CSS}`,
};
