import { BASE_CSS, type CertificateTemplateDefinition } from './shared';

const THEME_CSS = `
.certificate {
  background:
    repeating-linear-gradient(0deg, rgba(57,255,136,0.05) 0px, rgba(57,255,136,0.05) 1px, transparent 1px, transparent 12mm),
    repeating-linear-gradient(90deg, rgba(57,255,136,0.05) 0px, rgba(57,255,136,0.05) 1px, transparent 1px, transparent 12mm),
    #0d1117;
  color: #c9d1d9;
  font-family: 'Consolas', 'Courier New', monospace;
}
.org-name { color: #39ff88; letter-spacing: 2px; }
.cert-kicker { color: #22d3ee; }
.cert-title { color: #ffffff; font-family: 'Segoe UI', sans-serif; font-weight: 700; }
.participant-name { color: #39ff88; font-style: normal; }
.subtitle, .event-line { color: #c9d1d9; }
.issue-date { color: #8b949e; }
.sig-line { border-color: #22d3ee; }
.sig-name { color: #e6edf3; }
.sig-title { color: #8b949e; }
.cert-id { color: #39ff88; }
.verify-text { color: #8b949e; }
.decoration-corner-tl, .decoration-corner-tr, .decoration-corner-bl, .decoration-corner-br {
  width: 14mm;
  height: 14mm;
  border: 0.6mm solid #39ff88;
}
.decoration-corner-tl { top: 8mm; left: 8mm; border-right: none; border-bottom: none; }
.decoration-corner-tr { top: 8mm; right: 8mm; border-left: none; border-bottom: none; }
.decoration-corner-bl { bottom: 8mm; left: 8mm; border-right: none; border-top: none; }
.decoration-corner-br { bottom: 8mm; right: 8mm; border-left: none; border-top: none; }
`.trim();

export const techHackathon: CertificateTemplateDefinition = {
  name: 'Tech Hackathon',
  category: 'Hackathon',
  description: 'A dark, terminal-inspired theme with neon accents and bracket corners, made for hackathons and dev events.',
  css: `${BASE_CSS}\n\n${THEME_CSS}`,
};
