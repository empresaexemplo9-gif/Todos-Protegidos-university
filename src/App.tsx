import { useEffect, useState } from "react";
import Home from "../app/admin-workspace";
import ClientProposalPage from "../app/proposta/page";
import LoginScreen from "./LoginScreen";

export type SessionUser = { id: string; name: string; email: string; role: "owner" | "member" };
type SessionState = { user: SessionUser | null; needsSetup: boolean };

export default function App() {
  // A página do cliente (/proposta?token=...) é pública e não passa pelo login.
  const isClientView =
    typeof window !== "undefined" && window.location.pathname.startsWith("/proposta");

  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(!isClientView);

  const loadSession = async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await res.json()) as { user?: SessionUser | null; needsSetup?: boolean };
      setSession({ user: data.user ?? null, needsSetup: Boolean(data.needsSetup) });
    } catch {
      setSession({ user: null, needsSetup: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isClientView) void loadSession();
  }, [isClientView]);

  if (isClientView) return <ClientProposalPage />;

  if (loading || !session) {
    return (
      <div className="auth-boot">
        <span className="auth-boot__spin" />
      </div>
    );
  }

  if (!session.user) {
    return <LoginScreen needsSetup={session.needsSetup} onAuthed={loadSession} />;
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await loadSession();
  };

  return (
    <>
      <Home />
      <div className="sona-account" role="status">
        <small>
          {session.user.name}
          {session.user.role === "owner" ? " · dono" : ""}
        </small>
        <button onClick={() => void logout()}>Sair</button>
      </div>
    </>
  );
}
