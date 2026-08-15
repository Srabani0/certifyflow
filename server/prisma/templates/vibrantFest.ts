import { BASE_CSS, type CertificateTemplateDefinition } from './shared';

const THEME_CSS = `
.certificate {
  background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f59e0b 100%);
  font-family: 'Trebuchet MS', Verdana, sans-serif;
}
.content {
  margin: 10mm;
  width: calc(100% - 20mm);
  height: calc(100% - 20mm);
  background: #ffffff;
  border-radius: 6mm;
  box-shadow: 0 4mm 8mm rgba(0,0,0,0.2);
  color: #3b0764;
}
.org-name { color: #ec4899; letter-spacing: 2px; }
.cert-kicker { color: #7c3aed; font-weight: 700; }
.cert-title { color: #3b0764; }
.participant-name { color: #ec4899; font-style: normal; }
.subtitle, .event-line { color: #6b21a8; }
.issue-date { color: #9333ea; }
.sig-line { border-color: #ec4899; }
.cert-id { color: #ec4899; }
.decoration {
  width: 8mm;
  height: 8mm;
  border-radius: 50%;
}
.decoration-corner-tl { top: 4mm; left: 4mm; background: #fbbf24; }
.decoration-corner-tr { top: 4mm; right: 4mm; background: #34d399; }
.decoration-corner-bl { bottom: 4mm; left: 4mm; background: #60a5fa; }
.decoration-corner-br { bottom: 4mm; right: 4mm; background: #f472b6; }
`.trim();

export const vibrantFest: CertificateTemplateDefinition = {
  name: 'Vibrant Fest',
  category: 'Fest',
  description: 'A colorful gradient design with a floating white card and confetti dots, made for fests and cultural events.',
  css: `${BASE_CSS}\n\n${THEME_CSS}`,
};
