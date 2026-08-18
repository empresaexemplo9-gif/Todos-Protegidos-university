// Acessos (usuários) — somente o dono gerencia.
import { ensureSchema } from "../lib/db.js";
import { getActor, hashPassword } from "../lib/auth.js";
import { json, failure, readBody, clean } from "../lib/http.js";
import {
  listUsers, findUserById, insertUser, updateUser, deleteUser, emailTaken, countOwners,
} from "../lib/repo.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const actor = await getActor(req);
    if (!actor || actor.role !== "owner")
      return json(res, 403, { error: "Apenas o dono pode gerenciar acessos." });

    if (req.method === "GET") return json(res, 200, { users: await listUsers() });

    if (req.method === "POST") {
      const body = await readBody(req);

      if (body.action === "create") {
        const name = clean(body.name, 120);
        const email = clean(body.email, 180).toLowerCase();
        const password = typeof body.password === "string" ? body.password : "";
        if (!name || !email || password.length < 6)
          return json(res, 400, { error: "Nome, e-mail e senha (mín. 6) são obrigatórios." });
        if (await emailTaken(email))
          return json(res, 409, { error: "Já existe um acesso com este e-mail." });
        const user = await insertUser({
          name, email, password,
          role: body.role === "owner" ? "owner" : "member",
          createdBy: actor.email,
        });
        return json(res, 200, {
          user: { id: user.id, name: user.name, email: user.email, role: user.role, active: true },
        });
      }

      const id = clean(body.id, 80);
      const user = await findUserById(id);
      if (!user) return json(res, 404, { error: "Acesso não encontrado." });

      if (body.action === "update") {
        const patch = {};
        if (typeof body.name === "string") patch.name = clean(body.name, 120) || user.name;
        if (typeof body.active === "boolean") {
          if (user.id === actor.id && !body.active)
            return json(res, 400, { error: "Você não pode desativar o próprio acesso." });
          patch.active = body.active;
        }
        if (typeof body.password === "string" && body.password.length >= 6) {
          const h = hashPassword(body.password);
          patch.salt = h.salt;
          patch.hash = h.hash;
        }
        if (body.role === "owner" || body.role === "member") patch.role = body.role;
        await updateUser(id, patch);
        return json(res, 200, { ok: true });
      }

      if (body.action === "delete") {
        if (user.id === actor.id)
          return json(res, 400, { error: "Você não pode excluir o próprio acesso." });
        if (user.role === "owner" && (await countOwners()) <= 1)
          return json(res, 400, { error: "É preciso manter ao menos um dono." });
        await deleteUser(id);
        return json(res, 200, { ok: true });
      }

      return json(res, 400, { error: "Ação inválida." });
    }

    return json(res, 405, { error: "Método não suportado." });
  } catch (error) {
    return failure(res, error);
  }
}
