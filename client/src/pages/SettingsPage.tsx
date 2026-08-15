import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { ApiError, apiRequest } from '../lib/api';
import { useAuth, type Organization } from '../lib/authContext';

interface SettingsFormValues {
  name: string;
  website?: string;
  brandColor?: string;
  address?: string;
  phone?: string;
  certificateIdPrefix: string;
}

export function SettingsPage(): JSX.Element {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    defaultValues: {
      name: organization?.name ?? '',
      website: organization?.website ?? '',
      brandColor: organization?.brandColor ?? '#7c3aed',
      address: organization?.address ?? '',
      phone: organization?.phone ?? '',
      certificateIdPrefix: organization?.certificateIdPrefix ?? 'CF',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: SettingsFormValues) =>
      apiRequest<{ organization: Organization }>('/organization', { method: 'PATCH', body: values }),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      showToast('Settings saved', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not save settings', 'error');
    },
  });

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    setIsUploadingLogo(true);
    try {
      const data = await apiRequest<{ organization: Organization }>('/organization/logo', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      queryClient.setQueryData(['auth', 'me'], data);
      showToast('Logo updated', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Could not upload logo', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your organization&apos;s branding and certificate defaults.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardBody className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {organization?.logoUrl ? (
              <img src={organization.logoUrl} alt="Organization logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400">No logo</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              disabled={isUploadingLogo}
              className="text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">PNG, JPEG, or WEBP — appears on generated certificates.</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization details</CardTitle>
        </CardHeader>
        <CardBody>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
            <Input
              label="Organization name"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />
            <Input
              label="Website"
              type="url"
              placeholder="https://example.com"
              error={errors.website?.message}
              {...register('website')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" {...register('phone')} />
              <Input label="Brand color" type="color" className="h-10 p-1" {...register('brandColor')} />
            </div>
            <Input label="Address" {...register('address')} />
            <Input
              label="Certificate ID prefix"
              hint="e.g. CF, TECHFEST, NEXUS — 2-10 letters/numbers"
              error={errors.certificateIdPrefix?.message}
              {...register('certificateIdPrefix', {
                required: 'A prefix is required',
                pattern: { value: /^[A-Za-z0-9]{2,10}$/, message: 'Use 2-10 letters/numbers, no spaces or symbols' },
              })}
            />
            <Button type="submit" isLoading={updateMutation.isPending} className="mt-2 self-start">
              Save changes
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
