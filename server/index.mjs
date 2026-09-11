import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import multer from "multer";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { databaseEnabled, initializeDatabase, listAccountRequests, listCreditRequests, listNewsletterSubscribers, pool, saveAccountRequest, saveCreditRequest, saveNewsletterSubscriber, updateCreditRequestStatus } from "./database.mjs";
import { getLocalUploadPath, getUploadAccessUrl, s3Enabled, storeUpload } from "./storage.mjs";
import fs from "node:fs";
import path from "node:path";

const app = express();
const port = Number(process.env.API_PORT || 3001);
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173").split(",").map((origin) => origin.trim()).filter(Boolean));
const adminUsername = process.env.ADMIN_USERNAME || "Honore";
const adminPassword = process.env.ADMIN_PASSWORD || "Honore@16.";
if (isProduction && !process.env.ADMIN_PASSWORD_HASH && adminPassword === "change-me-now") throw new Error("Configurez ADMIN_PASSWORD_HASH ou un ADMIN_PASSWORD robuste avant la production.");
if (isProduction && !process.env.SESSION_SECRET) throw new Error("SESSION_SECRET est obligatoire en production.");
if (isProduction && !databaseEnabled) throw new Error("DATABASE_URL est obligatoire en production : configurez PostgreSQL.");
if (isProduction && !s3Enabled) throw new Error("S3_BUCKET, S3_ENDPOINT et les identifiants S3/R2 sont obligatoires en production.");
if (isProduction && [...allowedOrigins].some((origin) => !origin.startsWith("https://"))) throw new Error("ALLOWED_ORIGINS doit utiliser HTTPS en production.");

app.disable("x-powered-by");
if (isProduction) app.set("trust proxy", 1);
app.use(express.json({ limit: "200kb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const PgSession = connectPgSimple(session);
app.use(session({
  name: "echoppe_session",
  secret: process.env.SESSION_SECRET || "local-development-only-change-me",
  resave: false,
  saveUninitialized: false,
  store: databaseEnabled ? new PgSession({ pool, tableName: "user_sessions", createTableIfMissing: true }) : undefined,
  cookie: { httpOnly: true, sameSite: "lax", secure: isProduction, maxAge: 8 * 60 * 60 * 1000 },
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 6, fields: 20 },
  fileFilter: (_req, file, cb) => cb(null, ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)),
});

const passwordMatches = (password) => {
  const configured = process.env.ADMIN_PASSWORD_HASH;
  if (!configured) return password === adminPassword;
  const [salt, expected] = configured.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const target = Buffer.from(expected, "hex");
  return target.length === actual.length && timingSafeEqual(actual, target);
};
const requireAdmin = (req, res, next) => {
  if (!req.session.admin) return res.status(401).json({ error: "Authentification administrateur requise." });
  next();
};
const attemptMap = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizePhone = (value) => String(value || "").replace(/[\s.-]/g, "");
const validPhone = (value) => /^\d{8}$/.test(normalizePhone(value));
const validEmail = (value) => emailPattern.test(String(value || "").trim());
const allowedStatuses = new Set(["received", "under_review", "approved", "rejected", "closed"]);

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "echoppe-togo-credit-api", database: databaseEnabled, objectStorage: s3Enabled, sharedSessions: databaseEnabled }));
app.post("/api/credit-requests", upload.fields([{ name: "identity", maxCount: 1 }, { name: "documents", maxCount: 5 }]), async (req, res, next) => {
  try {
    const b = req.body || {};
    const identity = req.files?.identity?.[0];
    const amount = Number(b.amount);
    if (!identity || !b.fullName || !validPhone(b.phone) || !validEmail(b.email) || !b.city || !b.creditType || !Number.isFinite(amount) || amount <= 0 || !b.purpose || !b.consent) return res.status(400).json({ error: "Informations ou document obligatoire manquant." });
    const identityFile = await storeUpload(identity);
    const documents = await Promise.all((req.files?.documents || []).map((file) => storeUpload(file)));
    const request = { id: randomUUID(), fullName: String(b.fullName).trim(), phone: normalizePhone(b.phone), email: String(b.email).trim().toLowerCase(), city: String(b.city).trim(), creditType: String(b.creditType), amount, purpose: String(b.purpose).trim(), message: String(b.message || "").trim(), identityFile, documents, status: "received", createdAt: new Date().toISOString() };
    await saveCreditRequest(request);
    res.status(201).json({ ok: true, id: request.id, message: "Demande reçue avec succès." });
  } catch (error) { next(error); }
});
app.post("/api/account-requests", async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.fullName || !validPhone(b.phone) || !validEmail(b.email) || !b.city || !b.accountType || !b.consent) return res.status(400).json({ error: "Information obligatoire manquante." });
    const request = { id: randomUUID(), fullName: String(b.fullName).trim(), phone: normalizePhone(b.phone), email: String(b.email).trim().toLowerCase(), city: String(b.city).trim(), accountType: String(b.accountType), message: String(b.message || "").trim(), status: "received", createdAt: new Date().toISOString() };
    await saveAccountRequest(request);
    res.status(201).json({ ok: true, id: request.id, message: "Demande de création de compte reçue." });
  } catch (error) { next(error); }
});

