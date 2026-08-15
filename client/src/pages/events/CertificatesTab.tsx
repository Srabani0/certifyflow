import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiBlobRequest, apiRequest } from '../../lib/api';
import { triggerBlobDownload } from '../../lib/download';
import type { CertificateSummary } from '../../lib/types';

interface CertificatesTabProps {
  eventId: string;
}

interface BatchGenerateResult {
  requested: number;
  generated: CertificateSummary[];
  skipped: { participantId: string; reason: string }[];
}

export function CertificatesTab({ eventId }: CertificatesTabProps): JSX.Element {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [lastResult, setLastResult] = useState<BatchGenerateResult | null>(null);
  const [detailCertificate, setDetailCertificate] = useState<CertificateSummary | null>(null);

  const certificatesQuery = useQuery({
    queryKey: ['events', eventId, 'certificates'],
    queryFn: () => apiRequest<{ certificates: CertificateSummary[] }>(`/events/${eventId}/certificates`),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiRequest<BatchGenerateResult>(`/events/${eventId}/certificates/generate`, { method: 'POST', body: {} }),
    onSuccess: (result) => {
      setLastResult(result);
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'certificates'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      showToast(
        `Generated ${result.generated.length} certificate${result.generated.length === 1 ? '' : 's'}`,
        'success',
      );
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not generate certificates', 'error');
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (certificate: CertificateSummary) =>
      apiBlobRequest(`/events/${eventId}/certificates/${certificate.id}/download`),
    onSuccess: (blob, certificate) => {
      triggerBlobDownload(blob, `${certificate.certificateId}.pdf`);
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not download certificate', 'error');
    },
  });

  const zipMutation = useMutation({
    mutationFn: () => apiBlobRequest(`/events/${eventId}/certificates/download-zip`, { method: 'POST', body: {} }),
    onSuccess: (blob) => {
      triggerBlobDownload(blob, `certificates-${eventId}.zip`);
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not download the ZIP archive', 'error');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (certificateRecordId: string) =>
      apiRequest(`/events/${eventId}/certificates/${certificateRecordId}/revoke`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'certificates'] });
      showToast('Certificate revoked', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not revoke certificate', 'error');
    },
  });

  const certificates = certificatesQuery.data?.certificates ?? [];

  if (certificatesQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {certificates.length} certificate{certificates.length === 1 ? '' : 's'} issued
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={certificates.length === 0}
            isLoading={zipMutation.isPending}
            onClick={() => zipMutation.mutate()}
          >
            Download all (ZIP)
          </Button>
          <Button isLoading={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
            Generate certificates
          </Button>
        </div>
      </div>

      {generateMutation.isPending && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <Spinner size="sm" />
          Generating certificates for eligible participants — this can take a moment for larger events.
        </div>
      )}

      {lastResult && !generateMutation.isPending && (
        <div className="rounded-lg bg-gray-50 p-4 text-sm">
          <p className="font-medium text-gray-900">
            Generated {lastResult.generated.length} of {lastResult.requested} participants
          </p>
          {lastResult.skipped.length > 0 && (
            <p className="mt-1 text-gray-600">
              {lastResult.skipped.length} skipped — most commonly because a participant has no certificate type
              assigned, or already has a certificate.
            </p>
          )}
        </div>
      )}

      {certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Assign certificate types to participants, then generate certificates for the event."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Participant</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Certificate ID</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Issued</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        className="font-medium text-gray-900 hover:text-brand-600"
                        onClick={() => setDetailCertificate(certificate)}
                      >
                        {certificate.participant?.fullName}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{certificate.certificateType?.name ?? '—'}</td>
                    <td className="px-3 py-3 text-gray-600">{certificate.certificateId}</td>
                    <td className="px-3 py-3">
                      <Badge color={certificate.status === 'REVOKED' ? 'red' : 'green'}>{certificate.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{new Date(certificate.issuedAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                          onClick={() => downloadMutation.mutate(certificate)}
                        >
                          Download
                        </button>
                        {certificate.status !== 'REVOKED' && (
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (window.confirm('Revoke this certificate? It will no longer verify as valid.')) {
                                revokeMutation.mutate(certificate.id);
                              }
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={Boolean(detailCertificate)} onClose={() => setDetailCertificate(null)} title="Certificate details">
        {detailCertificate && (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Participant</dt>
                <dd className="font-medium text-gray-900">{detailCertificate.participant?.fullName}</dd>
              </div>
              {detailCertificate.participant?.email && (
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium text-gray-900">{detailCertificate.participant.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Certificate type</dt>
                <dd className="font-medium text-gray-900">
                  {detailCertificate.certificateType?.name} — {detailCertificate.certificateType?.title}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Certificate ID</dt>
                <dd className="font-mono text-xs text-gray-700">{detailCertificate.certificateId}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <Badge color={detailCertificate.status === 'REVOKED' ? 'red' : 'green'}>
                    {detailCertificate.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Issued</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(detailCertificate.issuedAt).toLocaleString()}
                </dd>
              </div>
              {detailCertificate.revokedAt && (
                <div>
                  <dt className="text-gray-500">Revoked</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(detailCertificate.revokedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Verifications</dt>
                <dd className="font-medium text-gray-900">{detailCertificate.verificationCount}</dd>
              </div>
            </dl>
            <Button onClick={() => downloadMutation.mutate(detailCertificate)} isLoading={downloadMutation.isPending}>
              Download PDF
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
