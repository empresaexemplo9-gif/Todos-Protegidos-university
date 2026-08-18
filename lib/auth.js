// Autenticação: senhas com scrypt + sessão em cookie assinado (HMAC), igual ao
// servidor local. A diferença é onde mora o segredo: aqui ele vem de
// SESSION_SECRET ou, na falta dela, de uma linha na tabela sona_meta.
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { sql } from "./db.js";

export const SESSION_COOKIE = "sona_session";
const SECRET_KEY = "session_secret";

let secret = null;

async function getSecret() {
  if (secret) return secret;
  const fromEnv = (process.env.SESSION_SECRET || "").trim();
  if (fromEnv) {
    secret = fromEnv;
    return secret;
  }
  const generated = randomBytes(32).toString("hex");
  await sql`
    INSERT INTO sona_meta (key, value) VALUES (${SECRET_KEY}, ${JSON.stringify(generated)}::jsonb)
    ON CONFLICT (key) DO NOTHING`;
  const rows = await sql`SELECT value FROM sona_meta WHERE key = ${SECRET_KEY}`;
  secret = typeof rows[0]?.value === "string" ? rows[0].value : generated;
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

export const sessionCookie = (token) =>
  `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Secure; Max-Age=${30 * 24 * 3600}`;

export const clearCookie = `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Secure; Max-Age=0`;

export const publicUser = (u) => (u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null);

// Usuário autenticado da requisição (ou null).
export async function getActor(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const uid = await verifySession(cookies[SESSION_COOKIE]);
  if (!uid) return null;
  const rows = await sql`SELECT * FROM sona_users WHERE id = ${uid} AND active = true`;
  return rows[0] || null;
}
