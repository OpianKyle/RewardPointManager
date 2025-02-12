import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email("Invalid email address"),
  firstName: z.string(),
  lastName: z.string(),
  isAdmin: z.boolean(),
  isSuperAdmin: z.boolean(),
  isEnabled: z.boolean(),
  points: z.number(),
  referral_code: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });

        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        return userSchema.parse(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    staleTime: Infinity, // Don't refetch automatically
    cacheTime: 0, // Don't cache the result
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      return userSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const userData = await response.json();
      return userSchema.parse(userData);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data);
    }
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    loginMutation,
    registerMutation
  };
}