app.post("/api/newsletter-subscribers", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!validEmail(email)) return res.status(400).json({ error: "Veuillez saisir une adresse email valide." });
    const result = await saveNewsletterSubscriber({ id: randomUUID(), email, createdAt: new Date().toISOString() });
    res.status(result.duplicate ? 200 : 201).json({ ok: true, duplicate: result.duplicate, message: result.duplicate ? "Cette adresse est déjà inscrite." : "Inscription enregistrée avec succès." });
  } catch (error) { next(error); }
});

app.post("/api/admin/login", (req, res) => {
  const key = req.ip || "unknown";
  const current = attemptMap.get(key) || { count: 0, startedAt: Date.now() };
  if (Date.now() - current.startedAt > 15 * 60 * 1000) { current.count = 0; current.startedAt = Date.now(); }
  if (current.count >= 10) return res.status(429).json({ error: "Trop de tentatives. Réessayez dans quelques minutes." });
  if (req.body?.username !== adminUsername || !passwordMatches(String(req.body?.password || ""))) { current.count += 1; attemptMap.set(key, current); return res.status(401).json({ error: "Identifiants administrateur invalides." }); }
  attemptMap.delete(key);
  req.session.admin = { username: adminUsername };
  res.json({ ok: true, username: adminUsername });
});
app.post("/api/admin/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/admin/me", requireAdmin, (req, res) => res.json({ ok: true, username: req.session.admin.username }));
app.get("/api/admin/credit-requests", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await listCreditRequests();
    const enriched = await Promise.all(rows.map(async (row) => ({
      ...row,
      identityFile: row.identityFile ? { ...row.identityFile, accessUrl: await getUploadAccessUrl(row.identityFile) } : null,
      documents: await Promise.all((row.documents || []).map(async (file) => ({ ...file, accessUrl: await getUploadAccessUrl(file) }))),
    })));
    res.json(enriched);
  } catch (error) { next(error); }
});
app.get("/api/admin/account-requests", requireAdmin, async (_req, res, next) => { try { res.json(await listAccountRequests()); } catch (error) { next(error); } });
app.get("/api/admin/newsletter-subscribers", requireAdmin, async (_req, res, next) => { try { res.json(await listNewsletterSubscribers()); } catch (error) { next(error); } });
app.patch("/api/admin/credit-requests/:id/status", requireAdmin, async (req, res, next) => { try { const status = String(req.body?.status || ""); if (!allowedStatuses.has(status)) return res.status(400).json({ error: "Statut invalide." }); const row = await updateCreditRequestStatus(req.params.id, status); if (!row) return res.status(404).json({ error: "Demande introuvable." }); res.json({ ok: true, request: row }); } catch (error) { next(error); } });
app.get("/api/admin/files/local/:storedName", requireAdmin, (req, res) => { const storedName = path.basename(req.params.storedName); const filePath = getLocalUploadPath(storedName); if (!fs.existsSync(filePath)) return res.sendStatus(404); return res.download(filePath, storedName); });

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError || error?.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "Fichier invalide ou trop volumineux. Formats acceptés : PDF, JPG, PNG, 10 Mo maximum par fichier." });
  console.error(error);
  res.status(500).json({ error: "Une erreur interne est survenue." });
});

export { app, initializeDatabase };

if (process.env.VERCEL === "1") {
  await initializeDatabase();
} else {
  initializeDatabase().then(() => app.listen(port, "0.0.0.0", () => console.log(`API Echoppe Togo sur http://localhost:${port} — DB:${databaseEnabled ? "PostgreSQL" : "JSON local"} — fichiers:${s3Enabled ? "S3/R2" : "local"}`))).catch((error) => { console.error("Initialisation impossible", error); process.exit(1); });
}
