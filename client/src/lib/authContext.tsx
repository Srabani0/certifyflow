import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import { apiRequest } from './api';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  logoUrl: string | null;
  website: string | null;
  brandColor: string | null;
  address: string | null;
  phone: string | null;
  certificateIdPrefix: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextValue {
  organization: Organization | null;
  isLoading: boolean;
  refetch: UseQueryResult['refetch'];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<{ organization: Organization }>('/auth/me'),
    retry: false,
  });

  const value: AuthContextValue = {
    organization: query.data?.organization ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
