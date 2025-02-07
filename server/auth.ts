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

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      isAdmin: boolean;
      isSuperAdmin: boolean;
      isEnabled: boolean;
      points: number;
      referral_code: string | null;
      referred_by: string | null;
    }
  }
}

// Define registration schema
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  referralCode: z.string().optional(),
});

// Define login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false to work in development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
      path: "/"
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie!.secure = true;
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
      },
      async (email, password, done) => {
        try {
          console.log("Attempting login for user:", email);
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            console.log("User not found:", email);
            return done(null, false, { message: "Incorrect email." });
          }

          if (!user.isEnabled) {
            console.log("User is disabled:", email);
            return done(null, false, { message: "Account is disabled." });
          }

          const isMatch = await crypto.compare(password, user.password);
          console.log("Password match result:", isMatch);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        } catch (err) {
          console.error("Login error:", err);
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
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", req.body);
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Invalid registration input:", result.error);
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map((i) => i.message).join(", "));
      }

      const { email, password, firstName, lastName, phoneNumber, referralCode } = result.data;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        console.log("Email already exists:", email);
        return res.status(400).send("Email already exists");
      }

      const hashedPassword = await crypto.hash(password);

      // Start a transaction to handle both user creation and referral reward
      const newUser = await db.transaction(async (tx) => {
        // Generate a new referral code for the user
        const newReferralCode = randomBytes(8).toString("hex");

        // Check if the provided referral code exists
        let referrer = null;
        if (referralCode) {
          [referrer] = await tx
            .select()
            .from(users)
            .where(eq(users.referral_code, referralCode))
            .limit(1);

          if (!referrer) {
            throw new Error("Invalid referral code");
          }
        }

        // Create the new user
        const [user] = await tx
          .insert(users)
          .values({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phoneNumber,
            isAdmin: false,
            isSuperAdmin: false,
            isEnabled: true,
            points: 0,
            referral_code: newReferralCode,
            referred_by: referralCode || null,
          })
          .returning();

        // If there's a valid referrer, reward them
        if (referrer) {
          // Update referrer's points
          await tx
            .update(users)
            .set({ points: referrer.points + 2500 })
            .where(eq(users.id, referrer.id));

          // Add a transaction record for the referral bonus
          await tx.insert(transactions).values({
            userId: referrer.id,
            points: 2500,
            type: "EARNED",
            description: `Referral bonus for ${email} joining`,
            createdAt: new Date(),
          });
        }

        return user;
      });

      console.log("User registered successfully:", email);

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            referral_code: newUser.referral_code,
          },
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message === "Invalid referral code") {
        return res.status(400).send("Invalid referral code");
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", req.body);
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      console.log("Invalid login input:", result.error);
      return res
        .status(400)
        .send("Invalid input: " + result.error.issues.map((i) => i.message).join(", "));
    }

    passport.authenticate("local", (err: any, user: Express.User | false, info: IVerifyOptions) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }

      if (!user) {
        console.log("Login failed:", info.message);
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        console.log("Login successful:", user.email);
        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
            referral_code: user.referral_code,
          },
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    const email = req.user?.email;
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Logout failed");
      }

      console.log("Logout successful:", email);
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...user } = req.user;
      return res.json(user);
    }

    res.status(401).send("Not logged in");
  });

  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        ...(req.body.password ? { password: await crypto.hash(req.body.password) } : {})
      };

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.user.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      // Update the session
      const { password, ...userData } = updatedUser;
      req.user = userData;

      return res.json(userData);
    } catch (error: any) {
      console.error("Profile update error:", error);
      return res.status(500).send(error.message);
    }
  });
}