export type EventType =
  | 'FEST'
  | 'HACKATHON'
  | 'WORKSHOP'
  | 'INTERNSHIP'
  | 'SPORTS'
  | 'CONFERENCE'
  | 'SEMINAR'
  | 'TRAINING'
  | 'OTHER';

export type EventStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type CertificateStatus = 'GENERATED' | 'REVOKED';

export interface EventSummary {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { participants: number; certificates: number };
}

export interface CertificateTemplateSummary {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  htmlContent: string;
  cssContent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Signatory {
  name: string;
  designation: string;
  signatureImageUrl?: string | null;
}

export interface CertificateTypeSummary {
  id: string;
  eventId: string;
  certificateTemplateId: string;
  name: string;
  title: string;
  description: string | null;
  signatories: Signatory[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantSummary {
  id: string;
  eventId: string;
  certificateTypeId: string | null;
  certificateType?: { id: string; name: string } | null;
  fullName: string;
  email: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateSummary {
  id: string;
  certificateId: string;
  organizationId: string;
  eventId: string;
  certificateTypeId: string;
  participantId: string;
  pdfPath: string;
  status: CertificateStatus;
  issuedAt: string;
  revokedAt: string | null;
  verificationCount: number;
  createdAt: string;
  participant?: { id: string; fullName: string; email: string | null };
  certificateType?: { id: string; name: string; title: string };
}

export interface CsvImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export interface CsvPreviewResult {
  headers: string[];
  suggestedMapping: { nameColumn?: string; emailColumn?: string; categoryColumn?: string };
  rows: Record<string, string>[];
  totalRows: number;
  certificateTypes: { id: string; name: string }[];
}

export interface CsvMapping {
  nameColumn: string;
  emailColumn?: string;
  categoryColumn?: string;
}

export interface VerifiedCertificateInfo {
  certificateId: string;
  participantName: string;
  eventName: string;
  organizationName: string;
  certificateTypeName: string;
  certificateTypeTitle: string;
  issuedAt: string;
  revokedAt: string | null;
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
  certificate?: VerifiedCertificateInfo;
}

export interface DashboardSummary {
  totalEvents: number;
  activeEvents: number;
  totalParticipants: number;
  totalCertificatesIssued: number;
  totalVerifications: number;
  recentEvents: { id: string; name: string; status: EventStatus; createdAt: string }[];
  recentCertificates: {
    id: string;
    certificateId: string;
    participantName: string;
    eventName: string;
    issuedAt: string;
  }[];
}
