import { useEffect, useState } from "react";
import Home from "../app/admin-workspace";
import ClientProposalPage from "../app/proposta/page";
import LoginScreen from "./LoginScreen";
import AccessManager from "./AccessManager";
import AvaIntegration from "./AvaIntegration";

export type SessionUser = { id: string; name: string; email: string; role: "owner" | "member" };
type SessionState = { user: SessionUser | null; needsSetup: boolean };

export default function App() {
  // A página do cliente (/proposta?token=...) é pública e não passa pelo login.
  const isClientView =
    typeof window !== "undefined" && window.location.pathname.startsWith("/proposta");

  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(!isClientView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [avaOpen, setAvaOpen] = useState(false);

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
  if (!session.user) return <LoginScreen needsSetup={session.needsSetup} onAuthed={loadSession} />;

  const user = session.user;
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    await loadSession();
  };

  return (
    <>
      <Home />
      <div className="sona-account">
        {menuOpen && (
          <div className="sona-account__menu">
            <div className="sona-account__who">
              <strong>{user.name}</strong>
              <small>
                {user.email} · {user.role === "owner" ? "dono" : "equipe"}
              </small>
            </div>
            {user.role === "owner" && (
              <button onClick={() => { setAccessOpen(true); setMenuOpen(false); }}>Acessos e senha</button>
            )}
            {user.role === "owner" && (
              <button onClick={() => { setAvaOpen(true); setMenuOpen(false); }}>Integração AVA</button>
            )}
            <button className="sona-account__logout" onClick={() => void logout()}>Sair</button>
          </div>
        )}
        <button className="sona-account__chip" onClick={() => setMenuOpen((v) => !v)}>
          <span className="sona-account__avatar">{user.name.charAt(0).toUpperCase()}</span>
          <span>Conta</span>
        </button>
      </div>
      {accessOpen && <AccessManager currentUserId={user.id} onClose={() => setAccessOpen(false)} />}
      {avaOpen && <AvaIntegration onClose={() => setAvaOpen(false)} />}
    </>
  );
}
