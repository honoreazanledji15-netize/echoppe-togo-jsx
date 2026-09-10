import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const requestsFile = path.join(dataDir, "credit-requests.json");
const accountsFile = path.join(dataDir, "account-requests.json");
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(requestsFile)) fs.writeFileSync(requestsFile, "[]\n");
if (!fs.existsSync(accountsFile)) fs.writeFileSync(accountsFile, "[]\n");

export const databaseEnabled = Boolean(process.env.DATABASE_URL);
export const pool = databaseEnabled ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }, max: Number(process.env.DATABASE_POOL_MAX || 10) }) : null;

export async function initializeDatabase() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS credit_requests (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    credit_type TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    purpose TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    identity_file JSONB NOT NULL,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'received',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS account_requests (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    account_type TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'received',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`);
}

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, rows) => fs.writeFileSync(file, JSON.stringify(rows, null, 2) + "\n");

export async function saveCreditRequest(request) {
  if (!pool) { const rows = read(requestsFile); rows.push(request); write(requestsFile, rows); return; }
  await pool.query(`INSERT INTO credit_requests (id, full_name, phone, email, city, credit_type, amount, purpose, message, identity_file, documents, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [request.id, request.fullName, request.phone, request.email, request.city, request.creditType, request.amount, request.purpose, request.message, request.identityFile, JSON.stringify(request.documents), request.status, request.createdAt]);
}

export async function saveAccountRequest(request) {
  if (!pool) { const rows = read(accountsFile); rows.push(request); write(accountsFile, rows); return; }
  await pool.query(`INSERT INTO account_requests (id, full_name, phone, email, city, account_type, message, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [request.id, request.fullName, request.phone, request.email, request.city, request.accountType, request.message, request.status, request.createdAt]);
}

export async function listCreditRequests() {
  if (!pool) return read(requestsFile).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const { rows } = await pool.query(`SELECT id, full_name AS "fullName", phone, email, city, credit_type AS "creditType", amount, purpose, message, identity_file AS "identityFile", documents, status, created_at AS "createdAt" FROM credit_requests ORDER BY created_at DESC`);
  return rows;
}
