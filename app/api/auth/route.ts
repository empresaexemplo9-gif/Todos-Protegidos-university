import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionToken, verifyPassword } from "../../admin-access";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string; action?: string };
  const jar = await cookies();

  if (body.action === "logout") {
    jar.delete(SESSION_COOKIE);
    return Response.json({ ok: true });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!(await verifyPassword(password))) {
    return Response.json({ error: "Senha incorreta ou acesso ainda não configurado." }, { status: 401 });
  }

  const token = await sessionToken();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true });
}
