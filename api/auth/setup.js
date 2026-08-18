import { ensureSchema } from "../../lib/db.js";
import { signSession, sessionCookie, publicUser } from "../../lib/auth.js";
import { json, failure, readBody, clean } from "../../lib/http.js";
import { countUsers, insertUser } from "../../lib/repo.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Método não suportado." });
    await ensureSchema();
    if ((await countUsers()) > 0) return json(res, 403, { error: "O administrador já foi criado." });
    const body = await readBody(req);
    const name = clean(body.name, 120);
    const email = clean(body.email, 180).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!name || !email || password.length < 6)
      return json(res, 400, { error: "Preencha nome, e-mail e uma senha de ao menos 6 caracteres." });
    const user = await insertUser({ name, email, password, role: "owner", createdBy: "setup" });
    const token = await signSession(user.id);
    return json(res, 200, { user: publicUser(user) }, { "set-cookie": sessionCookie(token) });
  } catch (error) {
    return failure(res, error);
  }
}
