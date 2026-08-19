"use client";

import { useMemo, useState } from "react";

type Row = Record<string, string>;
type ImportResult = { created: number; updated: number; skipped: number };

const FIELDS: Array<{ key: string; label: string; required?: boolean }> = [
  { key: "name", label: "Nome do item", required: true },
  { key: "kind", label: "Tipo (equipamento/serviço)" },
  { key: "category", label: "Categoria" },
  { key: "brand", label: "Marca / fornecedor" },
  { key: "model", label: "Modelo" },
  { key: "sku", label: "Código / SKU" },
  { key: "system", label: "Sistema / plano" },
  { key: "unit", label: "Unidade" },
  { key: "purchasePrice", label: "Preço de compra" },
  { key: "salePrice", label: "Preço de venda" },
  { key: "description", label: "Descrição" },
  { key: "imageUrl", label: "Imagem (URL da foto)" },
];

// Leitor de CSV tolerante: detecta separador ( , ; ou tab ), respeita aspas e quebras dentro do campo.
function parseCsv(text: string): { headers: string[]; rows: Row[] } {
  const clean = text.replace(/^﻿/, "");
  const firstBreak = clean.indexOf("\n");
  const head = clean.slice(0, firstBreak >= 0 ? firstBreak : clean.length);
  const delim =
    head.split(";").length > head.split(",").length
      ? ";"
      : head.split("\t").length > head.split(",").length
        ? "\t"
        : ",";
  const table: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); table.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); table.push(row); }
  const filled = table.filter((r) => r.some((c) => String(c).trim() !== ""));
  if (!filled.length) return { headers: [], rows: [] };
  const headers = filled[0].map((h, i) => String(h).trim() || `Coluna ${i + 1}`);
  const rows = filled.slice(1).map((r) => {
    const obj: Row = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
  return { headers, rows };
}

// Adivinha o campo pela nomenclatura da coluna (ordem importa: preço antes de nome).
function guessField(header: string): string {
  const n = header.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/(imagem|image|foto|photo|thumbnail|url)/.test(n)) return "imageUrl";
  if (/(descric|observ|detalhe)/.test(n)) return "description";
  if (/(compra|custo|entrada)/.test(n)) return "purchasePrice";
  if (/(venda|preco|valor|saida)/.test(n)) return "salePrice";
  if (/(marca|fabricante|fornecedor)/.test(n)) return "brand";
  if (/modelo/.test(n)) return "model";
  if (/(sku|codigo|referencia|\bref\b|\bcod)/.test(n)) return "sku";
  if (/(categoria|grupo|linha|secao|departamento)/.test(n)) return "category";
  if (/(sistema|plano)/.test(n)) return "system";
  if (/(unidade|medida|\bun\b|\bund\b)/.test(n)) return "unit";
  if (/tipo/.test(n)) return "kind";
  if (/(nome|produto|item|descricao)/.test(n)) return "name";
  return "";
}

