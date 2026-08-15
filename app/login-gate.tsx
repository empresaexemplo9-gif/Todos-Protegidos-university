"use client";

import { useState } from "react";

export default function LoginGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        window.location.reload();
        return;
      }
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Não foi possível entrar.");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="brand__mark" aria-hidden="true"><i>S</i><b /><i>N</i><i>A</i></span>
          <span className="brand__text"><strong>SONA</strong><small>TECNOLOGIA &amp; AUTOMAÇÃO</small></span>
        </div>
        <h1>Acesso da equipe</h1>
        <p>Entre com a senha de administrador para abrir o estúdio comercial.</p>
        <label className="login-field">
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            placeholder="••••••••"
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="btn btn--green login-submit" disabled={busy || !password}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <small className="login-hint">Somente a equipe SONA tem acesso. Clientes recebem a proposta por link direto.</small>
      </form>
    </main>
  );
}
