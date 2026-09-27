import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiRequest } from '../../lib/api';
import { AuthLayout } from './AuthLayout';

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordPage(): JSX.Element {
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>();

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: values }),
    onSuccess: () => setSubmitted(true),
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Something went wrong', 'error');
    },
  });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      }
    >
      {submitted ? (
        <p className="text-sm text-gray-600">
          If that email has an account, a reset link has been sent. Check your inbox.
        </p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Button type="submit" isLoading={mutation.isPending} className="mt-2">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
