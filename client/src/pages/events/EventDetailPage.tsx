import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, type BadgeColor } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Tabs, type TabItem } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiRequest } from '../../lib/api';
import type { EventStatus, EventSummary } from '../../lib/types';
import { CertificateTypesTab } from './CertificateTypesTab';
import { CertificatesTab } from './CertificatesTab';
import { EventForm, type EventFormValues } from './EventForm';
import { ParticipantsTab } from './ParticipantsTab';

const STATUS_COLORS: Record<EventStatus, BadgeColor> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
  ARCHIVED: 'purple',
};

const TABS: TabItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'participants', label: 'Participants' },
  { key: 'certificate-types', label: 'Certificate Types' },
  { key: 'certificates', label: 'Certificates' },
];

function toTitleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function toDateInputValue(value: string | null): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}

export function EventDetailPage(): JSX.Element {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => apiRequest<{ event: EventSummary }>(`/events/${eventId}`),
    enabled: Boolean(eventId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      apiRequest<{ event: EventSummary }>(`/events/${eventId}`, { method: 'PATCH', body: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEditOpen(false);
      showToast('Event updated', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not update event', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      showToast('Event deleted', 'success');
      navigate('/events');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not delete event', 'error');
    },
  });

  if (!eventId) {
    return <p className="text-sm text-gray-500">Event not found.</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  const { event } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>
            <Badge color={STATUS_COLORS[event.status]}>{event.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {toTitleCase(event.type)}
            {event.location ? ` · ${event.location}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm('Delete this event and all of its participants, certificate types, and certificates?')) {
                deleteMutation.mutate();
              }
            }}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <Card>
          <CardBody className="flex flex-col gap-3">
            {event.description && <p className="text-sm text-gray-700">{event.description}</p>}
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Start date</dt>
                <dd className="text-gray-900">
                  {event.startDate ? new Date(event.startDate).toLocaleDateString() : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">End date</dt>
                <dd className="text-gray-900">{event.endDate ? new Date(event.endDate).toLocaleDateString() : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Participants</dt>
                <dd className="text-gray-900">{event._count?.participants ?? 0}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Certificates issued</dt>
                <dd className="text-gray-900">{event._count?.certificates ?? 0}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      )}

      {activeTab === 'participants' && <ParticipantsTab eventId={eventId} />}
      {activeTab === 'certificate-types' && <CertificateTypesTab eventId={eventId} />}
      {activeTab === 'certificates' && <CertificatesTab eventId={eventId} />}

      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit event">
        <EventForm
          defaultValues={{
            name: event.name,
            description: event.description ?? undefined,
            type: event.type,
            status: event.status,
            startDate: toDateInputValue(event.startDate),
            endDate: toDateInputValue(event.endDate),
            location: event.location ?? undefined,
          }}
          onSubmit={(values) => updateMutation.mutate(values)}
          isSubmitting={updateMutation.isPending}
          submitLabel="Save changes"
        />
      </Modal>
    </div>
  );
}
