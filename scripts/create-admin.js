import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}.${hash.toString("hex")}`;
}

async function main() {
  const hash = await hashPassword("test123");
  console.log("SQL Query:");
  console.log(`
INSERT INTO users (
  email,
  password,
  first_name,
  last_name,
  phone_number,
  is_admin,
  is_super_admin,
  is_enabled,
  points,
  created_at
)
VALUES (
  'admin@example.com',
  '${hash}',
  'Admin',
  'User',
  '1234567890',
  true,
  true,
  true,
  0,
  CURRENT_TIMESTAMP
);
  `);
}

main().catch(console.error);