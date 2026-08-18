import { ensureSchema } from "../../lib/db.js";
import { verifyPassword, signSession, sessionCookie, publicUser } from "../../lib/auth.js";
import { json, failure, readBody, clean } from "../../lib/http.js";
import { ensureDefaultAdmin, findUserByEmail } from "../../lib/repo.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Método não suportado." });
    await ensureSchema();
    await ensureDefaultAdmin();
    const body = await readBody(req);
    const email = clean(body.email, 180).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.salt, user.hash))
      return json(res, 401, { error: "E-mail ou senha inválidos." });
    const token = await signSession(user.id);
    return json(res, 200, { user: publicUser(user) }, { "set-cookie": sessionCookie(token) });
  } catch (error) {
    return failure(res, error);
  }
}
