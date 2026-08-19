import { useEffect, useState } from "react";

type Header = { name: string; value: string; filled?: boolean };
type Mapping = {
  name: string; sku: string; brand: string; model: string; category: string;
  unit: string; purchasePrice: string; salePrice: string; description: string; image: string;
};
type AvaConfig = {
  url: string; method: "GET" | "POST"; body: string; headers: Header[];
  listPath: string; pageParam: string; pageSizeParam: string; pageSize: number; pageStart: number; maxPages: number;
  map: Mapping;
};
type LastSync = { at: string; fetched: number; created: number; updated: number; skipped: number };
type ApiResp = {
  config?: Partial<AvaConfig>; lastSync?: LastSync | null; error?: string;
  fields?: string[]; count?: number; created?: number; updated?: number; skipped?: number; fetched?: number;
};

const emptyMap: Mapping = { name: "", sku: "", brand: "", model: "", category: "", unit: "", purchasePrice: "", salePrice: "", description: "", image: "" };
const emptyConfig: AvaConfig = {
  url: "", method: "GET", body: "", headers: [{ name: "Authorization", value: "" }],
  listPath: "", pageParam: "", pageSizeParam: "", pageSize: 0, pageStart: 1, maxPages: 50, map: { ...emptyMap },
};

const mapLabels: Array<[keyof Mapping, string]> = [
  ["name", "Nome do produto *"], ["sku", "Código / SKU"], ["brand", "Marca"], ["model", "Modelo"],
  ["category", "Categoria"], ["unit", "Unidade"], ["purchasePrice", "Preço de compra"], ["salePrice", "Preço de venda"], ["description", "Descrição"], ["image", "Imagem (URL do produto)"],
];

