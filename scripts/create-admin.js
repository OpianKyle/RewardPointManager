import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const hash = await hashPassword("Kyle-2409");
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
  'kylem@opianfsgroup.com',
  '${hash}',
  'Kyle',
  'McBryne',
  '0769815243',
  true,
  true,
  true,
  0,
  CURRENT_TIMESTAMP
);
  `);
}

main().catch(console.error);
