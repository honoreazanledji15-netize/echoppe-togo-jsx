import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv.slice(2).join(" ");
if (!password || password.length < 12) {
  console.error("Usage: node scripts/generate-admin-hash.mjs 'mot-de-passe-long-et-unique'");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`ADMIN_PASSWORD_HASH=${salt}:${hash}`);