export default function AvaIntegration({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<AvaConfig>(emptyConfig);
  const [fields, setFields] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "test" | "save" | "sync">("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastSync, setLastSync] = useState<LastSync | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/integracao/ava", { cache: "no-store" });
        const data = (await res.json()) as ApiResp;
        if (res.ok && data.config) {
          const cfg = data.config;
          setConfig({
            ...emptyConfig,
            ...cfg,
            map: { ...emptyMap, ...(cfg.map || {}) },
            headers: (cfg.headers || []).length
              ? (cfg.headers as Header[]).map((h) => ({ name: h.name, value: "", filled: h.filled }))
              : emptyConfig.headers,
          });
        }
        if (data.lastSync) setLastSync(data.lastSync);
      } catch { /* mantém o formulário vazio */ }
    })();
  }, []);

  const post = async (action: string) => {
    const res = await fetch("/api/integracao/ava", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, config }),
    });
    const data = (await res.json()) as ApiResp;
    if (!res.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
    return data;
  };
  const flash = (m: string) => { setNotice(m); window.setTimeout(() => setNotice(""), 3200); };

  const test = async () => {
    setBusy("test"); setError("");
    try {
      const d = await post("test");
      setFields(d.fields || []);
      flash(`Conexão OK — ${d.count ?? 0} registro(s) na amostra, ${(d.fields || []).length} campos detectados.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao testar."); } finally { setBusy(""); }
  };
  const save = async () => {
    setBusy("save"); setError("");
    try { await post("save"); flash("Configuração salva neste computador."); }
    catch (e) { setError(e instanceof Error ? e.message : "Falha ao salvar."); } finally { setBusy(""); }
  };
  const sync = async () => {
    setBusy("sync"); setError("");
    try {
      const d = await post("sync");
      setLastSync({ at: new Date().toISOString(), fetched: d.fetched ?? 0, created: d.created ?? 0, updated: d.updated ?? 0, skipped: d.skipped ?? 0 });
      flash(`Sincronizado: ${d.created ?? 0} novos, ${d.updated ?? 0} atualizados, ${d.skipped ?? 0} ignorados (${d.fetched ?? 0} lidos).`);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao sincronizar."); } finally { setBusy(""); }
  };

  const setHeader = (i: number, patch: Partial<Header>) => setConfig((c) => ({ ...c, headers: c.headers.map((h, idx) => idx === i ? { ...h, ...patch } : h) }));
  const addHeader = () => setConfig((c) => ({ ...c, headers: [...c.headers, { name: "", value: "" }] }));
  const removeHeader = (i: number) => setConfig((c) => ({ ...c, headers: c.headers.filter((_, idx) => idx !== i) }));
  const setMap = (k: keyof Mapping, v: string) => setConfig((c) => ({ ...c, map: { ...c.map, [k]: v } }));

  return (
    <div className="catalog-dialog-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <section className="catalog-dialog ava-dialog" role="dialog" aria-modal="true" aria-label="Integração AVA">
        <div className="catalog-dialog__head">
          <div>
            <span className="eyebrow">INTEGRAÇÃO · AVA</span>
            <h3>Conectar catálogo do AVA</h3>
            <p>Cole o endereço do AVA, a autenticação e o endpoint de produtos. Tudo fica só neste computador.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="catalog-dialog__body">
          {error && <div className="budget-error"><span>!</span>{error}<button onClick={() => setError("")}>×</button></div>}

          <div className="form-grid">
            <label className="field field--full">URL do endpoint de produtos<input value={config.url} onChange={(e) => setConfig({ ...config, url: e.target.value })} placeholder="https://ava.app.br/api/produtos" /></label>
            <label className="field">Método<select value={config.method} onChange={(e) => setConfig({ ...config, method: e.target.value as "GET" | "POST" })}><option>GET</option><option>POST</option></select></label>
            <label className="field">Caminho da lista no JSON<input value={config.listPath} onChange={(e) => setConfig({ ...config, listPath: e.target.value })} placeholder="ex.: data · vazio = a resposta já é a lista" /></label>
          </div>
          {config.method === "POST" && <label className="field field--full">Corpo da requisição (JSON, opcional)<textarea rows={2} value={config.body} onChange={(e) => setConfig({ ...config, body: e.target.value })} placeholder='{"filtro":"todos"}' /></label>}

          <div className="ava-section">
            <div className="ava-section__head"><span className="eyebrow">AUTENTICAÇÃO (CABEÇALHOS)</span><button className="mini-add" onClick={addHeader}>＋ Cabeçalho</button></div>
            {config.headers.map((h, i) => (
              <div className="ava-header-row" key={i}>
                <input placeholder="Nome (ex.: Authorization)" value={h.name} onChange={(e) => setHeader(i, { name: e.target.value })} />
                <input placeholder={h.filled ? "•••••• (mantém o salvo)" : "Valor (ex.: Bearer TOKEN)"} value={h.value} onChange={(e) => setHeader(i, { value: e.target.value, filled: false })} />
                <button onClick={() => removeHeader(i)} aria-label="Remover cabeçalho">×</button>
              </div>
            ))}
            <small className="ava-hint">Cole aqui o token que o AVA usa (ex.: <b>Authorization: Bearer …</b>, <b>Cookie: …</b> ou um cabeçalho próprio). Esse valor você pega com o outro Claude, que já conectou.</small>
          </div>

          <details className="ava-section">
            <summary>Paginação (opcional — se o AVA devolve por páginas)</summary>
            <div className="form-grid">
              <label className="field">Parâmetro de página<input value={config.pageParam} onChange={(e) => setConfig({ ...config, pageParam: e.target.value })} placeholder="ex.: page" /></label>
              <label className="field">Parâmetro de tamanho<input value={config.pageSizeParam} onChange={(e) => setConfig({ ...config, pageSizeParam: e.target.value })} placeholder="ex.: limit" /></label>
              <label className="field">Itens por página<input type="number" min="0" value={config.pageSize} onChange={(e) => setConfig({ ...config, pageSize: Number(e.target.value) })} /></label>
              <label className="field">Página inicial<input type="number" min="0" value={config.pageStart} onChange={(e) => setConfig({ ...config, pageStart: Number(e.target.value) })} /></label>
            </div>
          </details>

          <div className="ava-section">
            <div className="ava-section__head"><span className="eyebrow">DE → PARA DOS CAMPOS</span><button className="btn btn--ghost" onClick={() => void test()} disabled={busy !== "" || !config.url}>{busy === "test" ? "Testando…" : "Testar conexão"}</button></div>
            <p className="ava-hint">Clique em <b>Testar conexão</b> para o AVA devolver uma amostra e detectar os campos. Depois diga qual campo do AVA vira cada campo do catálogo.</p>
            <datalist id="ava-fields">{fields.map((f) => <option key={f} value={f} />)}</datalist>
            <div className="form-grid">
              {mapLabels.map(([k, label]) => (
                <label className="field" key={k}>{label}<input list="ava-fields" value={config.map[k]} onChange={(e) => setMap(k, e.target.value)} placeholder="campo do AVA" /></label>
              ))}
            </div>
            {fields.length > 0 && <small className="ava-hint">Campos detectados: {fields.slice(0, 40).join(", ")}{fields.length > 40 ? "…" : ""}</small>}
          </div>

          {lastSync && <div className="ava-lastsync">✓ Última sincronização: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(lastSync.at))} — <b>{lastSync.created}</b> novos, <b>{lastSync.updated}</b> atualizados, {lastSync.skipped} ignorados ({lastSync.fetched} lidos)</div>}
        </div>
        <div className="catalog-dialog__footer">
          <button className="btn btn--ghost" onClick={onClose}>Fechar</button>
          <button className="btn btn--ghost" onClick={() => void save()} disabled={busy !== ""}>{busy === "save" ? "Salvando…" : "Salvar"}</button>
          <button className="btn btn--green" onClick={() => void sync()} disabled={busy !== "" || !config.url || !config.map.name}>{busy === "sync" ? "Sincronizando…" : "Sincronizar agora"}</button>
        </div>
        {notice && <div className="toast"><span>✓</span>{notice}</div>}
      </section>
    </div>
  );
}