// Converte "1.234,56" ou "1234.56" em número.
function parseNumber(value: string): number {
  if (!value) return 0;
  let s = String(value).replace(/[^\d,.-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CatalogImport({ onClose, onDone }: { onClose: () => void; onDone: (result: ImportResult) => void }) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const onFile = async (file: File) => {
    setError("");
    try {
      const parsed = parseCsv(await file.text());
      if (!parsed.headers.length || !parsed.rows.length) {
        setError("Não consegui ler linhas neste arquivo. No AVA/Excel, exporte ou salve como CSV.");
        return;
      }
      const auto: Record<string, string> = {};
      for (const h of parsed.headers) {
        const f = guessField(h);
        if (f && !auto[f]) auto[f] = h;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMap(auto);
      setFileName(file.name);
    } catch {
      setError("Não foi possível abrir o arquivo.");
    }
  };

  const preview = useMemo(() => rows.slice(0, 5), [rows]);
  const value = (row: Row, field: string) => (map[field] ? row[map[field]] ?? "" : "");

  const run = async () => {
    if (!map.name) { setError("Escolha qual coluna corresponde ao Nome do item."); return; }
    setBusy(true);
    setError("");
    try {
      const items = rows
        .map((row) => {
          const kindRaw = value(row, "kind").toLowerCase();
          return {
            name: value(row, "name"),
            kind: /(serv|mao|mão|instal)/.test(kindRaw) ? "service" : "equipment",
            category: value(row, "category"),
            brand: value(row, "brand"),
            model: value(row, "model"),
            sku: value(row, "sku"),
            system: value(row, "system"),
            unit: value(row, "unit"),
            description: value(row, "description"),
            imageUrl: value(row, "imageUrl"),
            purchasePrice: parseNumber(value(row, "purchasePrice")),
            salePrice: parseNumber(value(row, "salePrice")),
          };
        })
        .filter((item) => item.name.trim());
      if (!items.length) { setError("Nenhuma linha com o nome preenchido."); setBusy(false); return; }
      // Envia em lotes: CSV com imagens embutidas (data URL) fica grande demais para um POST só.
      const BATCH = 20;
      const totals = { created: 0, updated: 0, skipped: 0 };
      for (let i = 0; i < items.length; i += BATCH) {
        const slice = items.slice(i, i + BATCH);
        setProgress(`${Math.min(i + slice.length, items.length)}/${items.length}`);
        const response = await fetch("/api/budget", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "importCatalog", items: slice }),
        });
        const data = (await response.json()) as ImportResult & { error?: string };
        if (!response.ok) throw new Error(data.error || "Não foi possível importar.");
        totals.created += data.created ?? 0;
        totals.updated += data.updated ?? 0;
        totals.skipped += data.skipped ?? 0;
      }
      setResult(totals);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const reset = () => { setRows([]); setHeaders([]); setMap({}); setFileName(""); };

  return (
    <div className="catalog-dialog-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <section className="catalog-dialog import-dialog" role="dialog" aria-modal="true" aria-label="Importar catálogo">
        <div className="catalog-dialog__head">
          <div>
            <span className="eyebrow">INTEGRAÇÃO · IMPORTAR DO AVA</span>
            <h3>Importar catálogo por planilha</h3>
            <p>Traga tudo pro catálogo de uma vez por planilha CSV — inclusive uma coluna com a <b>URL da imagem real</b> de cada produto. Itens com o mesmo código (SKU) são atualizados.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="catalog-dialog__body">
          {error && <div className="budget-error"><span>!</span>{error}<button onClick={() => setError("")}>×</button></div>}

          {result ? (
            <div className="import-done">
              <span>✓</span>
              <div>
                <strong>Importação concluída</strong>
                <p>{result.created} novos · {result.updated} atualizados{result.skipped ? ` · ${result.skipped} ignorados (sem nome)` : ""}.</p>
              </div>
            </div>
          ) : !rows.length ? (
            <label className="import-drop">
              <input type="file" accept=".csv,text/csv,.txt" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
              <span className="import-drop__icon">⇪</span>
              <strong>Selecione o arquivo CSV</strong>
              <small>Exportado do AVA (ou salvo como CSV pelo Excel). Aceita separador , ou ;</small>
            </label>
          ) : (
            <>
              <div className="import-file"><span>▤</span><b>{fileName}</b><small>{rows.length} linhas</small><button onClick={reset}>Trocar arquivo</button></div>
              <div className="import-map">
                <div className="import-map__head"><span>CAMPO DA PLATAFORMA</span><span>COLUNA DA PLANILHA</span></div>
                {FIELDS.map((field) => (
                  <label key={field.key} className="import-map__row">
                    <span>{field.label}{field.required ? " *" : ""}</span>
                    <select value={map[field.key] ?? ""} onChange={(e) => setMap((m) => ({ ...m, [field.key]: e.target.value }))}>
                      <option value="">— não importar —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div className="import-preview">
                <span className="eyebrow">PRÉVIA</span>
                <div className="import-preview__table">
                  <table>
                    <thead><tr><th>Nome</th><th>Marca / modelo</th><th>SKU</th><th>Compra</th><th>Venda</th></tr></thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i}>
                          <td>{value(row, "name") || <em>—</em>}</td>
                          <td>{[value(row, "brand"), value(row, "model")].filter(Boolean).join(" · ") || "—"}</td>
                          <td>{value(row, "sku") || "—"}</td>
                          <td>{value(row, "purchasePrice") ? brl(parseNumber(value(row, "purchasePrice"))) : "—"}</td>
                          <td>{value(row, "salePrice") ? brl(parseNumber(value(row, "salePrice"))) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="catalog-dialog__footer">
          {result ? (
            <button className="btn btn--dark" onClick={() => onDone(result)}>Concluir</button>
          ) : (
            <>
              <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
              <button className="btn btn--dark" onClick={() => void run()} disabled={busy || !rows.length}>{busy ? `Importando… ${progress}` : `Importar ${rows.length || ""} itens`}</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
