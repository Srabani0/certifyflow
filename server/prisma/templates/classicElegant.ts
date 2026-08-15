import { BASE_CSS, type CertificateTemplateDefinition } from './shared';

const THEME_CSS = `
.certificate {
  background: linear-gradient(180deg, #fdfaf3 0%, #faf3e2 100%);
  color: #3b2f0d;
  border: 2.5mm double #b8860b;
}
.org-name { color: #6b5316; }
.cert-kicker { color: #8a6d1f; }
.cert-title { color: #8a6d1f; font-family: Georgia, serif; }
.participant-name { color: #3b2f0d; }
.sig-line { border-color: #8a6d1f; }
.cert-id { color: #6b5316; }
.decoration-corner-tl, .decoration-corner-tr, .decoration-corner-bl, .decoration-corner-br {
  width: 22mm;
  height: 22mm;
  border: 0.6mm solid #b8860b;
}
.decoration-corner-tl { top: 6mm; left: 6mm; border-right: none; border-bottom: none; }
.decoration-corner-tr { top: 6mm; right: 6mm; border-left: none; border-bottom: none; }
.decoration-corner-bl { bottom: 6mm; left: 6mm; border-right: none; border-top: none; }
.decoration-corner-br { bottom: 6mm; right: 6mm; border-left: none; border-top: none; }
`.trim();

export const classicElegant: CertificateTemplateDefinition = {
  name: 'Classic Elegant',
  category: 'General',
  description: 'A timeless cream-and-gold design with a double border, suited for formal recognitions of any kind.',
  css: `${BASE_CSS}\n\n${THEME_CSS}`,
};
