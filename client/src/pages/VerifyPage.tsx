import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { API_URL, apiRequest } from '../lib/api';
import type { VerifyResult } from '../lib/types';

export function VerifyPage(): JSX.Element {
  const { certificateId } = useParams<{ certificateId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['verify', certificateId],
    queryFn: () => apiRequest<VerifyResult>(`/verify/${certificateId}`),
    enabled: Boolean(certificateId),
    retry: false,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <Link to="/" className="text-2xl font-bold text-brand-700">
            CertifyFlow
          </Link>
          <p className="mt-1 text-sm text-gray-500">Certificate verification</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" className="text-brand-600" />
            </div>
          ) : !data || !data.valid ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
                ✕
              </div>
              <p className="text-lg font-semibold text-gray-900">Not a valid certificate</p>
              <p className="text-sm text-gray-500">{data?.reason ?? 'We could not verify this certificate.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
                  ✓
                </div>
                <p className="text-lg font-semibold text-gray-900">Certificate is valid</p>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Issued to</dt>
                  <dd className="font-medium text-gray-900">{data.certificate?.participantName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Certificate</dt>
                  <dd className="font-medium text-gray-900">{data.certificate?.certificateTypeTitle}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Event</dt>
                  <dd className="font-medium text-gray-900">{data.certificate?.eventName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Issued by</dt>
                  <dd className="font-medium text-gray-900">{data.certificate?.organizationName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Issued on</dt>
                  <dd className="font-medium text-gray-900">
                    {data.certificate ? new Date(data.certificate.issuedAt).toLocaleDateString() : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Certificate ID</dt>
                  <dd className="font-mono text-xs text-gray-700">{data.certificate?.certificateId}</dd>
                </div>
              </dl>
              <a
                href={`${API_URL}/verify/${certificateId}/download`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                View certificate PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
