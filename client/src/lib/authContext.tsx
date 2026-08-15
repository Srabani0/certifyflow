import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import { apiRequest } from './api';

export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  brandColor: string | null;
  address: string | null;
  phone: string | null;
  certificateIdPrefix: string;
  createdAt: string;
  updatedAt: string;
}

export type Role = 'OWNER' | 'ADMIN' | 'STAFF';

export interface AuthResponse {
  user: User;
  organization: Organization;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  organization: Organization | null;
  role: Role | null;
  isLoading: boolean;
  refetch: UseQueryResult['refetch'];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<AuthResponse>('/auth/me'),
    retry: false,
  });

  const value: AuthContextValue = {
    user: query.data?.user ?? null,
    organization: query.data?.organization ?? null,
    role: query.data?.role ?? null,
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
