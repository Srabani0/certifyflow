import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { apiRequest } from '../lib/api';
import type { AuditLogEntry } from '../lib/types';

const ACTION_LABELS: Record<string, string> = {
  'organization.updated': 'Updated organization settings',
  'organization.logo_updated': 'Updated organization logo',
  'event.created': 'Created event',
  'event.updated': 'Updated event',
  'event.deleted': 'Deleted event',
  'participants.imported': 'Imported participants',
  'certificate_type.created': 'Created certificate type',
  'certificate_type.updated': 'Updated certificate type',
  'certificate_type.deleted': 'Deleted certificate type',
  'certificates.batch_generated': 'Generated certificates',
  'certificate.revoked': 'Revoked a certificate',
  'certificate.emailed': 'Emailed a certificate',
};

function describeAction(entry: AuditLogEntry): string {
  return ACTION_LABELS[entry.action] ?? entry.action;
}

export function ActivityPage(): JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiRequest<{ logs: AuditLogEntry[] }>('/audit-logs'),
  });

  const logs = data?.logs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Activity</h1>
        <p className="mt-1 text-sm text-gray-500">Recent actions taken across your organization.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState title="No activity yet" description="Actions like creating events or generating certificates will show up here." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-3 py-3">Who</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-gray-900">{entry.actor?.fullName ?? '—'}</td>
                    <td className="px-3 py-3 text-gray-600">{describeAction(entry)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
