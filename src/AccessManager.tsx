import { useEffect, useState } from "react";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  active: boolean;
  createdAt: string;
};

export default function AccessManager({
  currentUserId,
  onClose,
}: {
  currentUserId: string;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; password: string; role: "member" | "owner" }>({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  // Sem diálogos nativos (prompt/confirm) — tudo acontece dentro da tela.
  const [pwEditId, setPwEditId] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = (await res.json()) as { users?: ManagedUser[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar os acessos.");
      setUsers(data.users ?? []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar acessos.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const post = async (payload: unknown) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error || "Não foi possível concluir a ação.");
    return data;
  };
  const guard = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro.");
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await post({ action: "create", name: form.name, email: form.email, password: form.password, role: form.role });
      setForm({ name: "", email: "", password: "", role: "member" });
      await load();
      flash("Acesso criado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar acesso.");
    } finally {
      setBusy(false);
    }
  };
  const toggleActive = (u: ManagedUser) =>
    guard(async () => {
      await post({ action: "update", id: u.id, active: !u.active });
      await load();
    });
  const savePassword = (u: ManagedUser) =>
    guard(async () => {
      if (pwValue.trim().length < 6) {
        setError("A nova senha precisa de ao menos 6 caracteres.");
        return;
      }
      await post({ action: "update", id: u.id, password: pwValue });
      setPwEditId(null);
      setPwValue("");
      flash("Senha atualizada");
    });
  const doDelete = (u: ManagedUser) =>
    guard(async () => {
      await post({ action: "delete", id: u.id });
      setConfirmDeleteId(null);
      await load();
      flash("Acesso excluído");
    });

  const startPassword = (u: ManagedUser) => {
    setPwEditId(u.id);
    setPwValue("");
    setConfirmDeleteId(null);
  };
  const startDelete = (u: ManagedUser) => {
    setConfirmDeleteId(u.id);
    setPwEditId(null);
  };

  return (
    <div className="catalog-dialog-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <section className="catalog-dialog" role="dialog" aria-modal="true" aria-label="Acessos">
        <div className="catalog-dialog__head">
          <div>
            <span className="eyebrow">CONTROLE DE ACESSO</span>
            <h3>Acessos e senha</h3>
            <p>Somente o dono vê esta área. Crie acessos para a equipe e gerencie as senhas.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="catalog-dialog__body">
          {error && (
            <div className="budget-error">
              <span>!</span>
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          <div className="access-list">
            {loading ? (
              <div className="catalog-loading">
                <i /> Carregando acessos…
              </div>
            ) : (
              users.map((u) => (
                <div className="access-row" key={u.id}>
                  <span className="access-avatar">{u.name.charAt(0).toUpperCase()}</span>
                  <div className="access-id">
                    <strong>
                      {u.name}
                      {u.id === currentUserId ? " (você)" : ""}
                    </strong>
                    <small>
                      {u.email} · {u.role === "owner" ? "dono" : "equipe"}
                      {u.active ? "" : " · inativo"}
                    </small>
                  </div>
                  <div className="access-actions">
                    {pwEditId === u.id ? (
                      <form className="access-pw" onSubmit={(e) => { e.preventDefault(); void savePassword(u); }}>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Nova senha (mín. 6)"
                          value={pwValue}
                          onChange={(e) => setPwValue(e.target.value)}
                          minLength={6}
                        />
                        <button type="submit">Salvar</button>
                        <button type="button" onClick={() => { setPwEditId(null); setPwValue(""); }}>Cancelar</button>
                      </form>
                    ) : confirmDeleteId === u.id ? (
                      <>
                        <button className="access-danger" onClick={() => void doDelete(u)}>Confirmar exclusão</button>
                        <button onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startPassword(u)}>Senha</button>
                        {u.id !== currentUserId && (
                          <button onClick={() => void toggleActive(u)}>{u.active ? "Desativar" : "Ativar"}</button>
                        )}
                        {u.id !== currentUserId && (
                          <button className="access-danger" onClick={() => startDelete(u)}>Excluir</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="access-create" onSubmit={create}>
            <div className="access-create__head">
              <span className="eyebrow">NOVO ACESSO</span>
            </div>
            <div className="form-grid">
              <label className="field">
                Nome
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label className="field">
                Login / e-mail
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label className="field">
                Senha (mín. 6)
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                />
              </label>
              <label className="field">
                Perfil
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "member" | "owner" })}>
                  <option value="member">Equipe</option>
                  <option value="owner">Dono</option>
                </select>
              </label>
            </div>
            <div className="access-create__foot">
              <button className="btn btn--green" type="submit" disabled={busy}>
                {busy ? "Criando…" : "Criar acesso"}
              </button>
            </div>
          </form>
        </div>
        {notice && (
          <div className="toast">
            <span>✓</span>
            {notice}
          </div>
        )}
      </section>
    </div>
  );
}
