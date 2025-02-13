import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const crypto = {
  async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scryptAsync(password, salt, 32) as Buffer;
    return salt + '.' + derivedKey.toString('hex');
  },

  async verifyPassword(password: string, hash: string) {
    try {
      const [salt, key] = hash.split('.');
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = await scryptAsync(password, salt, 32) as Buffer;
      return timingSafeEqual(keyBuffer, derivedKey);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
};

export async function setupAuth(app: Express) {
  app.use(session({
    secret: process.env.REPL_ID || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000
    }),
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.isEnabled) {
          return done(null, false, { message: 'Account is disabled' });
        }

        const isValid = await crypto.verifyPassword(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return done(null, false);
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: result.error.issues.map(i => i.message).join(", ")
        });
      }

      passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
        if (err) {
          return res.status(500).json({ error: "Authentication error" });
        }

        if (!user) {
          return res.status(401).json({ error: info?.message || "Invalid credentials" });
        }

        req.logIn(user, (err) => {
          if (err) {
            return res.status(500).json({ error: "Login failed" });
          }

          const { password: _, ...safeUser } = user as any;
          return res.json(safeUser);
        });
      })(req, res, next);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { password: _, ...safeUser } = req.user as any;
    res.json(safeUser);
  });
}