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

        // Handle unauthorized state by returning null
        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${await response.text()}`);
        }

        const responseData = await response.json();
        return userSchema.parse(responseData);
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    // Reduce unnecessary refetches
    staleTime: 300000, // 5 minutes
    gcTime: 3600000, // 1 hour
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to login');
      }

      const responseData = await response.json();
      return userSchema.parse(responseData.user);
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (registerData: {
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
        body: JSON.stringify(registerData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to register');
      }

      const responseData = await response.json();
      return userSchema.parse(responseData.user);
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
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

      // Clear user data from cache immediately
      queryClient.setQueryData(['/api/user'], null);
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
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