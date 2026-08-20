import { ensureSchema } from "../../lib/db.js";
import { getActor, publicUser } from "../../lib/auth.js";
import { json, failure } from "../../lib/http.js";
import { countUsers } from "../../lib/repo.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const actor = await getActor(req);
    return json(res, 200, { user: publicUser(actor), needsSetup: (await countUsers()) === 0 });
  } catch (error) {
    return failure(res, error);
  }
}
