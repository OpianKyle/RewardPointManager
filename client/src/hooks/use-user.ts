import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  isAdmin: z.boolean().default(false),
  isSuperAdmin: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  points: z.number().default(0),
  referralCode: z.string().nullable().optional(),
  referredBy: z.string().nullable().optional(),
  // New fields
  isSouthAfricanCitizen: z.boolean().default(false),
  idNumber: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).nullable(),
  language: z.string().nullable(),
  accountHolderName: z.string().nullable(),
  bankName: z.string().nullable(),
  branchCode: z.string().nullable(),
  accountNumber: z.string().nullable(),
  accountType: z.enum(["SAVINGS", "CURRENT"]).nullable(),
  digitalSignature: z.string().nullable(),
  mandateAccepted: z.boolean().default(false),
  createdAt: z.string(),
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
          throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        return userSchema.parse(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      return userSchema.parse(data);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string; 
      phoneNumber: string;
      isAdmin?: boolean;
      isSuperAdmin?: boolean;
      // Add new fields to registration mutation
      isSouthAfricanCitizen?: boolean;
      idNumber?: string;
      dateOfBirth?: Date;
      gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
      language?: string;
      accountHolderName?: string;
      bankName?: string;
      branchCode?: string;
      accountNumber?: string;
      accountType?: "SAVINGS" | "CURRENT";
      digitalSignature?: string;
      mandateAccepted?: boolean;
    }) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      return userSchema.parse(data);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Instead of clearing everything, just clear user-related queries
      queryClient.removeQueries({ queryKey: ['/api/user'] });
      queryClient.setQueryData(['/api/user'], null);
    },
  });

  return {
    user,
    isLoading,
    loginMutation,
    logoutMutation,
    registerMutation,
  };
}