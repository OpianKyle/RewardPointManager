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
    queryKey: ['/api/user'],
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
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
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
      queryClient.setQueryData(['/api/user'], data);
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

      const data2 = await response.json();
      return userSchema.parse(data2);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
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
      queryClient.setQueryData(['/api/user'], null);
    }
  });

  return {
    user,
    isLoading,
    error,
    loginMutation,
    registerMutation,
    logoutMutation
  };
}