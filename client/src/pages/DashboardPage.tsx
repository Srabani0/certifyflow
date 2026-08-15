import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge, type BadgeColor } from '../components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { apiRequest } from '../lib/api';
import type { DashboardSummary, EventStatus } from '../lib/types';

const STATUS_COLORS: Record<EventStatus, BadgeColor> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
  ARCHIVED: 'purple',
};

function StatCard({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <Card>
      <CardBody>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value.toLocaleString()}</p>
      </CardBody>
    </Card>
  );
}

export function DashboardPage(): JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiRequest<DashboardSummary>('/dashboard/summary'),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">An overview of your events and certificates.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Events" value={data.totalEvents} />
        <StatCard label="Active events" value={data.activeEvents} />
        <StatCard label="Participants" value={data.totalParticipants} />
        <StatCard label="Certificates issued" value={data.totalCertificatesIssued} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent events</CardTitle>
            <Link to="/events" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {data.recentEvents.length === 0 ? (
              <EmptyState title="No events yet" description="Create your first event to get started." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.recentEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between py-3">
                    <Link to={`/events/${event.id}`} className="text-sm font-medium text-gray-900 hover:text-brand-600">
                      {event.name}
                    </Link>
                    <Badge color={STATUS_COLORS[event.status]}>{event.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently issued certificates</CardTitle>
          </CardHeader>
          <CardBody>
            {data.recentCertificates.length === 0 ? (
              <EmptyState title="No certificates yet" description="Certificates you generate will show up here." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.recentCertificates.map((certificate) => (
                  <li key={certificate.id} className="py-3">
                    <p className="text-sm font-medium text-gray-900">{certificate.participantName}</p>
                    <p className="text-xs text-gray-500">
                      {certificate.eventName} · {certificate.certificateId}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="text-sm text-gray-500">
        Total verifications across all certificates:{' '}
        <span className="font-medium text-gray-900">{data.totalVerifications}</span>
      </div>
    </div>
  );
}
