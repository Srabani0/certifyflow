import { BASE_CSS, type CertificateTemplateDefinition } from './shared';

const THEME_CSS = `
.certificate {
  background: #fffdf7;
  color: #2a1414;
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  border: 1.2mm solid #5c1a1a;
}
.content { padding-top: 30mm; }
.org-name { color: #5c1a1a; letter-spacing: 3px; }
.cert-kicker { color: #7a2e2e; }
.cert-title { color: #5c1a1a; font-variant: small-caps; }
.participant-name { color: #2a1414; font-style: italic; }
.subtitle, .event-line { color: #3f2323; }
.issue-date { color: #6b4c4c; }
.sig-line { border-color: #5c1a1a; }
.cert-id { color: #5c1a1a; }
.seal {
  display: flex;
  top: 14mm;
  left: 50%;
  width: 22mm;
  height: 22mm;
  margin-left: -11mm;
  border-radius: 50%;
  border: 0.8mm solid #5c1a1a;
  box-shadow: 0 0 0 1mm #fffdf7, 0 0 0 1.4mm #5c1a1a;
  color: #5c1a1a;
  font-size: 7pt;
  letter-spacing: 1.5px;
  text-align: center;
}
.seal::after { content: "EST."; }
`.trim();

export const academicFormal: CertificateTemplateDefinition = {
  name: 'Academic Formal',
  category: 'Academic',
  description: 'A traditional ivory-and-maroon design with a formal emblem, fitting for academic and internship certificates.',
  css: `${BASE_CSS}\n\n${THEME_CSS}`,
};
