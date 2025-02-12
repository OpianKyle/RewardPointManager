import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from "zod";

// Define the user schema with all required fields
export const userSchema = z.object({
  id: z.number().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  isSouthAfricanCitizen: z.boolean(),
  idOrPassport: z.string().min(1, "ID/Passport number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  language: z.string().min(1, "Language is required"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  isAdmin: z.boolean().default(false),
  isSuperAdmin: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  points: z.number().default(0),
  referral_code: z.string().optional(),
  referred_by: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "id" | "points" | "isAdmin" | "isSuperAdmin" | "isEnabled">;

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
  body?: Partial<InsertUser>
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

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

async function fetchUser(): Promise<User | null> {
  const response = await fetch('/api/user', {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: (userData: Pick<InsertUser, "email" | "password">) => handleRequest('/api/login', 'POST', userData),
    onSuccess: (result) => {
      if (result.ok && result.data) {
        queryClient.setQueryData(['user'], result.data);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: InsertUser) => handleRequest('/api/register', 'POST', userData),
    onSuccess: (result) => {
      if (result.ok && result.data) {
        queryClient.setQueryData(['user'], result.data);
      }
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