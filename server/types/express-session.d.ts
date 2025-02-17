import { User } from '@db/schema';

declare module 'express-session' {
  interface SessionData {
    passport: {
      user: number;
    };
  }
}

declare global {
  namespace Express {
    interface User extends Omit<User, 'password'> {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      isAdmin: boolean;
      isSuperAdmin: boolean;
      isEnabled: boolean;
      points: number;
    }
  }
}
