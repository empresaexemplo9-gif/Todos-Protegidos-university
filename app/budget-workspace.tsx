"use client";

import { useEffect, useMemo, useState } from "react";
import CatalogImport from "./catalog-import";

type CatalogKind = "equipment" | "service";
type BudgetStatus = "draft" | "sent" | "approved";
type WorkspaceView = "composition" | "catalog" | "history";

type CatalogItem = {
  id: string;
  kind: CatalogKind;
  name: string;
  category: string;
  brand: string;
  model: string;
  sku: string;
  system: string;
  description: string;
  sourceUrl: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  updatedBy: string;
  updatedAt: string;
};

type BudgetLine = {
  id: string;
  budgetId: string;
  catalogItemId: string | null;
  kind: CatalogKind;
  name: string;
  category: string;
  brand: string;
  model: string;
  sku: string;
  unit: string;
  environment: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  discountPercent: number;
  sortOrder: number;
  updatedAt: string;
};

type Budget = {
  id: string;
  code: string;
  client: string;
  project: string;
  status: BudgetStatus;
  validityDays: number;
  discountPercent: number;
  adjustment: number;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  items: BudgetLine[];
};

type ApiData = { catalogItems?: CatalogItem[]; budgets?: Budget[]; error?: string };

export type BudgetTransfer = {
  items: Array<{ id: number; category: string; description: string; qty: number; unit: string; unitPrice: number }>;
  discountPercent: number;
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const statusLabel: Record<BudgetStatus, string> = {
  draft: "Em elaboração",
  sent: "Enviado",
  approved: "Aprovado",
};

function totalFor(budget: Budget) {
  const subtotal = budget.items.reduce((sum, item) => sum + item.salePrice * item.quantity * (1 - item.discountPercent / 100), 0);
  return Math.max(0, subtotal * (1 - budget.discountPercent / 100) + budget.adjustment);
}

export default function AvaBudgetWorkspace({ onUseInProposal }: { onUseInProposal: (result: BudgetTransfer) => void }) {
  const [view, setView] = useState<WorkspaceView>("composition");
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("equipment");
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [activeId, setActiveId] = useState("");
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Partial<CatalogItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState("");
  const [confirmPrompt, setConfirmPrompt] = useState<{ message: string; resolve: (ok: boolean) => void } | null>(null);
  const askConfirm = (message: string) => new Promise<boolean>((resolve) => setConfirmPrompt({ message, resolve }));
  const [importOpen, setImportOpen] = useState(false);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const loadData = async (quiet = false, preferredId = "") => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/budget", { cache: "no-store" });
      const data = await response.json() as ApiData;
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar os orçamentos.");
      const nextBudgets = data.budgets ?? [];
      setCatalogItems(data.catalogItems ?? []);
      setBudgets(nextBudgets);
      setActiveId((current) => {
        const candidate = preferredId || current;
        return nextBudgets.some((budget) => budget.id === candidate) ? candidate : (nextBudgets[0]?.id ?? "");
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os orçamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const post = async <T,>(payload: unknown): Promise<T> => {
    const response = await fetch("/api/budget", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(data.error || "Não foi possível salvar a alteração.");
    return data;
  };

  const activeBudget = useMemo(() => budgets.find((budget) => budget.id === activeId) ?? null, [budgets, activeId]);

  const totals = useMemo(() => {
    const base = (activeBudget?.items ?? []).reduce((sum, item) => {
      const gross = item.salePrice * item.quantity;
      const net = gross * (1 - item.discountPercent / 100);
      return {
        cost: sum.cost + item.purchasePrice * item.quantity,
        gross: sum.gross + gross,
        lineDiscount: sum.lineDiscount + (gross - net),
        net: sum.net + net,
        equipment: sum.equipment + (item.kind === "equipment" ? net : 0),
        services: sum.services + (item.kind === "service" ? net : 0),
      };
    }, { cost: 0, gross: 0, lineDiscount: 0, net: 0, equipment: 0, services: 0 });
    const generalDiscount = base.net * ((activeBudget?.discountPercent ?? 0) / 100);
    const total = Math.max(0, base.net - generalDiscount + (activeBudget?.adjustment ?? 0));
    return { ...base, generalDiscount, total, margin: total > 0 ? ((total - base.cost) / total) * 100 : 0 };
  }, [activeBudget]);

  const patchBudgetLocal = (patch: Partial<Budget>) => {
    setBudgets((current) => current.map((budget) => budget.id === activeId ? { ...budget, ...patch } : budget));
  };

  const persistBudget = async (patch: Partial<Budget>) => {
    if (!activeBudget) return;
    patchBudgetLocal(patch);
    setSyncing("budget");
    try {
      await post({ action: "updateBudget", budgetId: activeBudget.id, budget: patch });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o orçamento.");
      await loadData(true, activeBudget.id);
    } finally {
      setSyncing("");
    }
  };

  const patchLineLocal = (lineId: string, patch: Partial<BudgetLine>) => {
    setBudgets((current) => current.map((budget) => budget.id === activeId
      ? { ...budget, items: budget.items.map((line) => line.id === lineId ? { ...line, ...patch } : line) }
      : budget));
  };

  const persistLine = async (lineId: string, patch: Partial<BudgetLine>) => {
    if (!activeBudget) return;
    patchLineLocal(lineId, patch);
    setSyncing(lineId);
    try {
      await post({ action: "updateBudgetItem", budgetId: activeBudget.id, lineId, line: patch });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a linha.");
      await loadData(true, activeBudget.id);
    } finally {
      setSyncing("");
    }
  };

  const newBudget = async () => {
    setSaving(true);
    try {
      const data = await post<{ budgetId: string }>({ action: "createBudget", budget: { client: "Novo cliente", project: "Novo projeto" } });
      await loadData(true, data.budgetId);
      setView("composition");
      showNotice("Novo orçamento criado");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o orçamento.");
    } finally {
      setSaving(false);
    }
  };

  const addToBudget = async (item: CatalogItem) => {
    if (!activeBudget) return;
    setSyncing(`add-${item.id}`);
    try {
      await post({ action: "addBudgetItem", budgetId: activeBudget.id, itemId: item.id, line: { quantity: 1, environment: "Geral" } });
      await loadData(true, activeBudget.id);
      showNotice(`${item.name} adicionado ao orçamento`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível adicionar o item.");
    } finally {
      setSyncing("");
    }
  };

  const removeLine = async (line: BudgetLine) => {
    if (!activeBudget) return;
    if (!(await askConfirm(`Remover “${line.name}” deste orçamento?`))) return;
    try {
      await post({ action: "deleteBudgetItem", budgetId: activeBudget.id, lineId: line.id });
      setBudgets((current) => current.map((budget) => budget.id === activeBudget.id
        ? { ...budget, items: budget.items.filter((item) => item.id !== line.id) }
        : budget));
      showNotice("Item removido do orçamento");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível remover o item.");
    }
  };

  const clearBudget = async () => {
    if (!activeBudget?.items.length) return;
    if (!(await askConfirm("Limpar todos os itens deste orçamento?"))) return;
    try {
      await post({ action: "clearBudget", budgetId: activeBudget.id });
      patchBudgetLocal({ items: [] });
      showNotice("Composição do orçamento limpa");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível limpar o orçamento.");
    }
  };

  const deleteBudget = async (budget: Budget) => {
    if (!(await askConfirm(`Excluir definitivamente o orçamento ${budget.code}?`))) return;
    try {
      await post({ action: "deleteBudget", budgetId: budget.id });
      await loadData(true);
      showNotice("Orçamento excluído");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir o orçamento.");
    }
  };

  const openCatalogEditor = (item?: CatalogItem) => setEditor(item ? { ...item } : {
    kind: catalogKind,
    name: "",
    category: catalogKind === "equipment" ? "Automação" : "Instalação",
    brand: catalogKind === "equipment" ? "" : "SONA",
    model: "",
    sku: "",
    system: "SMARTLIFE",
    description: "",
    sourceUrl: "",
    unit: catalogKind === "equipment" ? "un" : "sv",
    purchasePrice: 0,
    salePrice: 0,
  });

  const saveCatalogEditor = async () => {
    if (!editor?.name?.trim()) { setError("Informe o nome do item."); return; }
    setSaving(true);
    try {
      await post({ action: "upsertCatalogItem", item: editor });
      setEditor(null);
      await loadData(true, activeId);
      showNotice(editor.id ? "Item atualizado no catálogo" : "Item cadastrado no catálogo");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o item.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCatalogItem = async (item: CatalogItem) => {
    if (!(await askConfirm(`Excluir “${item.name}” do catálogo? Os orçamentos existentes manterão a linha.`))) return;
    try {
      await post({ action: "deleteCatalogItem", itemId: item.id });
      setCatalogItems((current) => current.filter((entry) => entry.id !== item.id));
      showNotice("Item removido do catálogo");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir o item.");
    }
  };

  const filteredCatalog = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return catalogItems.filter((item) => {
      const searchable = [item.name, item.brand, item.model, item.sku, item.category, item.system].join(" ").toLocaleLowerCase("pt-BR");
      return item.kind === catalogKind
        && (!systemFilter || item.system === systemFilter)
        && (!categoryFilter || item.category === categoryFilter)
        && (!term || searchable.includes(term));
    });
  }, [catalogItems, catalogKind, search, systemFilter, categoryFilter]);

  const systems = useMemo(() => Array.from(new Set(catalogItems.filter((item) => item.kind === catalogKind).map((item) => item.system))).sort(), [catalogItems, catalogKind]);
  const categories = useMemo(() => Array.from(new Set(catalogItems.filter((item) => item.kind === catalogKind).map((item) => item.category))).sort(), [catalogItems, catalogKind]);
  const catalogVisual = (item: CatalogItem) => {
    if (item.kind === "service") return "100% 100%";
    const value = `${item.category} ${item.name}`.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/seguranca|fechadura|acesso|camera|sensor/.test(value)) return "0% 100%";
    if (/rede|wi-fi|wifi|switch|roteador|access point/.test(value)) return "100% 0%";
    if (/energia|condicionador|rack|infraestrutura/.test(value)) return "50% 100%";
    if (/audio|som|cinema|receiver|caixa|subwoofer|video/.test(value)) return "50% 0%";
    return "0% 0%";
  };

  const sendToProposal = () => {
    if (!activeBudget) return;
    const items = activeBudget.items.map((item, index) => ({
      id: index + 1,
      category: item.category,
      description: `${item.environment} · ${[item.brand, item.model, item.name].filter(Boolean).join(" · ")}`,
      qty: item.quantity,
      unit: item.unit,
      unitPrice: item.salePrice * (1 - item.discountPercent / 100),
    }));
    if (activeBudget.adjustment !== 0) items.push({
      id: items.length + 1, category: "Ajuste comercial", description: "Acréscimo ou ajuste do orçamento",
      qty: 1, unit: "sv", unitPrice: activeBudget.adjustment,
    });
    onUseInProposal({ items, discountPercent: activeBudget.discountPercent });
  };

  return (
    <div className="ava-budget">
      <section className="ava-head">
        <div>
          <span className="eyebrow">ORÇAMENTO COMERCIAL · FLUXO AVA</span>
          <div className="ava-title-row"><h2>{activeBudget?.code ?? "Orçamento"}</h2>{activeBudget && <span className={`ava-status ava-status--${activeBudget.status}`}>{statusLabel[activeBudget.status]}</span>}</div>
          <p>Monte a composição por ambiente, ajuste preços e margens e envie o resultado direto para a proposta Sona.</p>
        </div>
        <div className="ava-head__actions">
          <button className="btn btn--ghost" onClick={() => void loadData()} disabled={loading}>↻ Atualizar</button>
          <button className="btn btn--dark" onClick={() => void newBudget()} disabled={saving}>＋ Novo orçamento</button>
        </div>
      </section>

      {error && <div className="budget-error"><span>!</span>{error}<button onClick={() => setError("")}>×</button></div>}

      {activeBudget && <section className="ava-identity" aria-label="Dados do orçamento">
        <label><span>CLIENTE</span><input value={activeBudget.client} onChange={(event) => patchBudgetLocal({ client: event.target.value })} onBlur={(event) => void persistBudget({ client: event.target.value })} /></label>
        <label><span>PROJETO / OBRA</span><input value={activeBudget.project} onChange={(event) => patchBudgetLocal({ project: event.target.value })} onBlur={(event) => void persistBudget({ project: event.target.value })} /></label>
        <label><span>VALIDADE</span><div className="ava-input-suffix"><input type="number" min="1" max="365" value={activeBudget.validityDays} onChange={(event) => patchBudgetLocal({ validityDays: Number(event.target.value) })} onBlur={(event) => void persistBudget({ validityDays: Number(event.target.value) })} /><b>dias</b></div></label>
        <label><span>STATUS</span><select value={activeBudget.status} onChange={(event) => void persistBudget({ status: event.target.value as BudgetStatus })}><option value="draft">Em elaboração</option><option value="sent">Enviado</option><option value="approved">Aprovado</option></select></label>
        <div className="ava-save-state"><i className={syncing ? "saving" : ""} />{syncing ? "Salvando…" : `Salvo por ${activeBudget.updatedBy.split("@")[0]}`}</div>
      </section>}

      <section className="ava-summary" aria-label="Resumo financeiro">
        <div><small>CUSTO DA COMPOSIÇÃO</small><strong>{brl.format(totals.cost)}</strong><span>custos internos</span></div>
        <div><small>EQUIPAMENTOS</small><strong>{brl.format(totals.equipment)}</strong><span>venda após desconto por item</span></div>
        <div><small>SERVIÇOS</small><strong>{brl.format(totals.services)}</strong><span>venda após desconto por item</span></div>
        <div><small>DESCONTOS</small><strong>− {brl.format(totals.lineDiscount + totals.generalDiscount)}</strong><span>por item + geral</span></div>
        <div className="ava-summary__total"><small>TOTAL DO ORÇAMENTO</small><strong>{brl.format(totals.total)}</strong><span>margem bruta {totals.margin.toFixed(1)}%</span></div>
      </section>

      <section className="ava-panel">
        <div className="ava-view-tabs" role="tablist" aria-label="Área do orçamento">
          <button className={view === "composition" ? "active" : ""} onClick={() => setView("composition")}><span>▤</span> Composição <b>{activeBudget?.items.length ?? 0}</b></button>
          <button className={view === "catalog" ? "active" : ""} onClick={() => setView("catalog")}><span>▦</span> Catálogo <b>{catalogItems.length}</b></button>
          <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><span>◷</span> Orçamentos <b>{budgets.length}</b></button>
        </div>

        {loading ? <div className="catalog-loading"><i /> Carregando base comercial…</div> : view === "composition" ? (
          <>
            <div className="ava-table-head">
              <div><strong>Composição do orçamento</strong><small>Preços e quantidades podem ser alterados diretamente na tabela.</small></div>
              <button className="btn btn--ghost" onClick={() => setView("catalog")}>＋ Adicionar do catálogo</button>
            </div>
            <div className="ava-table-wrap">
              <table className="ava-table ava-table--composition">
                <thead><tr><th>Ambiente</th><th>Produto / serviço</th><th>Tipo</th><th>Custo un.</th><th>Venda un.</th><th>Qtd.</th><th>Desc. %</th><th>Total</th><th /></tr></thead>
                <tbody>
                  {activeBudget?.items.map((line) => (
                    <tr key={line.id}>
                      <td><input className="ava-cell-input ava-cell-input--environment" value={line.environment} onChange={(event) => patchLineLocal(line.id, { environment: event.target.value })} onBlur={(event) => void persistLine(line.id, { environment: event.target.value })} /></td>
                      <td><div className="ava-line-name"><strong>{line.name}</strong><small>{[line.brand, line.model, line.sku].filter(Boolean).join(" · ")}</small></div></td>
                      <td><span className={`ava-kind ava-kind--${line.kind}`}>{line.kind === "equipment" ? "Equipamento" : "Serviço"}</span></td>
                      <td><div className="ava-money-input"><span>R$</span><input type="number" min="0" step="0.01" value={line.purchasePrice} onChange={(event) => patchLineLocal(line.id, { purchasePrice: Number(event.target.value) })} onBlur={(event) => void persistLine(line.id, { purchasePrice: Number(event.target.value) })} /></div></td>
                      <td><div className="ava-money-input ava-money-input--sale"><span>R$</span><input type="number" min="0" step="0.01" value={line.salePrice} onChange={(event) => patchLineLocal(line.id, { salePrice: Number(event.target.value) })} onBlur={(event) => void persistLine(line.id, { salePrice: Number(event.target.value) })} /></div></td>
                      <td><div className="ava-qty"><button onClick={() => void persistLine(line.id, { quantity: Math.max(line.kind === "service" ? .5 : 1, line.quantity - (line.kind === "service" ? .5 : 1)) })}>−</button><input type="number" min={line.kind === "service" ? ".5" : "1"} step={line.kind === "service" ? ".5" : "1"} value={line.quantity} onChange={(event) => patchLineLocal(line.id, { quantity: Number(event.target.value) })} onBlur={(event) => void persistLine(line.id, { quantity: Number(event.target.value) })} /><button onClick={() => void persistLine(line.id, { quantity: line.quantity + (line.kind === "service" ? .5 : 1) })}>＋</button></div></td>
                      <td><div className="ava-percent-input"><input type="number" min="0" max="100" step=".1" value={line.discountPercent} onChange={(event) => patchLineLocal(line.id, { discountPercent: Number(event.target.value) })} onBlur={(event) => void persistLine(line.id, { discountPercent: Number(event.target.value) })} /><span>%</span></div></td>
                      <td><strong className="ava-line-total">{brl.format(line.salePrice * line.quantity * (1 - line.discountPercent / 100))}</strong></td>
                      <td><button className="ava-delete" onClick={() => void removeLine(line)} title="Remover do orçamento">×</button></td>
                    </tr>
                  ))}
                  {!activeBudget?.items.length && <tr><td colSpan={9}><div className="catalog-empty"><span>▦</span><strong>Orçamento sem itens</strong><p>Abra o catálogo para incluir equipamentos e serviços.</p><button className="btn btn--dark" onClick={() => setView("catalog")}>Selecionar no catálogo</button></div></td></tr>}
                </tbody>
              </table>
            </div>
            {activeBudget && <div className="ava-commercial-rules">
              <div><span className="eyebrow">FECHAMENTO COMERCIAL</span><p>Os ajustes abaixo são aplicados ao total da composição.</p></div>
              <label>Desconto geral<div className="ava-percent-input"><input type="number" min="0" max="100" step=".1" value={activeBudget.discountPercent} onChange={(event) => patchBudgetLocal({ discountPercent: Number(event.target.value) })} onBlur={(event) => void persistBudget({ discountPercent: Number(event.target.value) })} /><span>%</span></div></label>
              <label>Acréscimo / ajuste<div className="ava-money-input"><span>R$</span><input type="number" step="0.01" value={activeBudget.adjustment} onChange={(event) => patchBudgetLocal({ adjustment: Number(event.target.value) })} onBlur={(event) => void persistBudget({ adjustment: Number(event.target.value) })} /></div></label>
              <div className="ava-final"><small>TOTAL FINAL</small><strong>{brl.format(totals.total)}</strong></div>
            </div>}
            <div className="ava-footer"><div><span className="live-dot" /><p><strong>Orçamento individual e compartilhado</strong><small>Este orçamento mantém sua própria composição; o catálogo continua disponível para toda a equipe.</small></p></div><div><button className="btn btn--ghost" onClick={() => void clearBudget()} disabled={!activeBudget?.items.length}>Limpar</button><button className="btn btn--dark" onClick={sendToProposal} disabled={!activeBudget?.items.length}>Usar na proposta <span>→</span></button></div></div>
          </>
        ) : view === "catalog" ? (
          <>
            <div className="ava-catalog-toolbar">
              <div className="catalog-tabs"><button className={catalogKind === "equipment" ? "active" : ""} onClick={() => { setCatalogKind("equipment"); setCategoryFilter(""); setSystemFilter(""); }}>Equipamentos</button><button className={catalogKind === "service" ? "active" : ""} onClick={() => { setCatalogKind("service"); setCategoryFilter(""); setSystemFilter(""); }}>Serviços</button></div>
              <label className="catalog-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto, marca, modelo ou código" /></label>
              <div className="catalog-filters"><select value={systemFilter} onChange={(event) => setSystemFilter(event.target.value)}><option value="">Todos os sistemas</option>{systems.map((system) => <option key={system}>{system}</option>)}</select><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Todas as categorias</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
              <button className="btn btn--ghost" onClick={() => setImportOpen(true)}>⇪ Importar CSV</button><button className="btn btn--dark" onClick={() => openCatalogEditor()}>＋ Cadastrar</button>
            </div>
            <div className="ava-table-wrap"><table className="ava-table ava-table--catalog"><thead><tr><th>Produto / serviço</th><th>Sistema</th><th>Compra</th><th>Venda</th><th>Margem</th><th>Ações</th></tr></thead><tbody>
              {filteredCatalog.map((item) => {
                const margin = item.salePrice > 0 ? ((item.salePrice - item.purchasePrice) / item.salePrice) * 100 : 0;
                return <tr key={item.id}><td><div className="ava-product"><span className="ava-product__visual" style={{ backgroundPosition: catalogVisual(item) }} /><div><strong>{item.name}</strong><small>{[item.brand, item.model, item.category].filter(Boolean).join(" · ")}</small><em>{item.sku || "Sem código"}</em></div></div></td><td><span className="system-tag">{item.system}</span></td><td>{brl.format(item.purchasePrice)}</td><td><strong className="ava-sale-price">{brl.format(item.salePrice)}</strong></td><td><span className={margin < 20 ? "ava-margin ava-margin--low" : "ava-margin"}>{margin.toFixed(1)}%</span></td><td><div className="ava-catalog-actions"><button className="btn btn--dark" onClick={() => void addToBudget(item)} disabled={syncing === `add-${item.id}`}>{syncing === `add-${item.id}` ? "Adicionando…" : "＋ Incluir"}</button><button onClick={() => openCatalogEditor(item)} title="Editar">✎</button><button onClick={() => void deleteCatalogItem(item)} title="Excluir">×</button></div></td></tr>;
              })}
              {!filteredCatalog.length && <tr><td colSpan={6}><div className="catalog-empty"><span>⌕</span><strong>Nenhum item encontrado</strong><p>Altere os filtros ou cadastre um novo item.</p></div></td></tr>}
            </tbody></table></div>
          </>
        ) : (
          <div className="ava-table-wrap"><table className="ava-table ava-table--history"><thead><tr><th>Orçamento</th><th>Cliente / projeto</th><th>Status</th><th>Itens</th><th>Total</th><th>Última edição</th><th /></tr></thead><tbody>{budgets.map((budget) => <tr key={budget.id} className={budget.id === activeId ? "active-budget" : ""}><td><strong>{budget.code}</strong></td><td><div className="ava-line-name"><strong>{budget.client}</strong><small>{budget.project}</small></div></td><td><span className={`ava-status ava-status--${budget.status}`}>{statusLabel[budget.status]}</span></td><td>{budget.items.length}</td><td><strong className="ava-sale-price">{brl.format(totalFor(budget))}</strong></td><td>{dateTime.format(new Date(budget.updatedAt))}<small className="ava-updated-by">{budget.updatedBy.split("@")[0]}</small></td><td><div className="ava-history-actions"><button className="btn btn--ghost" onClick={() => { setActiveId(budget.id); setView("composition"); }}>Abrir</button><button className="ava-delete" onClick={() => void deleteBudget(budget)} title="Excluir orçamento">×</button></div></td></tr>)}</tbody></table></div>
        )}
      </section>

      {editor && <div className="catalog-dialog-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditor(null); }}><section className="catalog-dialog" role="dialog" aria-modal="true" aria-label="Editor do catálogo">
        <div className="catalog-dialog__head"><div><span className="eyebrow">CATÁLOGO COMERCIAL SONA</span><h3>{editor.id ? "Editar item" : "Novo item"}</h3><p>Custos e preços ficarão disponíveis para os orçamentos da equipe.</p></div><button onClick={() => setEditor(null)} aria-label="Fechar">×</button></div>
        <div className="catalog-dialog__body"><div className="form-grid">
          <label className="field field--full">Nome do item<input autoFocus value={editor.name ?? ""} onChange={(event) => setEditor({ ...editor, name: event.target.value })} /></label>
          <label className="field">Tipo<select value={editor.kind ?? catalogKind} onChange={(event) => setEditor({ ...editor, kind: event.target.value as CatalogKind })}><option value="equipment">Equipamento</option><option value="service">Serviço</option></select></label>
          <label className="field">Sistema / plano<select value={editor.system ?? "SMARTLIFE"} onChange={(event) => setEditor({ ...editor, system: event.target.value })}><option>SMARTLIFE</option><option>VETRA</option><option>SCENARIO</option></select></label>
          <label className="field">Marca / fornecedor<input value={editor.brand ?? ""} onChange={(event) => setEditor({ ...editor, brand: event.target.value })} /></label>
          <label className="field">Modelo<input value={editor.model ?? ""} onChange={(event) => setEditor({ ...editor, model: event.target.value })} /></label>
          <label className="field">Categoria<input value={editor.category ?? ""} onChange={(event) => setEditor({ ...editor, category: event.target.value })} /></label>
          <label className="field">Código / SKU<input value={editor.sku ?? ""} onChange={(event) => setEditor({ ...editor, sku: event.target.value })} /></label>
          <label className="field">Unidade<input value={editor.unit ?? "un"} onChange={(event) => setEditor({ ...editor, unit: event.target.value })} /></label>
          <label className="field">Valor de compra (R$)<input type="number" min="0" step="0.01" value={editor.purchasePrice ?? 0} onChange={(event) => setEditor({ ...editor, purchasePrice: Number(event.target.value) })} /></label>
          <label className="field">Valor de venda (R$)<input type="number" min="0" step="0.01" value={editor.salePrice ?? 0} onChange={(event) => setEditor({ ...editor, salePrice: Number(event.target.value) })} /></label>
          <label className="field field--full">Descrição / observações<textarea rows={3} value={editor.description ?? ""} onChange={(event) => setEditor({ ...editor, description: event.target.value })} /></label>
          <label className="field field--full">Link da ficha ou fonte<input type="url" value={editor.sourceUrl ?? ""} onChange={(event) => setEditor({ ...editor, sourceUrl: event.target.value })} placeholder="https://" /></label>
        </div></div>
        <div className="catalog-dialog__footer"><button className="btn btn--ghost" onClick={() => setEditor(null)}>Cancelar</button><button className="btn btn--dark" onClick={() => void saveCatalogEditor()} disabled={saving}>{saving ? "Salvando…" : "Salvar no catálogo"}</button></div>
      </section></div>}

      {confirmPrompt && <div className="catalog-dialog-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) { confirmPrompt.resolve(false); setConfirmPrompt(null); } }}><section className="confirm-dialog" role="dialog" aria-modal="true"><p>{confirmPrompt.message}</p><div className="confirm-dialog__actions"><button className="btn btn--ghost" onClick={() => { confirmPrompt.resolve(false); setConfirmPrompt(null); }}>Cancelar</button><button className="btn btn--dark" onClick={() => { confirmPrompt.resolve(true); setConfirmPrompt(null); }}>Confirmar</button></div></section></div>}

      {importOpen && <CatalogImport onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); void loadData(true, activeId); showNotice("Catálogo atualizado a partir do arquivo"); }} />}

      {notice && <div className="toast"><span>✓</span>{notice}</div>}
    </div>
  );
}
