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
  customFields?: string[];
  defaultValues?: Partial<CertificateTypeFormValues>;
  onSubmit: (values: CertificateTypeFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const BUILT_IN_FIELDS = [
  'participantName',
  'organizationName',
  'eventName',
  'eventVenue',
  'eventStartDate',
  'eventEndDate',
  'issueDate',
  'certificateId',
];

export function CertificateTypeForm({
  templates,
  customFields = [],
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
        hint="e.g. has secured {{position}} in {{eventName}}"
        {...register('description')}
      />

      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <p className="font-medium text-gray-700">
          Use <code>{'{{fieldName}}'}</code> in the title or description to personalize each certificate:
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {BUILT_IN_FIELDS.map((field) => (
            <code key={field} className="rounded bg-white px-1.5 py-0.5 text-gray-700 ring-1 ring-gray-200">
              {`{{${field}}}`}
            </code>
          ))}
          {customFields.map((field) => (
            <code key={field} className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700 ring-1 ring-brand-200">
              {`{{${field}}}`}
            </code>
          ))}
        </div>
        {customFields.length === 0 && (
          <p className="mt-1.5 text-gray-500">
            Extra columns from a CSV import (e.g. &quot;Team Name&quot;) will also become placeholders here, like{' '}
            <code>{'{{teamName}}'}</code>.
          </p>
        )}
      </div>

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
