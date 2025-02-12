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

type RequestResult = {
  ok: true;
  data?: User;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: any
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (response.status === 401) {
      return { ok: false, message: "Unauthorized" };
    }

    if (!response.ok) {
      const message = await response.text();
      return { ok: false, message };
    }

    if (method === 'POST' && (url === '/api/login' || url === '/api/register')) {
      const data = await response.json();
      return { ok: true, data };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

async function fetchUser() {
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
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
    refetchOnWindowFocus: false
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await handleRequest('/api/login', 'POST', credentials);
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await handleRequest('/api/logout', 'POST');
      if (!result.ok) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const result = await handleRequest('/api/register', 'POST', data);
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data);
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    loginMutation,
    registerMutation,
  };
}