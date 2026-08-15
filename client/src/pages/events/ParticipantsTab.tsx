import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
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
import { ApiError, apiRequest } from '../../lib/api';
import type { CertificateTypeSummary, CsvImportResult, ParticipantSummary } from '../../lib/types';

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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const participantsQuery = useQuery({
    queryKey: ['events', eventId, 'participants'],
    queryFn: () => apiRequest<{ participants: ParticipantSummary[] }>(`/events/${eventId}/participants`),
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

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest<CsvImportResult>(`/events/${eventId}/participants/import`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not import CSV', 'error');
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

  const participants = participantsQuery.data?.participants ?? [];
  const certificateTypes = certificateTypesQuery.data?.certificateTypes ?? [];

  function toggleSelected(id: string): void {
    setSelectedIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function closeImportModal(): void {
    setIsImportOpen(false);
    setCsvFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            Import CSV
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>Add participant</Button>
        </div>
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
          title="No participants yet"
          description="Add participants manually or import them in bulk from a CSV file."
          action={<Button onClick={() => setIsImportOpen(true)}>Import CSV</Button>}
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

      <Modal open={isImportOpen} onClose={closeImportModal} title="Import participants from CSV">
        <div className="flex flex-col gap-4">
          {!importResult ? (
            <>
              <p className="text-sm text-gray-600">
                Upload a CSV file with a header row. We&apos;ll look for a name column (e.g. &quot;Name&quot; or
                &quot;Full Name&quot;) and an optional email column — any other columns are kept as extra participant
                data.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <Button
                disabled={!csvFile}
                isLoading={importMutation.isPending}
                onClick={() => csvFile && importMutation.mutate(csvFile)}
              >
                Upload and import
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-900">
                  Imported {importResult.imported} of {importResult.totalRows} rows
                </p>
                {importResult.skipped > 0 && (
                  <p className="mt-1 text-gray-600">{importResult.skipped} rows were skipped.</p>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importResult.errors.map((error, index) => (
                        <tr key={`${error.row}-${index}`}>
                          <td className="px-3 py-2">{error.row}</td>
                          <td className="px-3 py-2 text-gray-600">{error.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button onClick={closeImportModal}>Done</Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
