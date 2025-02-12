import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, transactions } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Define user interface to match schema
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      isAdmin: boolean | null;
      isSuperAdmin: boolean | null;
      isEnabled: boolean | null;
      points: number | null;
      referral_code: string | null;
      referred_by: string | null;
      phoneNumber?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  referral_code: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000
    }),
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax"
    }
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
      },
      async (email, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }

          if (!user.isEnabled) {
            return done(null, false, { message: "Account is disabled." });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
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
        return done(new Error('User not found'), null);
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ error: result.error.issues.map((i) => i.message).join(", ") });
      }

      const { email, password, firstName, lastName, phoneNumber, referral_code } = result.data;

      // Check for existing user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
        .then(rows => rows[0]);

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const newUser = await db.transaction(async (tx) => {
        const newReferralCode = randomBytes(8).toString("hex");
        let referrer = null;

        if (referral_code) {
          referrer = await tx
            .select()
            .from(users)
            .where(eq(users.referral_code, referral_code))
            .limit(1)
            .then(rows => rows[0]);

          if (!referrer) {
            throw new Error("Invalid referral code");
          }
        }

        // Create new user
        const [insertedUser] = await tx
          .insert(users)
          .values({
            email,
            password: await crypto.hash(password),
            firstName,
            lastName,
            phoneNumber,
            isAdmin: false,
            isSuperAdmin: false,
            isEnabled: true,
            points: 0,
            referral_code: newReferralCode,
            referred_by: referral_code || null,
          })
          .returning();

        if (!insertedUser) {
          throw new Error("Failed to create user");
        }

        // Handle referral bonus if applicable
        if (referrer) {
          await tx
            .update(users)
            .set({ points: (referrer.points || 0) + 2500 })
            .where(eq(users.id, referrer.id));

          await tx.insert(transactions).values({
            userId: referrer.id,
            points: 2500,
            type: "EARNED",
            description: `Referral bonus for ${email} joining`,
            createdAt: new Date(),
          });
        }

        return insertedUser;
      });

      // Login the new user
      req.login(newUser, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ error: "Login failed after registration" });
        }

        const { password: _, ...safeUser } = newUser;
        return res.status(201).json({
          message: "Registration successful",
          user: safeUser,
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message === "Invalid referral code") {
        return res.status(400).json({ error: "Invalid referral code" });
      }
      return res.status(500).json({ error: "Registration failed: " + error.message });
    }
  });

  app.post("/api/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues.map((i) => i.message).join(", "),
      });
    }

    passport.authenticate("local", (err: any, user: Express.User | false, info: IVerifyOptions) => {
      if (err) {
        return res.status(500).json({ error: "Authentication error" });
      }

      if (!user) {
        return res.status(401).json({ error: info.message ?? "Login failed" });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }

        const { password: _, ...safeUser } = user;
        return res.json({
          message: "Login successful",
          user: safeUser,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Session destruction failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logout successful" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { password: _, ...safeUser } = req.user;
    res.json(safeUser);
  });
}