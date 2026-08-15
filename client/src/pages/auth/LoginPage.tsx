import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiRequest } from '../../lib/api';
import type { Organization } from '../../lib/authContext';
import { AuthLayout } from './AuthLayout';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      apiRequest<{ organization: Organization }>('/auth/login', { method: 'POST', body: values }),
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
      title="Sign in to your organization"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />
        <Button type="submit" isLoading={mutation.isPending} className="mt-2">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
