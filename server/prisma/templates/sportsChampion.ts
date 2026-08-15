import { BASE_CSS, type CertificateTemplateDefinition } from './shared';

const THEME_CSS = `
.certificate {
  background: #ffffff;
  color: #1f1f1f;
  font-family: 'Segoe UI', Arial, sans-serif;
}
.decoration-corner-tr {
  top: 0;
  right: -30mm;
  width: 100mm;
  height: 22mm;
  background: linear-gradient(90deg, #f97316, #dc2626);
  transform: rotate(35deg);
  transform-origin: center;
}
.content { padding-top: 14mm; }
.org-name { color: #dc2626; letter-spacing: 2px; }
.cert-kicker { color: #f97316; font-weight: 700; }
.cert-title { color: #111827; font-weight: 900; text-transform: uppercase; }
.participant-name { color: #dc2626; font-style: normal; font-weight: 900; }
.subtitle, .event-line { color: #374151; }
.sig-line { border-color: #dc2626; }
.cert-id { color: #dc2626; }
.seal {
  display: flex;
  bottom: 34mm;
  left: 20mm;
  width: 24mm;
  height: 24mm;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #f97316);
  color: #fff;
  font-size: 8pt;
  font-weight: 700;
  text-align: center;
}
.seal::after { content: "★ CHAMPION ★"; padding: 0 3mm; }
`.trim();

export const sportsChampion: CertificateTemplateDefinition = {
  name: 'Sports Champion',
  category: 'Sports',
  description: 'A bold red-and-orange design with a diagonal stripe and medal badge, built for sports and competitions.',
  css: `${BASE_CSS}\n\n${THEME_CSS}`,
};
