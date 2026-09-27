import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiRequest } from '../../lib/api';
import { AuthLayout } from './AuthLayout';

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>();

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: { token, password: values.password },
      }),
    onSuccess: () => {
      showToast('Password updated — sign in with your new password', 'success');
      navigate('/login', { replace: true });
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not reset password', 'error');
    },
  });

  if (!token) {
    return (
      <AuthLayout title="Reset your password">
        <p className="text-sm text-gray-600">
          This reset link is missing a token. Request a new one from the{' '}
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
            forgot password
          </Link>{' '}
          page.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Choose a new password">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Must be at least 8 characters' },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" isLoading={mutation.isPending} className="mt-2">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
