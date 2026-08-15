import { useFieldArray, useForm } from 'react-hook-form';
import { TemplatePreview } from '../../components/TemplatePreview';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import type { CertificateTemplateSummary } from '../../lib/types';

export interface SignatoryFormValue {
  name: string;
  designation: string;
  signatureImageUrl?: string;
}

export interface CertificateTypeFormValues {
  certificateTemplateId: string;
  name: string;
  title: string;
  description?: string;
  signatories: SignatoryFormValue[];
}

interface CertificateTypeFormProps {
  templates: CertificateTemplateSummary[];
  defaultValues?: Partial<CertificateTypeFormValues>;
  onSubmit: (values: CertificateTypeFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function CertificateTypeForm({
  templates,
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
}: CertificateTypeFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CertificateTypeFormValues>({
    defaultValues: { signatories: [], ...defaultValues },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'signatories' });
  const selectedTemplateId = watch('certificateTemplateId');
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

  return (
    <form className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit(onSubmit)}>
      <Select
        label="Template"
        error={errors.certificateTemplateId?.message}
        {...register('certificateTemplateId', { required: 'Choose a template' })}
      >
        <option value="">Select a template…</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </Select>

      {selectedTemplate && (
        <div className="flex justify-center">
          <TemplatePreview template={selectedTemplate} displayWidth={260} />
        </div>
      )}

      <Input
        label="Internal name"
        hint="e.g. Winner, Participation"
        error={errors.name?.message}
        {...register('name', { required: 'Name is required' })}
      />
      <Input
        label="Certificate title"
        hint="Shown on the certificate, e.g. Participation"
        error={errors.title?.message}
        {...register('title', { required: 'Title is required' })}
      />
      <Textarea
        label="Description (optional)"
        hint="e.g. has successfully completed the 3-day workshop"
        {...register('description')}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Signatories</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ name: '', designation: '', signatureImageUrl: '' })}
            disabled={fields.length >= 5}
          >
            + Add signatory
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">Signatory {index + 1}</p>
              <button
                type="button"
                className="text-xs font-medium text-red-600 hover:text-red-700"
                onClick={() => remove(index)}
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Name"
                error={errors.signatories?.[index]?.name?.message}
                {...register(`signatories.${index}.name` as const, { required: 'Required' })}
              />
              <Input
                label="Designation"
                error={errors.signatories?.[index]?.designation?.message}
                {...register(`signatories.${index}.designation` as const, { required: 'Required' })}
              />
            </div>
            <Input
              label="Signature image URL (optional)"
              {...register(`signatories.${index}.signatureImageUrl` as const)}
            />
          </div>
        ))}
      </div>

      <Button type="submit" isLoading={isSubmitting} className="mt-2">
        {submitLabel}
      </Button>
    </form>
  );
}
