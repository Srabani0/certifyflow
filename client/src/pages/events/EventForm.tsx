import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import type { EventStatus, EventType } from '../../lib/types';

export interface EventFormValues {
  name: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export const EVENT_TYPES: EventType[] = [
  'FEST',
  'HACKATHON',
  'WORKSHOP',
  'INTERNSHIP',
  'SPORTS',
  'CONFERENCE',
  'SEMINAR',
  'TRAINING',
  'OTHER',
];
export const EVENT_STATUSES: EventStatus[] = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];

export function toTitleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function EventForm({ defaultValues, onSubmit, isSubmitting, submitLabel = 'Save' }: EventFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    defaultValues: {
      type: 'OTHER',
      status: 'DRAFT',
      ...defaultValues,
    },
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Event name"
        error={errors.name?.message}
        {...register('name', { required: 'Event name is required' })}
      />
      <Textarea label="Description" error={errors.description?.message} {...register('description')} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Type" {...register('type')}>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {toTitleCase(type)}
            </option>
          ))}
        </Select>
        <Select label="Status" {...register('status')}>
          {EVENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {toTitleCase(status)}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Start date" type="date" {...register('startDate')} />
        <Input label="End date" type="date" {...register('endDate')} />
      </div>
      <Input label="Location" {...register('location')} />
      <Button type="submit" isLoading={isSubmitting} className="mt-2">
        {submitLabel}
      </Button>
    </form>
  );
}
