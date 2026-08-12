import { useState } from "react";

export default function LoginScreen({
  needsSetup,
  onAuthed,
}: {
  needsSetup: boolean;
  onAuthed: () => void | Promise<void>;
}) {
  const mode: "login" | "setup" = needsSetup ? "setup" : "login";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = mode === "setup" ? "/api/auth/setup" : "/api/auth/login";
      const body = mode === "setup" ? { name, email, password } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Não foi possível entrar.");
      await onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sona-auth">
      <div className="sona-auth__bg" aria-hidden="true" />
      <main className="sona-auth__panel">
        <div className="sona-logo" aria-label="SONA">
          <span>S</span>
          <i className="sona-logo__ring" />
          <span>N</span>
          <span>A</span>
        </div>
        <p className="sona-auth__tagline">Tecnologia e inteligência para o bem-estar.</p>

        <form className="sona-auth__card" onSubmit={submit}>
          <span className="sona-auth__eyebrow">
            {mode === "setup" ? "PRIMEIRO ACESSO" : "ÁREA INTERNA"}
          </span>
          <h1>{mode === "setup" ? "Criar acesso do administrador" : "Entrar na plataforma"}</h1>
          <p className="sona-auth__lead">
            {mode === "setup"
              ? "Este será o dono do sistema. Depois você autoriza os demais acessos."
              : "Acesso restrito à equipe autorizada da SONA."}
          </p>

          {mode === "setup" && (
            <label>
              Nome
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </label>
          )}
          <label>
            {mode === "setup" ? "E-mail" : "Login"}
            <input
              type={mode === "setup" ? "email" : "text"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder={mode === "setup" ? "" : "admin"}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "setup" ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </label>

          {error && <p className="sona-auth__error">{error}</p>}

          <button type="submit" disabled={busy}>
            {busy ? "Aguarde…" : mode === "setup" ? "Criar acesso" : "Entrar"}
            <span className="sona-auth__arrow">→</span>
          </button>
        </form>

        <footer className="sona-auth__foot">SONA · Metropolitan Mall · Goiânia — GO</footer>
      </main>
    </div>
  );
}
