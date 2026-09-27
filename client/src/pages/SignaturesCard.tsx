import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { ApiError, apiRequest } from '../lib/api';
import type { Signature } from '../lib/types';

interface SignatureFormValues {
  name: string;
  designation: string;
}

interface SignaturesCardProps {
  canEdit: boolean;
}

export function SignaturesCard({ canEdit }: SignaturesCardProps): JSX.Element {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignatureFormValues>();

  const signaturesQuery = useQuery({
    queryKey: ['signatures'],
    queryFn: () => apiRequest<{ signatures: Signature[] }>('/signatures'),
  });

  const createMutation = useMutation({
    mutationFn: (values: SignatureFormValues) => {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('designation', values.designation);
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append('image', file);
      }
      return apiRequest<{ signature: Signature }>('/signatures', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures'] });
      reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showToast('Signature added', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not add signature', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (signatureId: string) => apiRequest(`/signatures/${signatureId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures'] });
      showToast('Signature removed', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not remove signature', 'error');
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const signatures = signaturesQuery.data?.signatures ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signatures</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="text-xs text-gray-500">
          Upload signatures once and reuse them across certificate types instead of re-entering them each time.
        </p>

        {signatures.length > 0 && (
          <ul className="flex flex-col gap-2">
            {signatures.map((signature) => (
              <li
                key={signature.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-100 bg-gray-50">
                    {signature.imageUrl ? (
                      <img src={signature.imageUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-gray-400">No image</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{signature.name}</p>
                    <p className="text-xs text-gray-500">{signature.designation}</p>
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                    onClick={() => deleteMutation.mutate(signature.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <>
            {isAdding ? (
              <form
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3"
                onSubmit={handleSubmit((values) => createMutation.mutate(values))}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Name"
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Designation"
                    error={errors.designation?.message}
                    {...register('designation', { required: 'Designation is required' })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Signature image (optional)</label>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" isLoading={createMutation.isPending}>
                    Save signature
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setIsAdding(true)}>
                + Add signature
              </Button>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
