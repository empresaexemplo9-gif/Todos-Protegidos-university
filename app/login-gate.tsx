"use client";

import { useEffect, useState } from "react";

const SITE = "https://sonatecnologia.com.br";

const NAV = [
  { label: "Home", href: SITE },
  { label: "Sobre Nós", href: `${SITE}/#sobre` },
  { label: "Soluções", href: `${SITE}/#solucoes` },
  { label: "Contato", href: `${SITE}/#contato` },
];

export default function LoginGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    <main className="sona-home">
      <div className="sona-home__scene" aria-hidden="true">
        <span className="sona-home__glow sona-home__glow--warm" />
        <span className="sona-home__glow sona-home__glow--cool" />
        <span className="sona-home__grid" />
        <span className="sona-home__vignette" />
      </div>

      <header className="sona-nav">
        <a className="sona-nav__brand" href={SITE} aria-label="SONA">
          <span>S</span>
          <i />
          <span>N</span>
          <span>A</span>
        </a>

        <nav className="sona-nav__links" aria-label="Navegação principal">
          {NAV.map((item, index) => (
            <a key={item.label} href={item.href} className={index === 0 ? "is-active" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sona-nav__social">
          <a href="https://wa.me/5599999999999" aria-label="WhatsApp" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2A9.9 9.9 0 0 0 2.1 11.9c0 1.75.46 3.46 1.34 4.96L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01a9.9 9.9 0 0 0 9.93-9.9A9.9 9.9 0 0 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.83-3.05-.2-.31a8.19 8.19 0 1 1 6.98 3.87Zm4.5-6.14c-.24-.12-1.45-.72-1.68-.8-.22-.09-.39-.13-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06a6.7 6.7 0 0 1-1.97-1.22 7.4 7.4 0 0 1-1.36-1.7c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.15.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.24-.85.83-.85 2.02s.87 2.34 1 2.5c.12.16 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.17.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
            </svg>
          </a>
          <a href="https://instagram.com/sonatecnologia" aria-label="Instagram" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
              <circle cx="12" cy="12" r="4.1" />
              <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a href={`${SITE}/#contato`} aria-label="Enviar mensagem">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
              <path d="M21.6 3.2 2.9 10.4c-.7.27-.68 1.27.03 1.5l4.7 1.55 1.77 5.16c.23.66 1.1.77 1.5.2l2.35-3.4 4.7 3.46c.5.36 1.2.09 1.33-.5l3.1-13.9c.13-.6-.44-1.1-1.03-.87Zm-3.5 2.9-8.1 6.5-3.2-1.06 11.3-5.44Zm-7.7 7.6 7.4-5.94-5.8 6.7-.05.07-.35 2.62-1.2-3.45Z" />
            </svg>
          </a>
        </div>
      </header>

      <section className="sona-hero">
        <h1 className="sona-hero__wordmark" aria-label="SONA">
          <span>S</span>
          <i aria-hidden="true" />
          <span>N</span>
          <span>A</span>
        </h1>
        <p className="sona-hero__tagline">Tecnologia e inteligência para o bem-estar.</p>
        <button type="button" className="sona-hero__cta" onClick={() => setOpen(true)}>
          Acessar o Estúdio Comercial
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M5 12h13M13 6.5 18.5 12 13 17.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      <footer className="sona-home__foot">
        <span>Estúdio de propostas comerciais</span>
        <span>Clientes recebem a proposta por link direto — sem login.</span>
      </footer>

      {open && (
        <div className="sona-modal" role="dialog" aria-modal="true" aria-label="Acesso da equipe">
          <button type="button" className="sona-modal__backdrop" aria-label="Fechar" onClick={() => setOpen(false)} />
          <form className="sona-modal__card" onSubmit={submit}>
            <button type="button" className="sona-modal__close" onClick={() => setOpen(false)} aria-label="Fechar">
              ×
            </button>
            <span className="sona-modal__mark" aria-hidden="true">
              <b>S</b>
              <i />
              <b>N</b>
              <b>A</b>
            </span>
            <h2>Acesso da equipe</h2>
            <p>Entre com a senha de administrador para abrir o estúdio comercial.</p>
            <label className="sona-modal__field">
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
            {error && <p className="sona-modal__error">{error}</p>}
            <button type="submit" className="sona-modal__submit" disabled={busy || !password}>
              {busy ? "Entrando…" : "Entrar"}
            </button>
            <small className="sona-modal__hint">
              Somente a equipe SONA tem acesso. Clientes recebem a proposta por link direto.
            </small>
          </form>
        </div>
      )}
    </main>
  );
}
