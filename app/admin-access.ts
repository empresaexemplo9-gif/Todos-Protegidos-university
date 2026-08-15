import { cookies } from "next/headers";

export const SESSION_COOKIE = "sona_session";

async function hashHex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

/** Token de sessão derivado da senha admin (não expõe a senha). Vazio se não configurado. */
export async function sessionToken() {
  const password = adminPassword();
  if (!password) return "";
  return hashHex(`sona-admin-v1:${password}`);
}

export async function verifyPassword(password: string) {
  const configured = adminPassword();
  return Boolean(configured) && typeof password === "string" && password === configured;
}

/** Página admin (server component): confere o cookie de sessão. */
export async function isAuthenticated() {
  const token = await sessionToken();
  if (!token) return false;
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value === token;
}

/** Rotas de API: confere o cookie de sessão a partir da requisição. */
export async function adminActorFrom(request: Request) {
  const token = await sessionToken();
  if (!token) return null;
  const header = request.headers.get("cookie") ?? "";
  const entry = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const value = entry ? decodeURIComponent(entry.slice(SESSION_COOKIE.length + 1)) : "";
  return value && value === token ? "Administrador" : null;
}
