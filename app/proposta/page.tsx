"use client";

import { useEffect, useMemo, useState } from "react";
import { ProposalBundle, ProposalSheet } from "../admin-workspace";

type ClientProposal = {
  id: string;
  code: string;
  client: string;
  project: string;
  status: "finalized" | "sent" | "accepted";
  data: ProposalBundle;
  manualHtml: string;
  acceptedBy: string;
  acceptedAt: string | null;
};

export default function ClientProposalPage() {
  const [record, setRecord] = useState<ClientProposal | null>(null);
  const [token] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? "");
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(token ? "" : "O endereço desta proposta está incompleto.");
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!token) return;
    void fetch(`/api/proposals?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { proposal?: ClientProposal; error?: string };
        if (!response.ok || !data.proposal) throw new Error(data.error || "Proposta não encontrada.");
        setRecord(data.proposal);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Não foi possível abrir a proposta."))
      .finally(() => setLoading(false));
  }, [token]);

  const totals = useMemo(() => {
    const proposal = record?.data?.proposal;
    const subtotal = proposal?.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) ?? 0;
    const total = subtotal * (1 - Math.min(100, Math.max(0, proposal?.discount ?? 0)) / 100);
    return { subtotal, total };
  }, [record]);

  const accept = async () => {
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/proposals", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "accept", token, acceptance: { name, email, document: documentNumber, confirmed } }),
      });
      const data = await response.json() as { proposal?: ClientProposal; error?: string };
      if (!response.ok || !data.proposal) throw new Error(data.error || "Não foi possível registrar o aceite.");
      setRecord(data.proposal);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível registrar o aceite.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <main className="client-proposal-state"><span className="client-loader" /><strong>Abrindo sua proposta SONA…</strong></main>;
  if (!record || !record.data?.proposal) return <main className="client-proposal-state client-proposal-state--error"><span>!</span><strong>Não foi possível abrir a proposta</strong><p>{error}</p></main>;

  const bundle = record.data;
  return <main className="client-proposal-shell">
    <header className="client-proposal-header">
      <div className="client-brand"><span><b>S</b><i /><b>N</b><b>A</b></span><div><strong>SONA</strong><small>TECNOLOGIA &amp; AUTOMAÇÃO</small></div></div>
      <div><span className={`proposal-state proposal-state--${record.status}`}>{record.status === "accepted" ? "Proposta aceita" : "Aguardando aceite"}</span><button onClick={() => window.print()}>Baixar / imprimir PDF</button></div>
    </header>
    <section className="client-proposal-intro"><span>PROPOSTA INDIVIDUAL · {record.code}</span><h1>Olá, {record.client}.</h1><p>Confira todas as páginas da solução preparada pela SONA. Ao final, você poderá registrar seu aceite com segurança.</p></section>
    <div className="client-document-wrap">
      {(bundle.documentMode === "manual" && bundle.templateVersion === 4 && record.manualHtml) || (bundle.documentMode === "automatic" && bundle.templateVersion === 4 && bundle.automaticHtml)
        ? <article className="proposal-document" id="proposal-print" dangerouslySetInnerHTML={{ __html: bundle.documentMode === "manual" ? record.manualHtml : bundle.automaticHtml }} />
        : <ProposalSheet proposal={bundle.proposal} subtotal={totals.subtotal} total={totals.total} productImages={bundle.productImages ?? []} itemImages={bundle.itemImages ?? {}} scopeReport={bundle.scopeReport ?? null} />}
    </div>
    <section className={`client-acceptance ${record.status === "accepted" ? "client-acceptance--done" : ""}`}>
      {record.status === "accepted" ? <div className="client-accepted"><span>✓</span><div><small>ACEITE REGISTRADO</small><h2>Proposta aceita por {record.acceptedBy}</h2><p>Confirmação registrada em {record.acceptedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(record.acceptedAt)) : "data confirmada"}. A equipe SONA poderá dar continuidade ao projeto.</p></div></div> : <>
        <div className="client-acceptance__head"><span>ETAPA FINAL</span><h2>Aceitar proposta</h2><p>Preencha seus dados para confirmar que leu e está de acordo com o escopo, os valores e as condições apresentados.</p></div>
        <div className="client-acceptance__form"><label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>CPF ou CNPJ<input value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} inputMode="numeric" /></label><label className="client-consent"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>Li e aceito integralmente esta proposta comercial, incluindo escopo, valores, prazos e condições.</span></label>{error && <p className="client-acceptance__error">{error}</p>}<button onClick={() => void accept()} disabled={sending || !confirmed}>{sending ? "Registrando aceite…" : "Aceitar proposta"}</button><small>O aceite registra os dados informados, a data e o horário da confirmação.</small></div>
      </>}
    </section>
    <footer className="client-proposal-footer">SONA · tecnologia e inteligência para o bem-estar.</footer>
  </main>;
}
