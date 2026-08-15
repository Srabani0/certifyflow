import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, type BadgeColor } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiRequest, buildQueryString } from '../../lib/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import type { EventStatus, EventSummary, EventType } from '../../lib/types';
import { EVENT_STATUSES, EVENT_TYPES, EventForm, toTitleCase, type EventFormValues } from './EventForm';

const STATUS_COLORS: Record<EventStatus, BadgeColor> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
  ARCHIVED: 'purple',
};

export function EventsListPage(): JSX.Element {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<EventStatus | ''>('');
  const [type, setType] = useState<EventType | ''>('');
  const [sort, setSort] = useState('newest');
  const search = useDebouncedValue(searchInput, 300);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['events', { search, status, type, sort }],
    queryFn: () =>
      apiRequest<{ events: EventSummary[] }>(`/events${buildQueryString({ search, status, type, sort })}`),
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

  const events = data?.events ?? [];
  const hasActiveFilters = Boolean(search || status || type);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">Manage the events you issue certificates for.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>New event</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Search"
          placeholder="Search by event name…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-56"
        />
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as EventStatus | '')}>
          <option value="">All statuses</option>
          {EVENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {toTitleCase(value)}
            </option>
          ))}
        </Select>
        <Select label="Type" value={type} onChange={(event) => setType(event.target.value as EventType | '')}>
          <option value="">All types</option>
          {EVENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {toTitleCase(value)}
            </option>
          ))}
        </Select>
        <Select label="Sort by" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A-Z)</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching events' : 'No events yet'}
          description={
            hasActiveFilters
              ? 'Try a different search term or clear the filters.'
              : 'Create your first event to start collecting participants and issuing certificates.'
          }
          action={!hasActiveFilters && <Button onClick={() => setIsCreateOpen(true)}>New event</Button>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100">
            {events.map((event) => (
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
