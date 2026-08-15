import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { TemplatePreview } from '../../components/TemplatePreview';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiBlobRequest, apiRequest } from '../../lib/api';
import { openBlobInNewTab } from '../../lib/download';
import type { CertificateTemplateSummary, CertificateTypeSummary } from '../../lib/types';
import { CertificateTypeForm, type CertificateTypeFormValues } from './CertificateTypeForm';

interface CertificateTypesTabProps {
  eventId: string;
}

export function CertificateTypesTab({ eventId }: CertificateTypesTabProps): JSX.Element {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingType, setEditingType] = useState<CertificateTypeSummary | null>(null);

  const certificateTypesQuery = useQuery({
    queryKey: ['events', eventId, 'certificate-types'],
    queryFn: () => apiRequest<{ certificateTypes: CertificateTypeSummary[] }>(`/events/${eventId}/certificate-types`),
  });

  const templatesQuery = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: () => apiRequest<{ templates: CertificateTemplateSummary[] }>('/certificate-templates'),
  });

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: ['events', eventId, 'certificate-types'] });
  };

  const createMutation = useMutation({
    mutationFn: (values: CertificateTypeFormValues) =>
      apiRequest<{ certificateType: CertificateTypeSummary }>(`/events/${eventId}/certificate-types`, {
        method: 'POST',
        body: values,
      }),
    onSuccess: () => {
      invalidate();
      setIsCreateOpen(false);
      showToast('Certificate type created', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not create certificate type', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: CertificateTypeFormValues) =>
      apiRequest<{ certificateType: CertificateTypeSummary }>(
        `/events/${eventId}/certificate-types/${editingType?.id}`,
        { method: 'PATCH', body: values },
      ),
    onSuccess: () => {
      invalidate();
      setEditingType(null);
      showToast('Certificate type updated', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not update certificate type', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (certificateTypeId: string) =>
      apiRequest(`/events/${eventId}/certificate-types/${certificateTypeId}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      showToast('Certificate type deleted', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not delete certificate type', 'error');
    },
  });

  const previewMutation = useMutation({
    mutationFn: (certificateTypeId: string) =>
      apiBlobRequest(`/events/${eventId}/certificates/test`, { method: 'POST', body: { certificateTypeId } }),
    onSuccess: (blob) => {
      openBlobInNewTab(blob);
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not generate a preview', 'error');
    },
  });

  const certificateTypes = certificateTypesQuery.data?.certificateTypes ?? [];
  const templates = templatesQuery.data?.templates ?? [];

  if (certificateTypesQuery.isLoading || templatesQuery.isLoading) {
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
          {certificateTypes.length} certificate type{certificateTypes.length === 1 ? '' : 's'}
        </p>
        <Button onClick={() => setIsCreateOpen(true)}>New certificate type</Button>
      </div>

      {certificateTypes.length === 0 ? (
        <EmptyState
          title="No certificate types yet"
          description="Create a certificate type by choosing a template and defining the title and signatories."
          action={<Button onClick={() => setIsCreateOpen(true)}>New certificate type</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificateTypes.map((certificateType) => {
            const template = templates.find((t) => t.id === certificateType.certificateTemplateId);
            return (
              <Card key={certificateType.id} className="overflow-hidden">
                {template && <TemplatePreview template={template} />}
                <CardBody className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-gray-900">{certificateType.name}</p>
                  <p className="text-xs text-gray-500">{certificateType.title}</p>
                  {certificateType.signatories && certificateType.signatories.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Signed by {certificateType.signatories.map((s) => s.name).join(', ')}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={previewMutation.isPending && previewMutation.variables === certificateType.id}
                      onClick={() => previewMutation.mutate(certificateType.id)}
                    >
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingType(certificateType)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Delete certificate type "${certificateType.name}"?`)) {
                          deleteMutation.mutate(certificateType.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New certificate type" size="lg">
        <CertificateTypeForm
          templates={templates}
          onSubmit={(values) => createMutation.mutate(values)}
          isSubmitting={createMutation.isPending}
          submitLabel="Create certificate type"
        />
      </Modal>

      <Modal open={Boolean(editingType)} onClose={() => setEditingType(null)} title="Edit certificate type" size="lg">
        {editingType && (
          <CertificateTypeForm
            templates={templates}
            defaultValues={{
              certificateTemplateId: editingType.certificateTemplateId,
              name: editingType.name,
              title: editingType.title,
              description: editingType.description ?? undefined,
              signatories: (editingType.signatories ?? []).map((signatory) => ({
                name: signatory.name,
                designation: signatory.designation,
                signatureImageUrl: signatory.signatureImageUrl ?? undefined,
              })),
            }}
            onSubmit={(values) => updateMutation.mutate(values)}
            isSubmitting={updateMutation.isPending}
            submitLabel="Save changes"
          />
        )}
      </Modal>
    </div>
  );
}
