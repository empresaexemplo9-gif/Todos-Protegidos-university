export async function isAdminEmail(email: string) {
  const configured = process.env.ADMIN_EMAILS ?? "";
  const allowed = configured.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export async function adminActorFrom(request: Request) {
  const host = new URL(request.url).hostname;
  if (["terminal.local", "localhost", "127.0.0.1"].includes(host)) return "Pré-visualização local";
  const email = request.headers.get("oai-authenticated-user-email");
  if (!email || !(await isAdminEmail(email))) return null;
  return email;
}
