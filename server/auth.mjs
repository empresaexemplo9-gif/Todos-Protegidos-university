// Autenticação própria: senhas com scrypt + sessão em cookie assinado (HMAC).
// Nenhuma dependência externa — só node:crypto.
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { dataDir } from "./store.mjs";

const secretFile = join(dataDir, "secret.key");
let secret = null;

async function getSecret() {
  if (secret) return secret;
  try {
    secret = (await readFile(secretFile, "utf8")).trim();
  } catch {
    secret = randomBytes(32).toString("hex");
    await mkdir(dataDir, { recursive: true });
    await writeFile(secretFile, secret, "utf8");
  }
  return secret;
}

export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  if (!salt || !hash) return false;
  const test = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
  const real = Buffer.from(hash, "hex");
  return test.length === real.length && timingSafeEqual(test, real);
}

const b64u = (value) => Buffer.from(value).toString("base64url");

export async function signSession(userId) {
  const key = await getSecret();
  const payload = b64u(JSON.stringify({ uid: userId, iat: Date.now() }));
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function verifySession(token) {
  if (!token || !token.includes(".")) return null;
  const key = await getSecret();
  const [payload, sig] = token.split(".");
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.uid) return null;
    if (Date.now() - (data.iat || 0) > 30 * 864e5) return null; // expira em 30 dias
    return data.uid;
  } catch {
    return null;
  }
}

export function parseCookies(header = "") {
  return Object.fromEntries(
    (header || "")
      .split(";")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const eq = chunk.indexOf("=");
        if (eq < 0) return [chunk, ""];
        return [chunk.slice(0, eq), decodeURIComponent(chunk.slice(eq + 1))];
      }),
  );
}

export const SESSION_COOKIE = "sona_session";
