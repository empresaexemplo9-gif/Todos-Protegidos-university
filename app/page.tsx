import AdminWorkspace from "./admin-workspace";
import { isAuthenticated } from "./admin-access";
import LoginGate from "./login-gate";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await isAuthenticated())) {
    return <LoginGate />;
  }
  return <AdminWorkspace />;
}
