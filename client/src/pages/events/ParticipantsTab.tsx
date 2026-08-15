import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiBlobRequest, apiRequest, buildQueryString } from '../../lib/api';
import { triggerBlobDownload } from '../../lib/download';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import type { CertificateTypeSummary, ParticipantSummary } from '../../lib/types';
import { CsvImportWizard } from './CsvImportWizard';

interface ParticipantsTabProps {
  eventId: string;
}

interface AddParticipantValues {
  fullName: string;
  email?: string;
  certificateTypeId?: string;
}

export function ParticipantsTab({ eventId }: ParticipantsTabProps): JSX.Element {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCertTypeId, setBulkCertTypeId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [certificateTypeFilter, setCertificateTypeFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const search = useDebouncedValue(searchInput, 300);

  const participantsQuery = useQuery({
    queryKey: ['events', eventId, 'participants', { search, certificateTypeFilter, sort }],
    queryFn: () =>
      apiRequest<{ participants: ParticipantSummary[] }>(
        `/events/${eventId}/participants${buildQueryString({ search, certificateTypeId: certificateTypeFilter, sort })}`,
      ),
  });

  const certificateTypesQuery = useQuery({
    queryKey: ['events', eventId, 'certificate-types'],
    queryFn: () => apiRequest<{ certificateTypes: CertificateTypeSummary[] }>(`/events/${eventId}/certificate-types`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddParticipantValues>();

  const addMutation = useMutation({
    mutationFn: (values: AddParticipantValues) =>
      apiRequest<{ participant: ParticipantSummary }>(`/events/${eventId}/participants`, {
        method: 'POST',
        body: { ...values, certificateTypeId: values.certificateTypeId || undefined },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      setIsAddOpen(false);
      reset();
      showToast('Participant added', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not add participant', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (participantId: string) =>
      apiRequest(`/events/${eventId}/participants/${participantId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      showToast('Participant removed', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not remove participant', 'error');
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/events/${eventId}/participants/assign-certificate-type`, {
        method: 'PATCH',
        body: { participantIds: selectedIds, certificateTypeId: bulkCertTypeId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'participants'] });
      setSelectedIds([]);
      setBulkCertTypeId('');
      showToast('Certificate type assigned', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not assign certificate type', 'error');
    },
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      apiBlobRequest(
        `/events/${eventId}/participants/export.csv${buildQueryString({ search, certificateTypeId: certificateTypeFilter, sort })}`,
      ),
    onSuccess: (blob) => {
      triggerBlobDownload(blob, 'participants.csv');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not export participants', 'error');
    },
  });

  const participants = participantsQuery.data?.participants ?? [];
  const certificateTypes = certificateTypesQuery.data?.certificateTypes ?? [];
  const hasActiveFilters = Boolean(search || certificateTypeFilter);

  function toggleSelected(id: string): void {
    setSelectedIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function handleImported(): void {
    queryClient.invalidateQueries({ queryKey: ['events', eventId, 'participants'] });
    queryClient.invalidateQueries({ queryKey: ['events', eventId] });
  }

  if (participantsQuery.isLoading) {
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
          {participants.length} participant{participants.length === 1 ? '' : 's'}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={participants.length === 0}
            isLoading={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
          >
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            Import CSV
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>Add participant</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Search"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-56"
        />
        <Select
          label="Certificate type"
          value={certificateTypeFilter}
          onChange={(event) => setCertificateTypeFilter(event.target.value)}
        >
          <option value="">All participants</option>
          <option value="unassigned">Unassigned</option>
          {certificateTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
        <Select label="Sort by" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A-Z)</option>
        </Select>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-sm text-brand-800">{selectedIds.length} selected</p>
          <Select value={bulkCertTypeId} onChange={(e) => setBulkCertTypeId(e.target.value)} className="max-w-xs">
            <option value="">Choose certificate type…</option>
            {certificateTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            disabled={!bulkCertTypeId}
            isLoading={bulkAssignMutation.isPending}
            onClick={() => bulkAssignMutation.mutate()}
          >
            Assign
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
            Clear
          </Button>
        </div>
      )}

      {participants.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching participants' : 'No participants yet'}
          description={
            hasActiveFilters
              ? 'Try a different search term or clear the filters.'
              : 'Add participants manually or import them in bulk from a CSV file.'
          }
          action={!hasActiveFilters && <Button onClick={() => setIsImportOpen(true)}>Import CSV</Button>}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                <tr>
                  <th className="w-10 px-5 py-3" />
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Certificate type</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(participant.id)}
                        onChange={() => toggleSelected(participant.id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">{participant.fullName}</td>
                    <td className="px-3 py-3 text-gray-600">{participant.email ?? '—'}</td>
                    <td className="px-3 py-3">
                      {participant.certificateType ? (
                        <Badge color="blue">{participant.certificateType.name}</Badge>
                      ) : (
                        <Badge color="gray">Unassigned</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (window.confirm(`Remove ${participant.fullName}?`)) {
                            deleteMutation.mutate(participant.id);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add participant">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => addMutation.mutate(values))}>
          <Input
            label="Full name"
            error={errors.fullName?.message}
            {...register('fullName', { required: 'Full name is required' })}
          />
          <Input label="Email (optional)" type="email" error={errors.email?.message} {...register('email')} />
          <Select label="Certificate type (optional)" {...register('certificateTypeId')}>
            <option value="">Unassigned</option>
            {certificateTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
          <Button type="submit" isLoading={addMutation.isPending} className="mt-2">
            Add participant
          </Button>
        </form>
      </Modal>

      <CsvImportWizard
        eventId={eventId}
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={handleImported}
      />
    </div>
  );
}
