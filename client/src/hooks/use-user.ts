import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email("Invalid email address"),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional(),
  isAdmin: z.boolean().optional().nullable(),
  isSuperAdmin: z.boolean().optional().nullable(),
  isEnabled: z.boolean().optional().nullable(),
  points: z.number().optional().nullable(),
  referral_code: z.string().nullable(),
  referred_by: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
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
          throw new Error(`Failed to fetch user: ${await response.text()}`);
        }

        const data = await response.json();
        return userSchema.parse(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    staleTime: 300000, // 5 minutes
    gcTime: 3600000, // 1 hour
    retry: false,
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
      return userSchema.parse(data.user);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      referral_code?: string;
    }) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const responseData = await response.json();
      return userSchema.parse(responseData.user);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
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

      queryClient.setQueryData(['/api/user'], null);
    }
  });

  return {
    user,
    isLoading,
    loginMutation,
    registerMutation,
    logoutMutation
  };
}