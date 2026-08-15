import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, type BadgeColor } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiRequest } from '../../lib/api';
import type { EventStatus, EventSummary } from '../../lib/types';
import { EventForm, type EventFormValues } from './EventForm';

const STATUS_COLORS: Record<EventStatus, BadgeColor> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
  ARCHIVED: 'purple',
};

function toTitleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function EventsListPage(): JSX.Element {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => apiRequest<{ events: EventSummary[] }>('/events'),
  });

  const createMutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      apiRequest<{ event: EventSummary }>('/events', { method: 'POST', body: values }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreateOpen(false);
      navigate(`/events/${result.event.id}`);
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not create event', 'error');
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">Manage the events you issue certificates for.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>New event</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : !data || data.events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to start collecting participants and issuing certificates."
          action={<Button onClick={() => setIsCreateOpen(true)}>New event</Button>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100">
            {data.events.map((event) => (
              <li key={event.id}>
                <Link
                  to={`/events/${event.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {toTitleCase(event.type)} · {event._count?.participants ?? 0} participants ·{' '}
                      {event._count?.certificates ?? 0} certificates
                    </p>
                  </div>
                  <Badge color={STATUS_COLORS[event.status]}>{event.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New event">
        <EventForm
          onSubmit={(values) => createMutation.mutate(values)}
          isSubmitting={createMutation.isPending}
          submitLabel="Create event"
        />
      </Modal>
    </div>
  );
}
