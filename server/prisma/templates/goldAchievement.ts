import { BASE_CSS, type CertificateTemplateDefinition } from './shared';

const THEME_CSS = `
.certificate {
  background: radial-gradient(circle at 50% 0%, #2b1710 0%, #1a0e08 65%);
  color: #f3e3b3;
  border: 2.5mm double #d4af37;
}
.org-name { color: #f5d576; letter-spacing: 3px; }
.cert-kicker { color: #d4af37; }
.cert-title { color: #f5d576; font-family: Georgia, serif; }
.participant-name { color: #ffffff; }
.subtitle, .event-line { color: #e8d9ad; }
.issue-date { color: #c9b26a; }
.sig-line { border-color: #d4af37; }
.sig-name, .sig-title { color: #f3e3b3; }
.cert-id, .verify-text { color: #d4af37; }
.seal {
  display: flex;
  top: 20mm;
  right: 24mm;
  width: 26mm;
  height: 26mm;
  border-radius: 50%;
  border: 1mm solid #d4af37;
  box-shadow: 0 0 0 1.5mm rgba(212, 175, 55, 0.25) inset;
  color: #f5d576;
  font-size: 8pt;
  letter-spacing: 2px;
  text-align: center;
  transform: rotate(-8deg);
}
.seal::after { content: "AWARD"; }
`.trim();

export const goldAchievement: CertificateTemplateDefinition = {
  name: 'Gold Achievement',
  category: 'Award',
  description: 'A dramatic dark-and-gold design with a medallion seal, built for top performers and award winners.',
  css: `${BASE_CSS}\n\n${THEME_CSS}`,
};
