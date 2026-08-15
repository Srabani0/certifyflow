export const CERTIFICATE_HTML = `
<div class="certificate">
  <div class="decoration decoration-corner-tl"></div>
  <div class="decoration decoration-corner-tr"></div>
  <div class="decoration decoration-corner-bl"></div>
  <div class="decoration decoration-corner-br"></div>
  <div class="seal"></div>
  <div class="content">
    <div class="header">
      <div class="org-name">{{organizationName}}</div>
      <div class="cert-kicker">Certificate of</div>
      <div class="cert-title">{{certificateTitle}}</div>
    </div>
    <div class="body">
      <div class="presented-to">This certificate is proudly presented to</div>
      <div class="participant-name">{{participantName}}</div>
      {{#if certificateSubtitle}}<div class="subtitle">{{certificateSubtitle}}</div>{{/if}}
      <div class="event-line">in recognition of participation in <strong>{{eventName}}</strong></div>
      <div class="issue-date">Issued on {{issueDate}}</div>
    </div>
    <div class="footer">
      <div class="signatories">
        {{#each signatories}}
        <div class="signatory">
          {{#if signatureImageUrl}}<img class="sig-img" src="{{signatureImageUrl}}" alt="" />{{/if}}
          <div class="sig-line"></div>
          <div class="sig-name">{{name}}</div>
          <div class="sig-title">{{designation}}</div>
        </div>
        {{/each}}
      </div>
      <div class="verify">
        <img class="qr" src="{{qrCodeDataUrl}}" alt="Verification QR code" />
        <div class="verify-text">
          <div class="cert-id">{{certificateId}}</div>
          <div class="verify-url">Verify at {{verifyUrl}}</div>
        </div>
      </div>
    </div>
  </div>
</div>
`.trim();

export interface CertificateTemplateDefinition {
  name: string;
  category: string;
  description: string;
  css: string;
}

// Structural/layout rules every template needs. Each template's final cssContent is
// BASE_CSS + its own theme rules, so every row stored in the DB stays fully
// self-contained (needed since the template gallery UI previews htmlContent/cssContent
// in isolation, without this file).
export const BASE_CSS = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
.certificate {
  width: 297mm;
  height: 210mm;
  position: relative;
  overflow: hidden;
  font-family: Georgia, 'Times New Roman', serif;
  color: #1a1a1a;
  background: #ffffff;
}
.content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  padding: 16mm 20mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
}
.org-name { font-size: 15pt; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
.cert-kicker { font-size: 11pt; letter-spacing: 4px; text-transform: uppercase; margin-top: 6mm; opacity: 0.85; }
.cert-title { font-size: 30pt; font-weight: 700; margin-top: 2mm; }
.body { margin-top: 4mm; }
.presented-to { font-size: 11pt; letter-spacing: 1px; }
.participant-name { font-size: 34pt; font-style: italic; font-weight: 700; margin: 4mm 0; }
.subtitle { font-size: 12pt; max-width: 190mm; margin: 0 auto 3mm; }
.event-line { font-size: 13pt; margin-top: 2mm; }
.issue-date { font-size: 10.5pt; margin-top: 3mm; opacity: 0.8; }
.footer { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; margin-top: 6mm; }
.signatories { display: flex; gap: 16mm; }
.signatory { width: 42mm; text-align: center; }
.sig-img { max-height: 10mm; max-width: 38mm; object-fit: contain; margin-bottom: 1mm; }
.sig-line { border-top: 0.4mm solid currentColor; opacity: 0.6; margin-bottom: 1.5mm; }
.sig-name { font-size: 10pt; font-weight: 700; }
.sig-title { font-size: 8.5pt; opacity: 0.75; }
.verify { display: flex; align-items: center; gap: 3mm; }
.qr { width: 18mm; height: 18mm; }
.verify-text { text-align: left; font-size: 7.5pt; opacity: 0.8; }
.cert-id { font-weight: 700; letter-spacing: 0.5px; }
.decoration { position: absolute; z-index: 1; pointer-events: none; }
.seal { position: absolute; z-index: 1; display: none; align-items: center; justify-content: center; }
`.trim();
