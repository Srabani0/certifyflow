import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiRequest } from '../../lib/api';
import type { AuthResponse } from '../../lib/authContext';
import { AuthLayout } from './AuthLayout';

interface RegisterFormValues {
  fullName: string;
  organizationName: string;
  email: string;
  password: string;
  website?: string;
}

export function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const mutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: values }),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      navigate('/dashboard', { replace: true });
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Something went wrong', 'error');
    },
  });

  return (
    <AuthLayout
      title="Create your organization"
      subtitle="Set up CertifyFlow to start issuing certificates"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input
          label="Full name"
          error={errors.fullName?.message}
          {...register('fullName', {
            required: 'Full name is required',
            minLength: { value: 2, message: 'Must be at least 2 characters' },
          })}
        />
        <Input
          label="Organization name"
          error={errors.organizationName?.message}
          {...register('organizationName', {
            required: 'Organization name is required',
            minLength: { value: 2, message: 'Must be at least 2 characters' },
          })}
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
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
          label="Website (optional)"
          type="url"
          placeholder="https://example.com"
          error={errors.website?.message}
          {...register('website')}
        />
        <Button type="submit" isLoading={mutation.isPending} className="mt-2">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
