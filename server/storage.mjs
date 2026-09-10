import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localUploadDir = path.join(root, "data", "uploads");
const s3Enabled = Boolean(process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
const s3 = s3Enabled ? new S3Client({ region: process.env.S3_REGION || "auto", endpoint: process.env.S3_ENDPOINT, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } }) : null;

export async function storeUpload(file, prefix = "credit-documents") {
  const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${file.filename || `${Date.now()}-${file.originalname}`}`;
  if (s3) {
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype, ServerSideEncryption: process.env.S3_SERVER_SIDE_ENCRYPTION || "AES256" }));
    return { name: file.originalname, key, bucket: process.env.S3_BUCKET, storage: "s3", mimeType: file.mimetype, size: file.size };
  }
  await fs.mkdir(localUploadDir, { recursive: true });
  const localName = file.filename || `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await fs.writeFile(path.join(localUploadDir, localName), file.buffer);
  return { name: file.originalname, storedName: localName, storage: "local", mimeType: file.mimetype, size: file.size };
}

export { s3Enabled };
