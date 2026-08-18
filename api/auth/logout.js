import { json } from "../../lib/http.js";
import { clearCookie } from "../../lib/auth.js";

export default async function handler(_req, res) {
  return json(res, 200, { ok: true }, { "set-cookie": clearCookie });
}
