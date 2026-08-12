import AdminWorkspace from "./admin-workspace";
import { isAdminEmail } from "./admin-access";
import { requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

async function ProtectedWorkspace() {
  const user = await requireChatGPTUser("/");
  if (!(await isAdminEmail(user.email))) {
    return <main className="client-proposal-state client-proposal-state--error"><span>!</span><strong>Acesso administrativo não autorizado</strong><p>Este login não faz parte da equipe autorizada da SONA.</p></main>;
  }
  return <AdminWorkspace />;
}

export default function Page() {
  return <ProtectedWorkspace />;
}
