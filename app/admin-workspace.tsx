"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AvaBudgetWorkspace from "./budget-workspace";

export type ProposalItem = {
  id: number;
  category: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

export type Proposal = {
  code: string;
  client: string;
  project: string;
  address: string;
  plan: "SMARTLIFE" | "VETRA" | "SCENARIO";
  consultant: string;
  validity: string;
  deadline: string;
  payment: string;
  discount: number;
  overview: string;
  services: string;
  exclusions: string;
  notes: string;
  items: ProposalItem[];
};

export type ScopeTool = { id: string; code: string; label: string; color: string; category: string };
export type ScopeMarker = { id: number; type: string; label: string; environment: string; description: string; status: "previsto" | "revisar" | "aprovado"; x: number; y: number; size: number; range: number; apModel?: string; catalogItemId?: string; catalogName?: string };
export type PlanAsset = { id: number; name: string; src: string; x: number; y: number; width: number };
type ScopeCatalogItem = { id: string; name: string; category: string; brand: string; model: string; system: string };
export type ScopeReport = { project: string; address: string; planImage: string | null; markers: ScopeMarker[]; tools: ScopeTool[]; assets: PlanAsset[]; items: ProposalItem[] };

export type ProposalBundle = {
  proposal: Proposal;
  productImages: string[];
  itemImages: Record<number, string[]>;
  scopeReport: ScopeReport | null;
  documentMode: "automatic" | "manual";
};

type ProposalStatus = "draft" | "finalized" | "sent" | "accepted";
type SavedProposal = {
  id: string;
  code: string;
  client: string;
  project: string;
  status: ProposalStatus;
  data: ProposalBundle;
  manualHtml: string;
  publicToken: string | null;
  acceptedBy: string;
  acceptedAt: string | null;
  updatedBy: string;
  updatedAt: string;
};

const defaultScopeTools: ScopeTool[] = [
  { id: "light", code: "L", label: "Iluminação", color: "#4d8c79", category: "Iluminação" },
  { id: "circuit", code: "C", label: "Circuito / dimerização", color: "#d19a45", category: "Iluminação" },
  { id: "keypad", code: "INT", label: "Interruptor / keypad", color: "#3f6fa6", category: "Comandos" },
  { id: "curtain", code: "P", label: "Persiana / cortina", color: "#8c68bd", category: "Cortinas" },
  { id: "climate", code: "AR", label: "Ar-condicionado", color: "#3f9bbb", category: "Climatização" },
  { id: "audio", code: "AU", label: "Áudio ambiente", color: "#202725", category: "Audiovisual" },
  { id: "video", code: "TV", label: "TV / vídeo", color: "#c66055", category: "Audiovisual" },
  { id: "access-point", code: "AP", label: "Access point Wi-Fi", color: "#2879a8", category: "Redes Wi-Fi" },
  { id: "network", code: "D", label: "Ponto de dados", color: "#54788d", category: "Infraestrutura" },
  { id: "security", code: "S", label: "Sensor / segurança", color: "#a24c58", category: "Segurança" },
  { id: "camera", code: "CAM", label: "Câmera / CFTV", color: "#8c4552", category: "Segurança" },
  { id: "access", code: "FA", label: "Fechadura / acesso", color: "#715848", category: "Controle de acesso" },
  { id: "scene", code: "SC", label: "Cena de automação", color: "#728c3f", category: "Automação" },
  { id: "rack", code: "RK", label: "Rack técnico", color: "#4d5551", category: "Infraestrutura" },
  { id: "power", code: "PE", label: "Proteção de energia", color: "#bd7d35", category: "Proteção de energia" },
  { id: "voice", code: "AV", label: "Assistente de voz", color: "#5f74aa", category: "Interfaces" },
];

const scopeCatalogKeywords: Record<string, string[]> = {
  light: ["iluminação", "lâmpada", "led", "relé"], circuit: ["dimmer", "dimer", "circuito", "pwm", "iluminação"],
  keypad: ["interruptor", "keypad", "tecla", "interface"], curtain: ["cortina", "persiana", "motor"],
  climate: ["climatização", "ar-condicionado", "infravermelho", "ir"], audio: ["som", "áudio", "caixa", "amplificador", "multiroom"],
  video: ["vídeo", "tv", "receiver", "projetor", "cinema", "hdmi"], "access-point": ["access point", "unifi", "u6", "u7"],
  network: ["rede", "dados", "switch", "roteador", "cabeamento", "poe"], security: ["sensor", "alarme", "segurança", "fumaça", "vazamento"],
  camera: ["câmera", "camera", "cftv", "nvr"], access: ["fechadura", "acesso", "biometria", "interfone"],
  scene: ["automação", "central", "gateway", "cena"], rack: ["rack", "infraestrutura", "organização"],
  power: ["energia", "proteção", "condicionador", "nobreak", "surto"], voice: ["voz", "alexa", "google", "assistente", "painel"],
};

const normalizeText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type UbiquitiAP = { id: string; name: string; r24: number; r5: number; r6?: number };
// Raios de cobertura internos aproximados (metros) por faixa \u2014 refer\u00eancia para posicionamento.
const ubiquitiAPs: UbiquitiAP[] = [
  { id: "u6-lite", name: "UniFi U6 Lite", r24: 9, r5: 6 },
  { id: "u6-plus", name: "UniFi U6+", r24: 10, r5: 7 },
  { id: "u6-pro", name: "UniFi U6 Pro", r24: 12, r5: 9 },
  { id: "u6-lr", name: "UniFi U6 Long-Range", r24: 15, r5: 10 },
  { id: "u6-mesh", name: "UniFi U6 Mesh", r24: 11, r5: 8 },
  { id: "u6-iw", name: "UniFi U6 In-Wall", r24: 8, r5: 6 },
  { id: "u6-enterprise", name: "UniFi U6 Enterprise", r24: 12, r5: 9, r6: 8 },
  { id: "u7-pro", name: "UniFi U7 Pro", r24: 13, r5: 10, r6: 9 },
  { id: "u7-pro-max", name: "UniFi U7 Pro Max", r24: 14, r5: 11, r6: 10 },
  { id: "u7-pro-xg", name: "UniFi U7 Pro XG", r24: 13, r5: 10, r6: 9 },
  { id: "uap-ac-lite", name: "UniFi AC Lite", r24: 9, r5: 6 },
  { id: "uap-ac-pro", name: "UniFi AC Pro", r24: 12, r5: 8 },
  { id: "uap-ac-lr", name: "UniFi AC Long-Range", r24: 14, r5: 8 },
  { id: "uap-ac-mesh", name: "UniFi AC Mesh", r24: 11, r5: 7 },
  { id: "uap-flexhd", name: "UniFi FlexHD", r24: 10, r5: 8 },
];
function modelRadius(id: string, band: "2.4" | "5" | "6") {
  const m = ubiquitiAPs.find((a) => a.id === id) ?? ubiquitiAPs[2];
  return band === "2.4" ? m.r24 : band === "6" ? (m.r6 ?? m.r5) : m.r5;
}
// Camada de cobertura: combina os APs, respeita a escala e reduz o sinal ao atravessar paredes.
function WifiHeatLayer({ aps, planWidthMeters, walls, band }: {
  aps: ScopeMarker[];
  planWidthMeters: number;
  walls: Array<{ id: number; pts: Array<{ x: number; y: number }> }>;
  band: "2.4" | "5" | "6";
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const host = cv?.parentElement;
    if (!cv || !host) return;
    const draw = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * ratio);
      cv.height = Math.round(h * ratio);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (!aps.length) return;

      const scale = .34;
      const sw = Math.max(1, Math.round(w * scale));
      const sh = Math.max(1, Math.round(h * scale));
      const offscreen = document.createElement("canvas");
      offscreen.width = sw;
      offscreen.height = sh;
      const off = offscreen.getContext("2d");
      if (!off) return;
      const image = off.createImageData(sw, sh);
      const metersPerPixel = planWidthMeters / sw;
      const attenuation = band === "2.4" ? .13 : band === "6" ? .27 : .20;
      const segments = walls.flatMap((wall) => wall.pts.slice(1).map((point, index) => [wall.pts[index], point] as const));
      const intersects = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) => {
        const cross = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
        const d1 = cross(ax, ay, bx, by, cx, cy);
        const d2 = cross(ax, ay, bx, by, dx, dy);
        const d3 = cross(cx, cy, dx, dy, ax, ay);
        const d4 = cross(cx, cy, dx, dy, bx, by);
        return d1 * d2 < 0 && d3 * d4 < 0;
      };
      const palette = [
        { stop: .05, rgb: [205, 49, 61] },
        { stop: .23, rgb: [244, 125, 47] },
        { stop: .42, rgb: [250, 202, 57] },
        { stop: .62, rgb: [166, 220, 73] },
        { stop: .82, rgb: [63, 190, 90] },
        { stop: 1, rgb: [35, 161, 82] },
      ];
      const colorAt = (value: number) => {
        const upperIndex = Math.max(1, palette.findIndex((entry) => value <= entry.stop));
        const lower = palette[upperIndex - 1];
        const upper = palette[upperIndex] ?? palette[palette.length - 1];
        const amount = Math.max(0, Math.min(1, (value - lower.stop) / Math.max(.001, upper.stop - lower.stop)));
        return lower.rgb.map((channel, index) => Math.round(channel + (upper.rgb[index] - channel) * amount));
      };

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          let strongest = 0;
          for (const ap of aps) {
            const apx = ap.x / 100 * sw;
            const apy = ap.y / 100 * sh;
            const radius = Math.max(1, ap.range || modelRadius(ap.apModel ?? "u6-pro", band));
            const distance = Math.hypot(x - apx, y - apy) * metersPerPixel;
            let signal = Math.max(0, 1 - Math.pow(distance / radius, 1.34));
            if (signal > 0 && segments.length) {
              let crossed = 0;
              for (const [p1, p2] of segments) {
                if (intersects(apx, apy, x, y, p1.x / 100 * sw, p1.y / 100 * sh, p2.x / 100 * sw, p2.y / 100 * sh)) crossed++;
              }
              signal = Math.max(0, signal - crossed * attenuation);
            }
            strongest = Math.max(strongest, signal);
          }
          if (strongest < .045) continue;
          const [r, g, b] = colorAt(strongest);
          const offset = (y * sw + x) * 4;
          image.data[offset] = r;
          image.data[offset + 1] = g;
          image.data[offset + 2] = b;
          image.data[offset + 3] = Math.round(55 + strongest * 115);
        }
      }
      off.putImageData(image, 0, 0);
      ctx.save();
      ctx.scale(ratio, ratio);
      ctx.imageSmoothingEnabled = true;
      ctx.filter = "blur(4px)";
      ctx.drawImage(offscreen, -5, -5, w + 10, h + 10);
      ctx.restore();
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [aps, band, planWidthMeters, walls]);
  return <canvas ref={ref} className="wifi-heat-canvas" aria-hidden="true" />;
}

export const plans = {
  SMARTLIFE: {
    tier: "SmartLife",
    summary: "Automação conectada, intuitiva e preparada para iluminação, climatização, segurança, cenas e comandos por voz.",
    accent: "#6f8e89",
  },
  VETRA: {
    tier: "VETRA",
    summary: "Integração profissional de áudio, vídeo, multiroom, redes e proteção de energia em uma experiência única.",
    accent: "#667f78",
  },
  SCENARIO: {
    tier: "Scenario",
    summary: "Automação centralizada, personalizada e de alto padrão com a linha Scenario Embrace.",
    accent: "#82938d",
  },
} as const;

const initialProposal: Proposal = {
  code: "SNA-0826-014",
  client: "Cliente / Empreendimento",
  project: "Casa Conectada",
  address: "Goiânia — GO",
  plan: "SMARTLIFE",
  consultant: "Equipe Sona",
  validity: "10 dias",
  deadline: "45 dias após aprovação",
  payment: "40% na aprovação · 40% na instalação · 20% na entrega",
  discount: 0,
  overview:
    "A casa conectada é uma realidade que está ao seu alcance. Com a tecnologia é possível aumentar a segurança, o conforto e a economia nas residências e escritórios, melhorando a qualidade de vida de toda a família.",
  services:
    "Instalação e configuração dos sistemas descritos\nProgramação de cenas e rotinas personalizadas\nTreinamento e operação assistida\nTestes finais e entrega técnica",
  exclusions:
    "Passagem de cabos e intervenções civis\nMateriais de infraestrutura elétrica e de rede\nEquipamentos ou serviços não listados no escopo\nAdequações de quadros, eletrodutos ou marcenaria",
  notes:
    "Infraestrutura civil e elétrica deve estar disponível conforme o escopo técnico. Alterações solicitadas após a aprovação serão orçadas separadamente.",
  items: [
    { id: 1, category: "Automação", description: "Gateway Zigbee SmartLife", qty: 1, unit: "un", unitPrice: 0 },
    { id: 2, category: "Automação", description: "Módulo de iluminação MolSmart", qty: 3, unit: "un", unitPrice: 0 },
    { id: 3, category: "Home cinema", description: "Receiver Onkyo TX-NR5100", qty: 1, unit: "un", unitPrice: 0 },
    { id: 4, category: "Som ambiente", description: "Caixa de embutir ELAC IC-C81", qty: 6, unit: "un", unitPrice: 0 },
    { id: 5, category: "Redes Wi-Fi", description: "Access Point UniFi U6+", qty: 3, unit: "un", unitPrice: 0 },
  ],
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const proposalStatusLabel: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  finalized: "Finalizada",
  sent: "Enviada",
  accepted: "Aceita",
};

async function imageFileToDataUrl(file: File) {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (file.size <= 220_000 || file.type === "image/svg+xml") return raw;
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1500 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", .76));
    };
    image.onerror = () => resolve(raw);
    image.src = raw;
  });
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`} aria-label="Sona Automações">
      <span className="brand__mark" aria-hidden="true"><i>S</i><b /><i>N</i><i>A</i></span>
      {!compact && <span className="brand__text"><strong>SONA</strong><small>TECNOLOGIA &amp; AUTOMAÇÃO</small></span>}
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="nav-icon" aria-hidden="true">{children}</span>;
}

export default function Home() {
  const [section, setSection] = useState<"proposals" | "scope" | "budget">("proposals");
  const [proposal, setProposal] = useState<Proposal>(initialProposal);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>("draft");
  const [savedProposals, setSavedProposals] = useState<SavedProposal[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [manualHtml, setManualHtml] = useState("");
  const [wordMode, setWordMode] = useState(false);
  const [busy, setBusy] = useState<"saving" | "finalizing" | "sending" | null>(null);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [itemImages, setItemImages] = useState<Record<number, string[]>>({});
  const [scopeReport, setScopeReport] = useState<ScopeReport | null>(null);
  const manualEditorRef = useRef<HTMLElement>(null);
  const generatedPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/proposals", { cache: "no-store" }).then(async (response) => {
      const data = await response.json() as { proposals?: SavedProposal[] };
      if (response.ok) setSavedProposals(data.proposals ?? []);
    }).catch(() => undefined);
  }, []);

  const subtotal = useMemo(
    () => proposal.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [proposal.items],
  );
  const total = subtotal * (1 - Math.min(100, Math.max(0, proposal.discount)) / 100);

  const patchProposal = <K extends keyof Proposal>(key: K, value: Proposal[K]) => {
    setProposal((current) => ({ ...current, [key]: value }));
    setProposalStatus("draft");
  };

  const updateItem = (id: number, key: keyof ProposalItem, value: string | number) => {
    patchProposal("items", proposal.items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  };

  const addItem = () => {
    const id = Math.max(0, ...proposal.items.map((item) => item.id)) + 1;
    patchProposal("items", [...proposal.items, { id, category: "Automação", description: "Novo item do escopo", qty: 1, unit: "un", unitPrice: 0 }]);
  };

  const removeItem = (id: number) => {
    (itemImages[id] ?? []).forEach((src) => { if (src.startsWith("blob:")) URL.revokeObjectURL(src); });
    setItemImages((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    patchProposal("items", proposal.items.filter((item) => item.id !== id));
  };

  const addImagesToItem = async (itemId: number, files: FileList) => {
    const nextImages = await Promise.all(Array.from(files).slice(0, 4).map(imageFileToDataUrl));
    setItemImages((current) => ({
      ...current,
      [itemId]: [...(current[itemId] ?? []), ...nextImages].slice(0, 4),
    }));
    setProposalStatus("draft");
  };

  const removeItemImage = (itemId: number, imageIndex: number) => {
    setItemImages((current) => {
      const images = [...(current[itemId] ?? [])];
      const [removed] = images.splice(imageIndex, 1);
      if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);
      return { ...current, [itemId]: images };
    });
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const captureManualHtml = () => {
    const html = manualEditorRef.current?.innerHTML ?? manualHtml;
    setManualHtml(html);
    return html;
  };

  const proposalBundle = (): ProposalBundle => ({
    proposal, productImages, itemImages, scopeReport,
    documentMode: wordMode ? "manual" : "automatic",
  });

  const refreshProposals = async () => {
    const response = await fetch("/api/proposals", { cache: "no-store" });
    const data = await response.json() as { proposals?: SavedProposal[] };
    if (response.ok) setSavedProposals(data.proposals ?? []);
  };

  const saveDraft = async () => {
    setBusy("saving");
    try {
      const response = await fetch("/api/proposals", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "saveDraft", id: proposalId, code: proposal.code,
          client: proposal.client, project: proposal.project,
          data: proposalBundle(), manualHtml: wordMode ? captureManualHtml() : manualHtml,
        }),
      });
      const data = await response.json() as { proposal?: SavedProposal; error?: string };
      if (!response.ok || !data.proposal) throw new Error(data.error || "Não foi possível salvar.");
      setProposalId(data.proposal.id);
      setProposalStatus("draft");
      await refreshProposals();
      showNotice("Rascunho salvo para continuar depois");
      return data.proposal;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Não foi possível salvar o rascunho.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const newProposal = () => {
    const nextCode = `SNA-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 900) + 100)}`;
    productImages.forEach((src) => { if (src.startsWith("blob:")) URL.revokeObjectURL(src); });
    Object.values(itemImages).flat().forEach((src) => { if (src.startsWith("blob:")) URL.revokeObjectURL(src); });
    setProductImages([]);
    setItemImages({});
    setProposal({ ...initialProposal, code: nextCode, client: "Novo cliente", project: "Novo projeto", items: [] });
    setProposalId(null);
    setProposalStatus("draft");
    setManualHtml("");
    setWordMode(false);
    setSection("proposals");
  };

  const openSavedProposal = (record: SavedProposal) => {
    const bundle = record.data;
    setProposal(bundle?.proposal ?? initialProposal);
    setProductImages(bundle?.productImages ?? []);
    setItemImages(bundle?.itemImages ?? {});
    setScopeReport(bundle?.scopeReport ?? null);
    setProposalId(record.id);
    setProposalStatus(record.status);
    setManualHtml(record.manualHtml ?? "");
    setWordMode(bundle?.documentMode === "manual" && Boolean(record.manualHtml));
    setHistoryOpen(false);
    setSection("proposals");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finalizeProposal = async () => {
    setBusy("finalizing");
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const response = await fetch("/api/proposals", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "finalize", id: saved.id }),
      });
      const data = await response.json() as { proposal?: SavedProposal; error?: string };
      if (!response.ok || !data.proposal) throw new Error(data.error || "Não foi possível finalizar.");
      setProposalId(data.proposal.id);
      setProposalStatus("finalized");
      await refreshProposals();
      showNotice("Proposta finalizada e link do cliente gerado");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Não foi possível finalizar a proposta.");
    } finally {
      setBusy(null);
    }
  };

  const shareProposal = async () => {
    const record = savedProposals.find((entry) => entry.id === proposalId);
    if (!record?.publicToken) return;
    const url = `${window.location.origin}/proposta?token=${record.publicToken}`;
    setBusy("sending");
    try {
      if (navigator.share) await navigator.share({ title: `Proposta ${proposal.code}`, text: `Proposta SONA para ${proposal.client}`, url });
      else await navigator.clipboard.writeText(url);
      await fetch("/api/proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "markSent", id: proposalId }) });
      setProposalStatus("sent");
      await refreshProposals();
      showNotice(navigator.share ? "Proposta preparada para envio" : "Link do cliente copiado");
      setConfirmOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showNotice("Não foi possível compartilhar o link.");
    } finally {
      setBusy(null);
    }
  };

  const startWordMode = () => {
    const generated = generatedPreviewRef.current?.querySelector("#proposal-print")?.innerHTML;
    if (!manualHtml && generated) setManualHtml(generated);
    setWordMode(true);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(proposal, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${proposal.code.toLowerCase()}-${proposal.client.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sectionMeta = section === "proposals"
    ? { kicker: "PROPOSTAS", title: "Nova proposta comercial" }
    : section === "scope"
      ? { kicker: "PLANEJAMENTO", title: "Escopo técnico" }
      : { kicker: "GESTÃO COMERCIAL", title: "Orçamento" };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar--open" : ""}`}>
        <div className="sidebar__top">
          <Logo />
          <button className="sidebar-close" onClick={() => setMobileMenu(false)} aria-label="Fechar menu">×</button>
        </div>

        <nav className="nav" aria-label="Navegação principal">
          <p className="nav-label">ESTÚDIO COMERCIAL</p>
          <button className={section === "proposals" ? "active" : ""} onClick={() => { setSection("proposals"); setMobileMenu(false); }}>
            <Icon>▤</Icon><span>Propostas</span><em>{savedProposals.length}</em>
          </button>
          <button className={section === "scope" ? "active" : ""} onClick={() => { setSection("scope"); setMobileMenu(false); }}>
            <Icon>⌗</Icon><span>Escopo técnico</span>
          </button>
          <button className={section === "budget" ? "active" : ""} onClick={() => { setSection("budget"); setMobileMenu(false); }}>
            <Icon>R$</Icon><span>Orçamento</span><em>Novo</em>
          </button>
          <button disabled><Icon>□</Icon><span>Modelos</span><small>em breve</small></button>

          <p className="nav-label nav-label--second">GESTÃO</p>
          <button disabled><Icon>◎</Icon><span>Clientes</span></button>
          <button disabled><Icon>↗</Icon><span>Relatórios</span></button>
        </nav>

        <div className="sidebar__footer">
          <div className="location-dot" />
          <div><strong>Sona Goiânia</strong><small>Metropolitan Mall</small></div>
        </div>
      </aside>

      {mobileMenu && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenu(false)} />}

      <main className="workspace">
        <header className="topbar">
          <div className="topbar__title">
            <button className="menu-button" onClick={() => setMobileMenu(true)} aria-label="Abrir menu">☰</button>
            <div>
              <span>{sectionMeta.kicker}</span>
              <h1>{sectionMeta.title}</h1>
            </div>
          </div>
          <div className="topbar__actions">
            {section === "budget"
              ? <span className="shared-status"><i /> Base compartilhada</span>
              : section === "proposals" ? <>
                <button className="btn btn--ghost" onClick={() => setHistoryOpen(true)}>◷ <span>Propostas salvas</span></button>
                <button className="btn btn--ghost" onClick={() => void saveDraft()} disabled={busy !== null}>{busy === "saving" ? "Salvando…" : "✓ Salvar rascunho"}</button>
                <button className="btn btn--green" onClick={() => setConfirmOpen(true)} disabled={busy !== null}>Finalizar e enviar</button>
              </> : <button className="btn btn--ghost" onClick={() => void saveDraft()}>✓ <span>Salvar rascunho</span></button>}
            <button className="btn btn--dark" onClick={newProposal}>＋ <span>Nova proposta</span></button>
          </div>
        </header>

        {section === "proposals" ? (
          <ProposalBuilder
            proposal={proposal}
            patchProposal={patchProposal}
            updateItem={updateItem}
            addItem={addItem}
            removeItem={removeItem}
            subtotal={subtotal}
            total={total}
            productImages={productImages}
            itemImages={itemImages}
            scopeReport={scopeReport}
            onImages={async (files) => {
              const images = await Promise.all(Array.from(files).slice(0, 8).map(imageFileToDataUrl));
              setProductImages(images);
              setProposalStatus("draft");
            }}
            onRemoveCoverImage={(imageIndex) => {
              setProductImages((current) => {
                const images = [...current];
                const [removed] = images.splice(imageIndex, 1);
                if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);
                return images;
              });
            }}
            onItemImages={addImagesToItem}
            onRemoveItemImage={removeItemImage}
            onPrint={() => window.print()}
            onExport={exportData}
            wordMode={wordMode}
            manualHtml={manualHtml}
            manualEditorRef={manualEditorRef}
            generatedPreviewRef={generatedPreviewRef}
            onStartWordMode={startWordMode}
            onAutomaticMode={() => { captureManualHtml(); setWordMode(false); }}
            status={proposalStatus}
          />
        ) : section === "scope" ? (
          <ScopeEditor onGenerate={(report) => {
            Object.values(itemImages).flat().forEach((src) => { if (src.startsWith("blob:")) URL.revokeObjectURL(src); });
            setItemImages({});
            patchProposal("items", report.items);
            patchProposal("project", report.project);
            patchProposal("address", report.address);
            setScopeReport(report);
            setSection("proposals");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} />
        ) : (
          <AvaBudgetWorkspace onUseInProposal={({ items, discountPercent }) => {
            Object.values(itemImages).flat().forEach((src) => { if (src.startsWith("blob:")) URL.revokeObjectURL(src); });
            setItemImages({});
            patchProposal("items", items);
            patchProposal("discount", discountPercent);
            setSection("proposals");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} />
        )}
      </main>

      {historyOpen && <ProposalHistory records={savedProposals} onClose={() => setHistoryOpen(false)} onOpen={openSavedProposal} />}
      {confirmOpen && <FinalizeDialog
        proposal={proposal}
        total={total}
        status={proposalStatus}
        record={savedProposals.find((entry) => entry.id === proposalId) ?? null}
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onFinalize={() => void finalizeProposal()}
        onShare={() => void shareProposal()}
      />}
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
    </div>
  );
}

function ProposalHistory({ records, onClose, onOpen }: { records: SavedProposal[]; onClose: () => void; onOpen: (record: SavedProposal) => void }) {
  return <div className="catalog-dialog-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="catalog-dialog proposal-history" role="dialog" aria-modal="true" aria-label="Propostas salvas">
      <div className="catalog-dialog__head"><div><span className="eyebrow">CONTINUIDADE DO TRABALHO</span><h3>Propostas salvas</h3><p>Abra qualquer rascunho ou acompanhe o aceite do cliente.</p></div><button onClick={onClose} aria-label="Fechar">×</button></div>
      <div className="proposal-history__body">
        {records.map((record) => <button className="proposal-history__row" key={record.id} onClick={() => onOpen(record)}>
          <span className={`proposal-history__icon proposal-history__icon--${record.status}`}>{record.status === "accepted" ? "✓" : "▤"}</span>
          <span><strong>{record.client}</strong><small>{record.code} · {record.project}</small></span>
          <span className={`proposal-state proposal-state--${record.status}`}>{proposalStatusLabel[record.status]}</span>
          <time>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(record.updatedAt))}</time>
          <b>Abrir →</b>
        </button>)}
        {!records.length && <div className="proposal-history__empty"><span>▤</span><strong>Nenhuma proposta salva</strong><p>Use “Salvar rascunho” para continuar o trabalho em outro momento.</p></div>}
      </div>
    </section>
  </div>;
}

function FinalizeDialog({ proposal, total, status, record, busy, onClose, onFinalize, onShare }: {
  proposal: Proposal;
  total: number;
  status: ProposalStatus;
  record: SavedProposal | null;
  busy: "saving" | "finalizing" | "sending" | null;
  onClose: () => void;
  onFinalize: () => void;
  onShare: () => void;
}) {
  const readyToShare = Boolean(record?.publicToken) && status !== "draft";
  const link = readyToShare && typeof window !== "undefined" ? `${window.location.origin}/proposta?token=${record?.publicToken}` : "";
  const copyLink = async () => {
    if (link) await navigator.clipboard.writeText(link);
  };
  return <div className="catalog-dialog-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="catalog-dialog finalize-dialog" role="dialog" aria-modal="true" aria-label="Finalizar e enviar proposta">
      <div className="catalog-dialog__head"><div><span className="eyebrow">FLUXO DE APROVAÇÃO</span><h3>{readyToShare ? "Proposta pronta para o cliente" : "Confirmar finalização"}</h3><p>{readyToShare ? "O arquivo online inclui o botão de aceite e registra a confirmação." : "Revise o resumo antes de gerar a versão do cliente."}</p></div><button onClick={onClose} aria-label="Fechar">×</button></div>
      <div className="finalize-dialog__body">
        <div className="finalize-summary"><div><small>CLIENTE</small><strong>{proposal.client}</strong><span>{proposal.project}</span></div><div><small>PROPOSTA</small><strong>{proposal.code}</strong><span>{proposal.items.length} itens</span></div><div><small>INVESTIMENTO</small><strong>{brl.format(total)}</strong><span>validade: {proposal.validity}</span></div></div>
        {!readyToShare ? <>
          <div className="finalize-checklist"><div><span>✓</span><p><strong>Automação preservada</strong><small>O rascunho, orçamento e escopo continuam disponíveis para futuras revisões.</small></p></div><div><span>✓</span><p><strong>Versão individual do cliente</strong><small>Será gerado um endereço exclusivo com a proposta final.</small></p></div><div><span>✓</span><p><strong>Aceite registrado</strong><small>Nome, e-mail, CPF/CNPJ, data e horário ficarão vinculados à proposta.</small></p></div></div>
          <label className="finalize-confirm"><input type="checkbox" defaultChecked /> <span>Confirmo que os dados e valores da proposta foram revisados.</span></label>
        </> : <>
          <div className="client-link"><span>LINK INDIVIDUAL DO CLIENTE</span><div><input readOnly value={link} /><button onClick={() => void copyLink()}>Copiar</button></div></div>
          <div className="acceptance-preview"><span>✓</span><div><strong>Aceitar proposta</strong><p>O cliente verá este botão após conferir todas as páginas e poderá confirmar digitalmente.</p></div></div>
        </>}
      </div>
      <div className="catalog-dialog__footer"><button className="btn btn--ghost" onClick={onClose}>Voltar</button>{readyToShare ? <button className="btn btn--green" onClick={onShare} disabled={busy !== null}>{busy === "sending" ? "Preparando…" : "Enviar ao cliente"}</button> : <button className="btn btn--green" onClick={onFinalize} disabled={busy !== null}>{busy ? "Finalizando…" : "Confirmar e gerar link"}</button>}</div>
    </section>
  </div>;
}

function ProposalBuilder({
  proposal,
  patchProposal,
  updateItem,
  addItem,
  removeItem,
  subtotal,
  total,
  productImages,
  itemImages,
  scopeReport,
  onImages,
  onRemoveCoverImage,
  onItemImages,
  onRemoveItemImage,
  onPrint,
  onExport,
  wordMode,
  manualHtml,
  manualEditorRef,
  generatedPreviewRef,
  onStartWordMode,
  onAutomaticMode,
  status,
}: {
  proposal: Proposal;
  patchProposal: <K extends keyof Proposal>(key: K, value: Proposal[K]) => void;
  updateItem: (id: number, key: keyof ProposalItem, value: string | number) => void;
  addItem: () => void;
  removeItem: (id: number) => void;
  subtotal: number;
  total: number;
  productImages: string[];
  itemImages: Record<number, string[]>;
  scopeReport: ScopeReport | null;
  onImages: (files: FileList) => void | Promise<void>;
  onRemoveCoverImage: (imageIndex: number) => void;
  onItemImages: (itemId: number, files: FileList) => void | Promise<void>;
  onRemoveItemImage: (itemId: number, imageIndex: number) => void;
  onPrint: () => void;
  onExport: () => void;
  wordMode: boolean;
  manualHtml: string;
  manualEditorRef: React.RefObject<HTMLElement | null>;
  generatedPreviewRef: React.RefObject<HTMLDivElement | null>;
  onStartWordMode: () => void;
  onAutomaticMode: () => void;
  status: ProposalStatus;
}) {
  return (
    <div className="builder-layout">
      <section className={`editor-panel ${wordMode ? "editor-panel--word" : ""}`}>
        <div className="editor-intro">
          <div><span className="eyebrow">EDITOR INTELIGENTE · {proposalStatusLabel[status].toLocaleUpperCase("pt-BR")}</span><h2>Configure. Revise. Entregue.</h2></div>
          <div className="progress-ring" aria-label="Proposta 75% preenchida"><b>75</b><small>%</small></div>
        </div>

        {wordMode && <div className="word-mode-note"><span>W</span><div><strong>Edição livre ativa</strong><p>Você está ajustando diretamente o documento. Os dados automáticos continuam preservados e podem ser retomados a qualquer momento.</p></div></div>}

        <div className="form-card">
          <div className="form-card__head"><span>01</span><div><h3>Cliente e projeto</h3><p>Informações que aparecem na capa da proposta.</p></div></div>
          <div className="form-grid">
            <label className="field field--full">Cliente / empreendimento<input value={proposal.client} onChange={(e) => patchProposal("client", e.target.value)} /></label>
            <label className="field">Nome do projeto<input value={proposal.project} onChange={(e) => patchProposal("project", e.target.value)} /></label>
            <label className="field">Endereço<input value={proposal.address} onChange={(e) => patchProposal("address", e.target.value)} /></label>
            <label className="field">Responsável comercial<input value={proposal.consultant} onChange={(e) => patchProposal("consultant", e.target.value)} /></label>
            <label className="field">Código da proposta<input value={proposal.code} onChange={(e) => patchProposal("code", e.target.value)} /></label>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card__head"><span>02</span><div><h3>Sistema de automação</h3><p>Escolha a linha ideal para o perfil do projeto.</p></div></div>
          <div className="plan-selector">
            {(Object.keys(plans) as Array<keyof typeof plans>).map((plan) => (
              <button key={plan} className={proposal.plan === plan ? "selected" : ""} onClick={() => patchProposal("plan", plan)}>
                <i style={{ background: plans[plan].accent }} /><strong>{plan}</strong><small>{plans[plan].tier}</small><span>{proposal.plan === plan ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-card form-card--items">
          <div className="form-card__head"><span>03</span><div><h3>Itens do escopo</h3><p>Quantidades e valores são calculados automaticamente.</p></div><button className="mini-add" onClick={addItem}>＋ Adicionar</button></div>
          <div className="items-table-wrap">
            <table className="items-table">
              <thead><tr><th>Categoria</th><th>Descrição técnica</th><th>Imagem</th><th>Qtd.</th><th>Un.</th><th>Valor unitário</th><th>Total</th><th /></tr></thead>
              <tbody>
                {proposal.items.map((item) => (
                  <tr key={item.id}>
                    <td><input value={item.category} onChange={(e) => updateItem(item.id, "category", e.target.value)} aria-label="Categoria" /></td>
                    <td><input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} aria-label="Descrição" /></td>
                    <td className="item-image-cell">
                      <label className="item-image-upload" title="Adicionar imagem deste item">
                        <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && onItemImages(item.id, e.target.files)} />
                        <span>{(itemImages[item.id] ?? []).length > 0 ? "＋ Imagem" : "＋ Adicionar"}</span>
                      </label>
                      {(itemImages[item.id] ?? []).length > 0 && <div className="item-image-thumbs">{itemImages[item.id].map((src, imageIndex) => <span key={src}><img src={src} alt={`Imagem de ${item.description}`} /><button type="button" onClick={() => onRemoveItemImage(item.id, imageIndex)} aria-label={`Remover imagem ${imageIndex + 1} de ${item.description}`}>×</button></span>)}</div>}
                    </td>
                    <td><input type="number" min="0" value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))} aria-label="Quantidade" /></td>
                    <td><input value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} aria-label="Unidade" /></td>
                    <td><input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} aria-label="Valor unitário" /></td>
                    <td><strong>{brl.format(item.qty * item.unitPrice)}</strong></td>
                    <td><button className="remove" onClick={() => removeItem(item.id)} aria-label={`Remover ${item.description}`}>×</button></td>
                  </tr>
                ))}
                {proposal.items.length === 0 && <tr><td colSpan={8}><button className="empty-items" onClick={addItem}>＋ Adicione o primeiro item do escopo</button></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="summary-row">
            <label className="discount">Desconto<input type="number" min="0" max="100" value={proposal.discount} onChange={(e) => patchProposal("discount", Number(e.target.value))} /><span>%</span></label>
            <div><small>Subtotal</small><b>{brl.format(subtotal)}</b></div>
            <div className="summary-total"><small>Investimento final</small><b>{brl.format(total)}</b></div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card__head"><span>04</span><div><h3>Conteúdo e imagens</h3><p>Texto técnico, registros visuais e responsabilidades.</p></div></div>
          <div className="form-grid">
            <label className="field field--full">Apresentação da solução<textarea rows={4} value={proposal.overview} onChange={(e) => patchProposal("overview", e.target.value)} /></label>
            <label className="field">Serviços incluídos <small>um por linha</small><textarea rows={5} value={proposal.services} onChange={(e) => patchProposal("services", e.target.value)} /></label>
            <label className="field">Exclusões <small>uma por linha</small><textarea rows={5} value={proposal.exclusions} onChange={(e) => patchProposal("exclusions", e.target.value)} /></label>
            <label className="media-upload field--full">
              <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && onImages(e.target.files)} />
              <span>＋</span><div><strong>Adicionar imagens de abertura</strong><small>PNG ou JPG · opcionais · aparecem na apresentação inicial</small></div>
              {productImages.length > 0 && <em>{productImages.length} adicionada{productImages.length > 1 ? "s" : ""}</em>}
            </label>
            {productImages.length > 0 && <div className="cover-image-thumbs field--full">{productImages.map((src, imageIndex) => <span key={src}><img src={src} alt={`Imagem de abertura ${imageIndex + 1}`} /><button type="button" onClick={() => onRemoveCoverImage(imageIndex)} aria-label={`Remover imagem de abertura ${imageIndex + 1}`}>×</button></span>)}</div>}
          </div>
        </div>

        <div className="form-card">
          <div className="form-card__head"><span>05</span><div><h3>Condições comerciais</h3><p>Prazo, pagamento e observações finais.</p></div></div>
          <div className="form-grid">
            <label className="field">Validade<input value={proposal.validity} onChange={(e) => patchProposal("validity", e.target.value)} /></label>
            <label className="field">Prazo de execução<input value={proposal.deadline} onChange={(e) => patchProposal("deadline", e.target.value)} /></label>
            <label className="field field--full">Condição de pagamento<input value={proposal.payment} onChange={(e) => patchProposal("payment", e.target.value)} /></label>
            <label className="field field--full">Observações<textarea rows={3} value={proposal.notes} onChange={(e) => patchProposal("notes", e.target.value)} /></label>
          </div>
        </div>
      </section>

      <aside className="preview-panel">
        <div className="preview-toolbar">
          <div className="document-mode-tabs"><button className={!wordMode ? "active" : ""} onClick={onAutomaticMode}><span className="live-dot" /> AUTOMÁTICO</button><button className={wordMode ? "active" : ""} onClick={onStartWordMode}>W&nbsp; EDITAR DOCUMENTO</button></div>
          <div><span className={`proposal-state proposal-state--${status}`}>{proposalStatusLabel[status]}</span><button onClick={onExport} title="Baixar dados">⇩</button><button onClick={onPrint} className="toolbar-primary">Gerar PDF</button></div>
        </div>
        {wordMode && <WordToolbar editorRef={manualEditorRef} />}
        {wordMode ? <article
          ref={manualEditorRef}
          className="proposal-document proposal-document--editable"
          id="proposal-print"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onClick={(event) => {
            manualEditorRef.current?.querySelectorAll("[data-word-selected]").forEach((node) => node.removeAttribute("data-word-selected"));
            if (event.target instanceof HTMLImageElement) event.target.setAttribute("data-word-selected", "true");
          }}
          onPaste={(event) => {
            event.preventDefault();
            document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          }}
          dangerouslySetInnerHTML={{ __html: manualHtml }}
        /> : <div ref={generatedPreviewRef}><ProposalSheet proposal={proposal} subtotal={subtotal} total={total} productImages={productImages} itemImages={itemImages} scopeReport={scopeReport} /></div>}
      </aside>
    </div>
  );
}

function WordToolbar({ editorRef }: { editorRef: React.RefObject<HTMLElement | null> }) {
  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
  };
  const resizeImage = (delta: number) => {
    const image = editorRef.current?.querySelector<HTMLImageElement>("img[data-word-selected]");
    if (!image) return;
    const current = Number.parseFloat(image.style.width) || 100;
    image.style.width = `${Math.min(100, Math.max(20, current + delta))}%`;
    image.style.height = "auto";
  };
  return <div className="word-toolbar" role="toolbar" aria-label="Ferramentas de edição do documento" onMouseDown={(event) => event.preventDefault()}>
    <div className="word-toolbar__brand"><b>W</b><span>Documento</span></div>
    <select aria-label="Estilo do texto" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)} onMouseDown={(event) => event.stopPropagation()}><option value="p">Texto normal</option><option value="h2">Título</option><option value="h3">Subtítulo</option></select>
    <div className="word-toolbar__group"><button onClick={() => command("undo")} title="Desfazer">↶</button><button onClick={() => command("redo")} title="Refazer">↷</button></div>
    <div className="word-toolbar__group"><button onClick={() => command("bold")} title="Negrito"><b>B</b></button><button onClick={() => command("italic")} title="Itálico"><i>I</i></button><button onClick={() => command("underline")} title="Sublinhado"><u>U</u></button></div>
    <div className="word-toolbar__group"><button onClick={() => command("justifyLeft")} title="Alinhar à esquerda">≡</button><button onClick={() => command("justifyCenter")} title="Centralizar">≣</button><button onClick={() => command("justifyRight")} title="Alinhar à direita">≡</button></div>
    <div className="word-toolbar__group"><button onClick={() => command("insertUnorderedList")} title="Lista">•☰</button><button onClick={() => command("insertOrderedList")} title="Lista numerada">1☰</button></div>
    <div className="word-toolbar__group word-toolbar__images"><button onClick={() => resizeImage(-10)} title="Diminuir imagem">Imagem −</button><button onClick={() => resizeImage(10)} title="Aumentar imagem">Imagem +</button></div>
    <span className="word-toolbar__hint">Selecione texto para formatar · clique numa imagem antes de redimensionar</span>
  </div>;
}

function proposalSectionFor(category: string) {
  const value = category.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/home cinema|audiovisual|audio e video|tv|video/.test(value)) return "Home Cinema e Áudio & Vídeo";
  if (/som ambiente|sonorizacao|multiroom|audio/.test(value)) return "Sonorização Ambiente";
  if (/rede|wi-fi|wifi|dados|cabeamento|infraestrutura/.test(value)) return "Sistema de Redes Wi-Fi";
  if (/seguranca|fechadura|acesso|camera|sensor/.test(value)) return "Segurança Inteligente";
  if (/energia|condicionador|protecao/.test(value)) return "Proteção de Energia";
  if (/servico|instalacao|configuracao|programacao|projeto/.test(value)) return "Serviços Especializados";
  return "Automação Residencial";
}

function proposalSectionCopy(title: string) {
  const copy: Record<string, string> = {
    "Automação Residencial": "A solução integra iluminação, cortinas, climatização, comandos e cenas em uma única experiência. O processamento local e a compatibilidade com diferentes protocolos entregam velocidade, confiabilidade e privacidade.",
    "Home Cinema e Áudio & Vídeo": "Para uma experiência audiovisual imersiva, propomos um conjunto dimensionado para o ambiente, com eletrônica, caixas acústicas, cabeamento e proteção compatíveis entre si.",
    "Sonorização Ambiente": "O sistema de sonorização distribui música com qualidade e controle independente, respeitando a arquitetura, o uso de cada ambiente e a expansão futura.",
    "Sistema de Redes Wi-Fi": "A infraestrutura de rede foi dimensionada para cobertura estável, alto desempenho e conexão confiável dos equipamentos de automação, entretenimento e uso pessoal.",
    "Segurança Inteligente": "A solução de segurança conecta acessos, sensores e monitoramento ao ecossistema da residência, ampliando controle, rastreabilidade e tranquilidade.",
    "Proteção de Energia": "Os equipamentos de proteção e condicionamento preservam a instalação e os dispositivos eletrônicos contra oscilações e distúrbios da rede elétrica.",
    "Serviços Especializados": "A SONA realiza projeto, instalação, programação, testes, treinamento e entrega assistida para garantir que toda a solução funcione de forma integrada.",
  };
  return copy[title] ?? "Solução dimensionada pela SONA para atender às necessidades técnicas e de uso deste projeto.";
}

export function ProposalSheet({ proposal, subtotal, total, productImages, itemImages, scopeReport }: { proposal: Proposal; subtotal: number; total: number; productImages: string[]; itemImages: Record<number, string[]>; scopeReport: ScopeReport | null }) {
  const plan = plans[proposal.plan];
  const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
  const categoryTotals = Object.entries(proposal.items.reduce<Record<string, number>>((groups, item) => {
    groups[item.category] = (groups[item.category] ?? 0) + item.qty * item.unitPrice;
    return groups;
  }, {}));
  const solutionGroups = Object.entries(proposal.items.reduce<Record<string, ProposalItem[]>>((groups, item) => {
    const section = proposalSectionFor(item.category);
    groups[section] = [...(groups[section] ?? []), item];
    return groups;
  }, {}));
  const allItemImages = proposal.items.flatMap((item) => itemImages[item.id] ?? []);
  const coverImages = productImages.length > 0 ? productImages : allItemImages;
  const solutionPages = solutionGroups.flatMap(([title, items]) => {
    const hasImages = items.some((item) => (itemImages[item.id] ?? []).length > 0);
    const itemsPerPage = hasImages ? 6 : 10;
    return Array.from({ length: Math.ceil(items.length / itemsPerPage) }, (_, pageIndex) => ({
      title,
      items: items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage),
      pageIndex,
      pageCount: Math.ceil(items.length / itemsPerPage),
    }));
  });
  const detailsPage = 2 + solutionPages.length + (scopeReport ? 1 : 0);
  const contactPage = detailsPage + 1;
  return (
    <article className="proposal-document" id="proposal-print">
      <section className="proposal-page proposal-page--main">
        <DottedFrame />
        <div className="proposal-cover-heading">
          <span>SONA · TECNOLOGIA &amp; AUTOMAÇÃO</span>
          <div className="word-title"><strong>PROPOSTA<br />CASA CONECTADA</strong><b>{proposal.client.toLocaleUpperCase("pt-BR")}</b></div>
          <div className="proposal-cover-meta"><span>{proposal.project}</span><i /><span>{proposal.address}</span></div>
        </div>
        <div className="classic-block">
          <h2>Casa Conectada</h2>
          <p>{proposal.overview}</p>
        </div>
        <div className="classic-block classic-block--system">
          <h2>Automação SONA · {plan.tier}</h2>
          <p>O sistema proposto integra os ambientes de forma simples, segura e confiável. {plan.summary} A solução será configurada de acordo com o projeto <strong>{proposal.project}</strong>, respeitando as necessidades e a rotina do cliente.</p>
        </div>
        {coverImages.length > 0 && <div className={`product-gallery product-gallery--cover product-gallery--${Math.min(4, coverImages.length)}`}>{coverImages.slice(0, 3).map((src, index) => <img key={src} src={src} alt={`Equipamento ${index + 1}`} />)}</div>}
        <PageFooter number="1" />
      </section>

      {solutionPages.map(({ title, items, pageIndex, pageCount }, index) => {
        const hasSectionImages = items.some((item) => (itemImages[item.id] ?? []).length > 0);
        return <section className="proposal-page proposal-page--solution" key={`${title}-${pageIndex}`}>
          <DottedFrame />
          <div className="solution-heading"><h2>{title.toLocaleUpperCase("pt-BR")}{pageIndex > 0 ? " — CONTINUAÇÃO" : ""}</h2><p>{pageIndex === 0 ? proposalSectionCopy(title) : `Continuação dos itens desta solução · página ${pageIndex + 1} de ${pageCount}.`}</p></div>
          <table className={`classic-table classic-table--solution ${hasSectionImages ? "classic-table--with-images" : ""}`}>
            <thead><tr>{hasSectionImages && <th aria-label="Imagem" />}<th>Item</th><th>Quantidade</th></tr></thead>
            <tbody>{items.map((item) => <tr key={item.id}>
              {hasSectionImages && <td className="solution-item-image">{(itemImages[item.id] ?? []).length > 0
                ? <div>{(itemImages[item.id] ?? []).slice(0, 2).map((src, imageIndex) => <img key={src} src={src} alt={`${item.description} — imagem ${imageIndex + 1}`} />)}</div>
                : <span>SEM IMAGEM</span>}</td>}
              <td><strong>{item.description}</strong><span>{item.category}</span></td><td>{String(item.qty).padStart(2, "0")}</td>
            </tr>)}</tbody>
          </table>
          <p className="solution-caption">Seleção dimensionada pela SONA para este projeto. As imagens são ilustrativas e correspondem aos itens cadastrados na proposta.</p>
          <PageFooter number={String(index + 2)} />
        </section>;
      })}

      {scopeReport && <section className="proposal-page proposal-page--location">
        <DottedFrame />
        <div className="solution-heading"><h2>LOCAÇÃO ESTIMADA — {scopeReport.project.toLocaleUpperCase("pt-BR")}</h2><p>{scopeReport.address}</p></div>
        <div className="proposal-location-plan"><div className="report-plan__canvas">{scopeReport.planImage ? <img src={scopeReport.planImage} alt={`Planta do projeto ${scopeReport.project}`} /> : <DefaultFloorPlan />}{scopeReport.assets.map((asset) => <img className="report-plan__asset" key={asset.id} src={asset.src} alt={asset.name} style={{ left: `${asset.x}%`, top: `${asset.y}%`, width: `${asset.width}%` }} />)}{scopeReport.markers.map((item) => { const tool = scopeReport.tools.find((entry) => entry.id === item.type) ?? scopeReport.tools[0]; return <span key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size, background: tool?.color ?? "#638c7e" }}>{item.label}</span>; })}</div></div>
        <div className="report-legend">{scopeReport.tools.map((tool) => { const qty = scopeReport.markers.filter((item) => item.type === tool.id).length; return qty > 0 ? <div key={tool.id}><i style={{ background: tool.color }}>{tool.code}</i><span>{tool.label}</span><b>{qty}</b></div> : null; })}</div>
        <PageFooter number={String(2 + solutionPages.length)} />
      </section>}

      <section className="proposal-page proposal-page--details">
        <DottedFrame />
        <div className="classic-section"><h2>Material</h2><ul>{proposal.items.map((item) => <li key={item.id}>{item.description} — {item.qty} {item.unit}.</li>)}</ul></div>
        <div className="classic-section"><h2>Serviços</h2><ul>{proposal.services.split("\n").filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="classic-section"><h2>Exclusões</h2><ul>{proposal.exclusions.split("\n").filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="classic-section classic-section--notes"><h2>Observações</h2><p>{proposal.notes}</p></div>
        <PageFooter number={String(detailsPage)} />
      </section>

      <section className="proposal-page proposal-page--contact">
        <DottedFrame />
        <div className="investment-card">
          <h2>Valor Total do Investimento</h2>
          <div className="investment-lines">
            {categoryTotals.map(([category, value]) => <div key={category}><span>{category}</span><i /><strong>{brl.format(value)}</strong></div>)}
          </div>
          <div className="investment-total"><span>{proposal.discount > 0 ? "TOTAL COM DESCONTO" : "TOTAL DO INVESTIMENTO"}</span><i /><strong>{brl.format(total)}</strong></div>
          {proposal.discount > 0 && <p className="investment-original">Valor original: {brl.format(subtotal)} · desconto de {proposal.discount}%</p>}
          <ul className="commercial-points"><li>Esta proposta tem validade de {proposal.validity}.</li><li>Pagamento: {proposal.payment}.</li><li>Prazo de entrega: {proposal.deadline}.</li></ul>
        </div>
        <div className="contact-card">
          <div><h2>Contato</h2><strong>{proposal.consultant}</strong><span>contato@sonatecnologia.com.br</span><span>Av. Jamel Cecílio · Metropolitan Mall</span><span>Goiânia — GO</span><small>Proposta {proposal.code} · {date}</small></div>
          <ProposalBrand stacked />
        </div>
        <PageFooter number={String(contactPage)} />
      </section>
    </article>
  );
}

function ProposalBrand({ stacked = false }: { stacked?: boolean }) {
  return <div className={`proposal-brand ${stacked ? "proposal-brand--stacked" : ""}`} aria-label="SONA — tecnologia e inteligência para o bem-estar">
    <span className="proposal-brand__name"><b>S</b><i /><b>N</b><b>A</b></span>
    <span className="proposal-brand__tagline">tecnologia e inteligência<br />para o bem-estar.</span>
  </div>;
}

function DotPair({ position }: { position: "top" | "bottom" }) {
  return <div className={`dot-grid dot-grid--${position}`} aria-hidden="true"><span /><span /></div>;
}

function DottedFrame() { return <><DotPair position="top" /><ProposalBrand /><DotPair position="bottom" /></>; }
function PageFooter({ number }: { number: string }) { return <div className="page-number">{number}</div>; }

function ScopeEditor({ onGenerate }: { onGenerate: (report: ScopeReport) => void }) {
  const [tools, setTools] = useState<ScopeTool[]>(defaultScopeTools);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [markers, setMarkers] = useState<ScopeMarker[]>([
    { id: 1, type: "light", label: "L01", environment: "Sala", description: "Circuito principal", status: "previsto", x: 28, y: 31, size: 38, range: 18 },
    { id: 2, type: "climate", label: "AR01", environment: "Sala", description: "Evaporadora", status: "aprovado", x: 67, y: 28, size: 38, range: 18 },
    { id: 3, type: "access-point", label: "AP01", environment: "Circulação", description: "Cobertura Wi-Fi principal", status: "previsto", x: 53, y: 58, size: 38, range: 9, apModel: "u6-pro" },
  ]);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [assets, setAssets] = useState<PlanAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [planImage, setPlanImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [draggingAsset, setDraggingAsset] = useState<number | null>(null);
  const [resizingMarker, setResizingMarker] = useState<number | null>(null);
  const [resizingAsset, setResizingAsset] = useState<number | null>(null);
  const [project, setProject] = useState("Residência Família Almeida");
  const [address, setAddress] = useState("Goiânia — GO");
  const [catalogItems, setCatalogItems] = useState<ScopeCatalogItem[]>([]);
  const [detectedTools, setDetectedTools] = useState<string[]>([]);
  const [legendStatus, setLegendStatus] = useState("Aguardando uma planta para analisar a legenda");
  const [heatmap, setHeatmap] = useState(true);
  const [heatBand, setHeatBand] = useState<"2.4" | "5" | "6">("5");
  const [analyzing, setAnalyzing] = useState(false);
  const [toast, setToast] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const [planWidthMeters, setPlanWidthMeters] = useState(12);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [canvasMode, setCanvasMode] = useState<"marker" | "pan" | "wall" | "calibrate">("marker");
  const [walls, setWalls] = useState<Array<{ id: number; pts: Array<{ x: number; y: number }> }>>([]);
  const [wallDraft, setWallDraft] = useState<Array<{ x: number; y: number }>>([]);
  const [planPages, setPlanPages] = useState<string[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [calibLine, setCalibLine] = useState<Array<{ x: number; y: number }>>([]);
  const [calibMeters, setCalibMeters] = useState("");
  const panRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const clampZoom = (z: number) => Math.min(6, Math.max(0.3, z));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const finishWall = () => { if (wallDraft.length >= 2) setWalls((w) => [...w, { id: Date.now(), pts: wallDraft }]); setWallDraft([]); };
  const applyCalibration = (meters: number) => {
    const el = canvasRef.current;
    if (calibLine.length < 2 || !el || !(meters > 0)) return;
    const w = el.clientWidth, h = el.clientHeight;
    const [a, b] = calibLine;
    const distPx = Math.hypot(((b.x - a.x) / 100) * w, ((b.y - a.y) / 100) * h);
    if (distPx < 1) return;
    setPlanWidthMeters(Math.max(1, Math.round((meters / distPx) * w * 10) / 10));
    setCalibLine([]);
    setCalibMeters("");
    setCanvasMode("marker");
  };
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.12 : 1 / 1.12))); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const activeTool = tools.find((tool) => tool.id === selectedTool) ?? tools[0];
  const marker = markers.find((item) => item.id === selectedMarker) ?? null;
  const asset = assets.find((item) => item.id === selectedAsset) ?? null;
  const totals = useMemo(() => tools.map((tool) => ({ tool, qty: markers.filter((item) => item.type === tool.id).length })).filter((item) => item.qty > 0), [markers, tools]);
  const visibleTools = detectedTools.length ? tools.filter((tool) => detectedTools.includes(tool.id)) : tools;
  const suggestedCatalog = useMemo(() => {
    const suggestionTool = tools.find((tool) => tool.id === marker?.type) ?? activeTool;
    const keywords = scopeCatalogKeywords[suggestionTool?.id] ?? [suggestionTool?.label ?? ""];
    return catalogItems.filter((item) => {
      const haystack = normalizeText([item.name, item.category, item.brand, item.model, item.system].join(" ")).replace(/[^a-z0-9]+/g, " ").trim();
      return keywords.some((keyword) => {
        const needle = normalizeText(keyword).replace(/[^a-z0-9]+/g, " ").trim();
        return needle.length > 0 && ` ${haystack} `.includes(` ${needle} `);
      });
    }).slice(0, 8);
  }, [activeTool, catalogItems, marker?.type, tools]);

  useEffect(() => {
    void fetch("/api/budget").then((response) => response.json()).then((data: { catalogItems?: ScopeCatalogItem[] }) => setCatalogItems(data.catalogItems ?? [])).catch(() => setCatalogItems([]));
    const stored = window.localStorage.getItem("sona-scope-draft");
    const timer = window.setTimeout(() => { if (stored) {
      try {
        const draft = JSON.parse(stored) as { tools?: ScopeTool[]; markers?: ScopeMarker[]; assets?: PlanAsset[]; project?: string; address?: string; detectedTools?: string[] };
        if (draft.tools?.length) setTools(draft.tools);
        if (draft.markers?.length) setMarkers(draft.markers.map((item) => ({ ...item, size: item.size || 38, range: item.range || 18 })));
        if (draft.assets) setAssets(draft.assets);
        if (draft.project) setProject(draft.project);
        if (draft.address) setAddress(draft.address);
        if (draft.detectedTools) setDetectedTools(draft.detectedTools);
      } catch { /* mantém o projeto seguro */ }
    } }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Ao trocar a faixa, recalcula o alcance dos APs que têm modelo Ubiquiti definido.
  useEffect(() => {
    setMarkers((current) => current.map((item) => item.type === "access-point" && item.apModel ? { ...item, range: modelRadius(item.apModel, heatBand) } : item));
  }, [heatBand]);

  const updateMarker = (id: number, patch: Partial<ScopeMarker>) => setMarkers((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  const updateAsset = (id: number, patch: Partial<PlanAsset>) => setAssets((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));

  const addMarkerAt = (x: number, y: number, toolId?: string) => {
    if (!toolId) return;
    const tool = tools.find((entry) => entry.id === toolId);
    if (!tool) return;
    const id = Math.max(0, ...markers.map((item) => item.id)) + 1;
    const count = markers.filter((item) => item.type === tool.id).length + 1;
    const isAp = tool.id === "access-point";
    const next: ScopeMarker = { id, type: tool.id, label: `${tool.code}${String(count).padStart(2, "0")}`, environment: "Novo ambiente", description: tool.label, status: "previsto", x, y, size: 38, range: isAp ? modelRadius("u6-pro", heatBand) : 18, ...(isAp ? { apModel: "u6-pro" } : {}) };
    setMarkers((current) => [...current, next]);
    setSelectedMarker(id);
    setSelectedAsset(null);
  };

  const pointFromEvent = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)), y: Math.max(3, Math.min(97, ((clientY - rect.top) / rect.height) * 100)) };
  };

  const recognizeLegend = (rawText: string) => {
    const normalized = normalizeText(rawText);
    const found = tools.filter((tool) => {
      const terms = [tool.code, tool.label, ...(scopeCatalogKeywords[tool.id] ?? [])];
      return terms.some((term) => normalized.includes(normalizeText(term)));
    }).map((tool) => tool.id);
    setDetectedTools(found);
    setLegendStatus(found.length ? `Legenda reconhecida: ${found.length} disciplinas. O catálogo já está filtrado.` : "Planta carregada. Nenhuma sigla padrão foi encontrada; a legenda continua totalmente editável.");
  };

  const prepareForRealPlan = () => {
    if (planImage) return;
    setMarkers([]);
    setAssets([]);
    setWalls([]);
    setWallDraft([]);
    setCalibLine([]);
    setSelectedMarker(null);
    setSelectedAsset(null);
    setSelectedTool(null);
    resetView();
  };

  const loadPlan = async (file: File) => {
    setAnalyzing(true);
    setLegendStatus("Lendo planta e procurando a legenda…");
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const pageCount = Math.min(pdf.numPages, 20);
        const pages: string[] = [];
        let legendText = "";
        for (let n = 1; n <= pageCount; n++) {
          setLegendStatus(`Renderizando página ${n} de ${pageCount}…`);
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          if (!context) continue;
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          pages.push(canvas.toDataURL("image/jpeg", .9));
          if (n === 1) { const content = await page.getTextContent(); legendText = content.items.map((item) => "str" in item ? item.str : "").join(" "); }
        }
        if (!pages.length) throw new Error("PDF sem páginas renderizáveis");
        prepareForRealPlan();
        setPlanPages(pages);
        setActivePage(0);
        setPlanImage(pages[0]);
        recognizeLegend(legendText);
        if (pages.length > 1) setLegendStatus(`PDF com ${pages.length} páginas carregado. Use as miniaturas para trocar de página.`);
      } else if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
        prepareForRealPlan();
        setPlanPages([]);
        setActivePage(0);
        setPlanImage(dataUrl);
        const textDetector = (window as unknown as { TextDetector?: new () => { detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>> } }).TextDetector;
        if (textDetector) {
          const bitmap = await createImageBitmap(file);
          const detected = await new textDetector().detect(bitmap);
          recognizeLegend(detected.map((item) => item.rawValue ?? "").join(" "));
        } else recognizeLegend(file.name);
      } else {
        setLegendStatus(`Formato "${(file.name.split(".").pop() || "?").toUpperCase()}" não abre direto no navegador. Envie imagem (PNG, JPG, WebP, SVG) ou PDF. Arquivos CAD (DWG/DXF) devem ser exportados como PDF ou imagem.`);
        setAnalyzing(false);
        return;
      }
    } catch {
      setLegendStatus("A planta foi carregada, mas a legenda automática precisa de conferência manual.");
    } finally { setAnalyzing(false); }
  };

  const addOverlayImages = async (files: FileList) => {
    const next = await Promise.all(Array.from(files).slice(0, 12).map(async (file, index) => ({
      id: Date.now() + index, name: file.name, src: await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }),
      x: 12 + (index % 4) * 8, y: 12 + (index % 3) * 9, width: 14,
    })));
    setAssets((current) => [...current, ...next]);
    setSelectedAsset(next[0]?.id ?? null);
    setSelectedMarker(null);
  };

  const saveScope = () => {
    window.localStorage.setItem("sona-scope-draft", JSON.stringify({ tools, markers, assets, project, address, detectedTools }));
    setToast("Planejamento salvo neste dispositivo");
    window.setTimeout(() => setToast(""), 2400);
  };

  const printScope = () => {
    document.body.classList.add("print-scope");
    const cleanup = () => document.body.classList.remove("print-scope");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1200);
  };

  const generateItems = () => {
    const grouped = new Map<string, { category: string; description: string; qty: number }>();
    markers.forEach((point) => {
      const tool = tools.find((entry) => entry.id === point.type) ?? tools[0];
      const key = point.catalogItemId ?? point.type;
      const current = grouped.get(key) ?? { category: tool.category, description: point.catalogName ?? tool.label, qty: 0 };
      grouped.set(key, { ...current, qty: current.qty + 1 });
    });
    const items = Array.from(grouped.values()).map((item, index) => ({ id: index + 1, ...item, unit: "pt", unitPrice: 0 }));
    onGenerate({ items, project, address, planImage, markers, tools, assets });
  };

  return (
    <div className="scope-workspace">
      <section className="scope-main">
        <div className="scope-heading">
          <div><span className="eyebrow">MAPA DO PROJETO</span><h2>Editor técnico de planta</h2><p>Arraste símbolos e imagens, redimensione os elementos e transforme a legenda em quantitativo.</p></div>
          <div className="scope-actions"><button className="btn btn--ghost" onClick={saveScope}>✓ Salvar</button><button className="btn btn--ghost" onClick={printScope}>↗ Imprimir</button><button className="btn btn--dark" onClick={generateItems} disabled={markers.length === 0}>Gerar proposta <span>→</span></button></div>
        </div>

        <div className="scope-meta">
          <label>Projeto<input value={project} onChange={(e) => setProject(e.target.value)} /></label>
          <label>Local<input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <div><small>PONTOS</small><strong>{markers.length}</strong></div>
          <div><small>DISCIPLINAS</small><strong>{totals.length}</strong></div>
        </div>

        <div className="tool-strip" aria-label="Ferramentas de marcação">
          <div className="tool-strip__label"><small>LEGENDA ATIVA</small><span>{detectedTools.length ? `${detectedTools.length} tipos detectados` : "Todos os tipos"}</span></div>
          <div className="tool-strip__scroll">
            {visibleTools.map((tool) => <button key={tool.id} draggable className={selectedTool === tool.id ? "selected" : ""} onDragStart={(event) => event.dataTransfer.setData("sona/tool", tool.id)} onClick={() => setSelectedTool((current) => current === tool.id ? null : tool.id)} title={`${tool.label} — clique novamente para desmarcar ou arraste para a planta`}><i style={{ background: tool.color }}>{tool.code}</i><span>{tool.label}</span></button>)}
          </div>
          {detectedTools.length > 0 && <button className="legend-reset" onClick={() => setDetectedTools([])}>Mostrar todos</button>}
        </div>

        <div className={`legend-reader ${detectedTools.length ? "legend-reader--ready" : ""}`}><span>{analyzing ? "◌" : "⌁"}</span><div><strong>Leitura inteligente da legenda</strong><small>{legendStatus}</small></div><b>{detectedTools.length ? "FILTRO ATIVO" : "PRONTO"}</b></div>

        <div className="plan-card">
          <div className="plan-card__bar">
            <div><span className="live-dot" /> PLANTA DE MARCAÇÃO</div><div className="plan-bar-actions"><div className="plan-modes"><button className={canvasMode === "marker" ? "active" : ""} onClick={() => setCanvasMode("marker")} title="Inserir pontos">✛ Marcar</button><button className={canvasMode === "pan" ? "active" : ""} onClick={() => setCanvasMode("pan")} title="Arrastar a planta">✋ Mover</button><button className={canvasMode === "wall" ? "active" : ""} onClick={() => setCanvasMode("wall")} title="Desenhar paredes — 2 cliques finaliza, clique direito cancela">▟ Parede</button><button className={canvasMode === "calibrate" ? "active" : ""} onClick={() => { setCanvasMode("calibrate"); setCalibLine([]); }} title="Calibrar escala: trace uma medida conhecida na planta">📏 Escala</button></div><div className="plan-zoom"><button onClick={() => setZoom((z) => clampZoom(z / 1.2))} title="Diminuir">−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((z) => clampZoom(z * 1.2))} title="Aumentar">＋</button><button onClick={resetView} title="Ajustar à tela">⤢</button>{walls.length > 0 && <button onClick={() => { setWalls([]); setWallDraft([]); }} title="Limpar paredes">🗑</button>}</div><button className={heatmap ? "active" : ""} onClick={() => setHeatmap((value) => !value)}>◉ Mapa de calor</button><select value={heatBand} onChange={(event) => setHeatBand(event.target.value as "2.4" | "5" | "6")}><option value="2.4">2,4 GHz</option><option value="5">5 GHz</option><option value="6">6 GHz</option></select><label className="plan-scale">Escala<input type="number" min="1" max="80" value={planWidthMeters} onChange={(event) => setPlanWidthMeters(Math.max(1, Number(event.target.value) || 1))} title="Largura real da planta, em metros" /><span>m</span></label><label className="plan-upload"><input type="file" accept="image/*" multiple onChange={(e) => e.target.files && void addOverlayImages(e.target.files)} />＋ Imagens</label><label className="plan-upload"><input type="file" accept="image/*,.pdf,application/pdf" onChange={(e) => e.target.files?.[0] && void loadPlan(e.target.files[0])} />{planImage ? "Trocar planta" : "＋ Carregar planta/PDF"}</label></div>
          </div>
          <div
            className={`plan-canvas plan-canvas--mode-${canvasMode} ${planImage ? "plan-canvas--image" : ""}`}
            ref={canvasRef}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); const point = pointFromEvent(event.clientX, event.clientY); const toolId = event.dataTransfer.getData("sona/tool"); if (point && toolId) addMarkerAt(point.x, point.y, toolId); }}
            onContextMenu={(e) => { if (canvasMode === "wall" && wallDraft.length) { e.preventDefault(); setWallDraft([]); } }}
            onDoubleClick={() => { if (canvasMode === "wall") finishWall(); }}
            onPointerDown={(e) => { if (canvasMode !== "pan") return; panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ } }}
            onPointerMove={(e) => { if (!panRef.current) return; setPan({ x: panRef.current.px + (e.clientX - panRef.current.sx), y: panRef.current.py + (e.clientY - panRef.current.sy) }); }}
            onPointerUp={(e) => { if (panRef.current) { panRef.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ } } }}
            onClick={(e) => {
              if (canvasMode === "pan" || dragging || draggingAsset || resizingMarker || resizingAsset) return;
              if (canvasMode === "marker" && !selectedTool) { setSelectedMarker(null); setSelectedAsset(null); return; }
              const point = pointFromEvent(e.clientX, e.clientY);
              if (!point) return;
              if (canvasMode === "wall") { setWallDraft((d) => [...d, point]); return; }
              if (canvasMode === "calibrate") { setCalibLine((c) => (c.length >= 2 ? [point] : [...c, point])); return; }
              addMarkerAt(point.x, point.y, selectedTool ?? undefined);
            }}
          >
            {planImage ? <img className="plan-canvas__image" src={planImage} alt="Planta completa do projeto" draggable={false} /> : <DefaultFloorPlan />}
            {heatmap && <WifiHeatLayer aps={markers.filter((item) => item.type === "access-point")} planWidthMeters={planWidthMeters} walls={walls} band={heatBand} />}
            {assets.map((item) => <div key={item.id} className={`plan-asset ${selectedAsset === item.id ? "selected" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%` }} onPointerDown={(event) => { event.stopPropagation(); setDraggingAsset(item.id); setSelectedAsset(item.id); setSelectedMarker(null); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (draggingAsset !== item.id || resizingAsset === item.id || event.buttons === 0) return; const point = pointFromEvent(event.clientX, event.clientY); if (point) updateAsset(item.id, point); }} onPointerUp={(event) => { event.stopPropagation(); setDraggingAsset(null); event.currentTarget.releasePointerCapture(event.pointerId); }}><img src={item.src} alt={item.name} draggable={false} /><small>{item.name}</small><button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setAssets((current) => current.filter((entry) => entry.id !== item.id)); setSelectedAsset(null); }} aria-label={`Excluir ${item.name}`}>×</button><span className="resize-handle" onPointerDown={(event) => { event.stopPropagation(); setResizingAsset(item.id); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (resizingAsset !== item.id || event.buttons === 0) return; const rect = canvasRef.current?.getBoundingClientRect(); if (rect) updateAsset(item.id, { width: Math.max(5, Math.min(95, item.width + ((event.movementX + event.movementY) / rect.width) * 100)) }); }} onPointerUp={(event) => { event.stopPropagation(); setResizingAsset(null); event.currentTarget.releasePointerCapture(event.pointerId); }} /></div>)}
            <div className="canvas-hint">{canvasMode === "pan" ? "Arraste para mover · use o zoom" : canvasMode === "wall" ? "Clique para traçar paredes · 2 cliques finaliza" : selectedTool ? <>Clique para inserir <b>{activeTool.code}</b> · clique novamente na legenda para desmarcar</> : "Nenhuma legenda selecionada · selecione uma para inserir pontos"}</div>
            {heatmap && markers.some((item) => item.type === "access-point") && <div className="wifi-legend" aria-hidden="true"><strong>Sinal · {heatBand === "2.4" ? "2,4" : heatBand} GHz</strong><span><i style={{ background: "#2ecc71" }} />Excelente</span><span><i style={{ background: "#1abc9c" }} />Bom</span><span><i style={{ background: "#f1c40f" }} />Regular</span><span><i style={{ background: "#e67e22" }} />Fraco</span></div>}
            {(walls.length > 0 || wallDraft.length > 0 || calibLine.length > 0) && <svg className="plan-walls" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{walls.map((wall) => <polyline key={wall.id} points={wall.pts.map((p) => `${p.x},${p.y}`).join(" ")} />)}{wallDraft.length > 0 && <polyline className="plan-walls__draft" points={wallDraft.map((p) => `${p.x},${p.y}`).join(" ")} />}{calibLine.length > 0 && <polyline className="plan-calib" points={calibLine.map((p) => `${p.x},${p.y}`).join(" ")} />}{calibLine.map((p, i) => <circle key={`c${i}`} className="plan-calib-node" cx={p.x} cy={p.y} r="0.9" />)}</svg>}
            {markers.map((item) => {
              const tool = tools.find((entry) => entry.id === item.type) ?? tools[0];
              return <button
                key={item.id}
                className={`scope-marker ${selectedMarker === item.id ? "selected" : ""}`}
                style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size, background: tool.color }}
                onClick={(e) => { e.stopPropagation(); setSelectedMarker(item.id); setSelectedAsset(null); }}
                onPointerDown={(e) => { e.stopPropagation(); if (resizingMarker === item.id) return; setDragging(item.id); e.currentTarget.setPointerCapture(e.pointerId); setSelectedMarker(item.id); setSelectedAsset(null); }}
                onPointerMove={(e) => { if (dragging !== item.id || resizingMarker === item.id || e.buttons === 0) return; const point = pointFromEvent(e.clientX, e.clientY); if (point) updateMarker(item.id, point); }}
                onPointerUp={(e) => { e.stopPropagation(); setDragging(null); e.currentTarget.releasePointerCapture(e.pointerId); }}
                title={`${tool.label} · ${item.environment}`}
              >{item.label}<span className="resize-handle" onPointerDown={(event) => { event.stopPropagation(); setDragging(null); setResizingMarker(item.id); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (resizingMarker !== item.id || event.buttons === 0) return; updateMarker(item.id, { size: Math.max(26, Math.min(90, item.size + event.movementX)) }); }} onPointerUp={(event) => { event.stopPropagation(); setResizingMarker(null); event.currentTarget.releasePointerCapture(event.pointerId); }} /></button>;
            })}
          </div>
          {planPages.length > 1 && <div className="plan-pages">{planPages.map((src, i) => <button key={i} className={activePage === i ? "active" : ""} onClick={() => { setActivePage(i); setPlanImage(src); }} title={`Página ${i + 1}`}><img src={src} alt={`Página ${i + 1}`} /><span>{i + 1}</span></button>)}</div>}
          {canvasMode === "calibrate" && <div className="calib-panel">{calibLine.length < 2 ? <span>Trace uma medida conhecida na planta ({calibLine.length}/2)</span> : <><label>Distância real<input type="number" min="0.1" step="0.1" value={calibMeters} onChange={(e) => setCalibMeters(e.target.value)} autoFocus /><span>m</span></label><button className="calib-apply" onClick={() => applyCalibration(Number(calibMeters))}>Aplicar</button></>}<button className="calib-cancel" onClick={() => { setCalibLine([]); setCalibMeters(""); }}>Limpar</button></div>}
        </div>

        <div className="quant-card">
          <div className="quant-card__head"><div><span className="eyebrow">TABELA TÉCNICA</span><h3>Quantitativo por marcação</h3></div><span>{markers.length} itens</span></div>
          <div className="quant-table-wrap"><table className="quant-table"><thead><tr><th>Cód.</th><th>Disciplina</th><th>Ambiente</th><th>Descrição / circuito</th><th>Status</th><th /></tr></thead><tbody>
            {markers.map((item) => { const tool = tools.find((entry) => entry.id === item.type) ?? tools[0]; return <tr key={item.id} onClick={() => setSelectedMarker(item.id)} className={selectedMarker === item.id ? "selected" : ""}><td><i style={{ background: tool.color }} />{item.label}</td><td>{tool.label}</td><td>{item.environment}</td><td>{item.description}</td><td><span className={`status status--${item.status}`}>{item.status}</span></td><td><button onClick={(e) => { e.stopPropagation(); setMarkers((current) => current.filter((markerItem) => markerItem.id !== item.id)); if (selectedMarker === item.id) setSelectedMarker(null); }} aria-label={`Excluir ${item.label}`}>×</button></td></tr>; })}
          </tbody></table></div>
        </div>
      </section>

      <aside className="scope-inspector">
        <div className="inspector-title"><span>PROPRIEDADES</span><h3>{marker ? marker.label : "Nenhum ponto selecionado"}</h3></div>
        {marker ? <>
          <div className="inspector-preview" style={{ background: tools.find((tool) => tool.id === marker.type)?.color }}>{marker.label}</div>
          <label className="field">Código do ponto<input value={marker.label} onChange={(e) => updateMarker(marker.id, { label: e.target.value.toUpperCase() })} /></label>
          <label className="field">Tipo<select value={marker.type} onChange={(e) => updateMarker(marker.id, { type: e.target.value })}>{tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.label}</option>)}</select></label>
          <label className="field">Ambiente<input value={marker.environment} onChange={(e) => updateMarker(marker.id, { environment: e.target.value })} /></label>
          <label className="field">Descrição técnica<textarea rows={3} value={marker.description} onChange={(e) => updateMarker(marker.id, { description: e.target.value })} /></label>
          <label className="field">Status<select value={marker.status} onChange={(e) => updateMarker(marker.id, { status: e.target.value as ScopeMarker["status"] })}><option value="previsto">Previsto</option><option value="revisar">Revisar</option><option value="aprovado">Aprovado</option></select></label>
          <label className="field">Tamanho do símbolo<input type="range" min="26" max="90" value={marker.size} onChange={(e) => updateMarker(marker.id, { size: Number(e.target.value) })} /></label>
          {marker.type === "access-point" && <><label className="field">Modelo Ubiquiti<select value={marker.apModel ?? "u6-pro"} onChange={(e) => updateMarker(marker.id, { apModel: e.target.value, range: modelRadius(e.target.value, heatBand) })}>{ubiquitiAPs.map((ap) => <option key={ap.id} value={ap.id}>{ap.name}</option>)}</select></label><label className="field">Alcance no plano (m)<input type="range" min="3" max="30" value={marker.range} onChange={(e) => updateMarker(marker.id, { range: Number(e.target.value) })} /><small>~{marker.range} m em {heatBand === "2.4" ? "2,4" : heatBand} GHz · ajuste fino</small></label></>}
          <div className="catalog-suggestions"><div><strong>ITENS COMPATÍVEIS</strong><small>Filtrados pela legenda “{tools.find((tool) => tool.id === marker.type)?.label}”</small></div>{suggestedCatalog.length ? suggestedCatalog.map((item) => <button key={item.id} className={marker.catalogItemId === item.id ? "selected" : ""} onClick={() => updateMarker(marker.id, { catalogItemId: item.id, catalogName: item.name, description: `${item.name} · ${[item.brand, item.model].filter(Boolean).join(" ")}` })}><span><b>{item.name}</b><small>{item.brand} · {item.model}</small></span><i>{marker.catalogItemId === item.id ? "✓" : "+"}</i></button>) : <p>Nenhum item compatível nesta categoria.</p>}</div>
          <button className="delete-marker" onClick={() => { setMarkers((current) => current.filter((item) => item.id !== marker.id)); setSelectedMarker(null); }}>Excluir ponto</button>
        </> : asset ? <><div className="asset-inspector-preview"><img src={asset.src} alt={asset.name} /></div><label className="field">Nome da imagem<input value={asset.name} onChange={(event) => updateAsset(asset.id, { name: event.target.value })} /></label><label className="field">Tamanho<input type="range" min="5" max="55" value={asset.width} onChange={(event) => updateAsset(asset.id, { width: Number(event.target.value) })} /><small>{asset.width}% da largura da planta</small></label><button className="delete-marker" onClick={() => { setAssets((current) => current.filter((item) => item.id !== asset.id)); setSelectedAsset(null); }}>Excluir imagem</button></> : <div className="inspector-empty"><span>⌖</span><p>Selecione um marcador ou uma imagem para mover, editar, aumentar, diminuir ou excluir.</p></div>}

        <div className="legend-editor">
          <div className="legend-editor__head"><div><span>LEGENDA EDITÁVEL</span><p>Altere nomes, siglas e cores.</p></div><button onClick={() => { const id = `custom-${Date.now()}`; setTools((current) => [...current, { id, code: "X", label: "Novo marcador", color: "#5f6964", category: "Automação" }]); setSelectedTool(id); }}>＋</button></div>
          <div className="legend-list">{tools.map((tool) => <div key={tool.id} className={detectedTools.includes(tool.id) ? "detected" : ""}><input type="color" value={tool.color} onChange={(e) => setTools((current) => current.map((item) => item.id === tool.id ? { ...item, color: e.target.value } : item))} aria-label={`Cor de ${tool.label}`} /><input className="legend-code" value={tool.code} onChange={(e) => setTools((current) => current.map((item) => item.id === tool.id ? { ...item, code: e.target.value.toUpperCase().slice(0, 3) } : item))} aria-label={`Sigla de ${tool.label}`} /><input value={tool.label} onChange={(e) => setTools((current) => current.map((item) => item.id === tool.id ? { ...item, label: e.target.value } : item))} aria-label={`Nome de ${tool.label}`} /><button onClick={() => { setTools((current) => current.filter((item) => item.id !== tool.id)); setMarkers((current) => current.filter((item) => item.type !== tool.id)); }} aria-label={`Excluir ${tool.label}`}>×</button></div>)}</div>
        </div>
      </aside>

      <section className="scope-report" aria-hidden="true">
        <DottedFrame /><div className="word-title"><strong>ESCOPO TÉCNICO</strong><b>{project}</b></div><p className="report-address">{address}</p>
        <div className="report-plan"><div className="report-plan__canvas">{planImage ? <img src={planImage} alt="" /> : <DefaultFloorPlan />}{assets.map((item) => <img className="report-plan__asset" key={item.id} src={item.src} alt="" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%` }} />)}{markers.map((item) => { const tool = tools.find((entry) => entry.id === item.type) ?? tools[0]; return <span key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size, background: tool.color }}>{item.label}</span>; })}</div></div>
        <div className="report-legend">{totals.map(({ tool, qty }) => <div key={tool.id}><i style={{ background: tool.color }}>{tool.code}</i><span>{tool.label}</span><b>{qty}</b></div>)}</div>
        <table className="classic-table"><thead><tr><th>Item / ambiente</th><th>Quantidade</th></tr></thead><tbody>{totals.map(({ tool, qty }) => <tr key={tool.id}><td><strong>{tool.label}</strong><span>{tool.category}</span></td><td>{qty}</td></tr>)}</tbody></table><PageFooter number="1" />
      </section>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function DefaultFloorPlan() {
  const rooms = [
    ["garage", "GARAGEM", "31,8 m²"],
    ["office", "ESCRITÓRIO", "11,2 m²"],
    ["living", "SALA / ESTAR", "35,6 m²"],
    ["kitchen", "COZINHA", "17,4 m²"],
    ["service", "SERVIÇO", "7,8 m²"],
    ["hall", "CIRCULAÇÃO", "9,5 m²"],
    ["suite", "SUÍTE MASTER", "21,3 m²"],
    ["bedroom-a", "QUARTO 01", "12,1 m²"],
    ["bedroom-b", "QUARTO 02", "11,8 m²"],
    ["balcony", "VARANDA", "24,7 m²"],
  ] as const;
  return <div className="default-plan default-plan--demo" aria-label="Planta residencial demonstrativa editável">
    <div className="default-plan__title"><strong>PLANTA EXEMPLO SONA</strong><span>Use as ferramentas para inserir APs, paredes e imagens</span></div>
    {rooms.map(([slug, label, area]) => <span key={slug} className={`room room--${slug}`}>{label}<small>{area}</small></span>)}
    {Array.from({ length: 8 }, (_, index) => <i key={index} className={`door door--demo-${index + 1}`} />)}
    <div className="default-plan__scale"><i /><span>5 m</span></div>
  </div>;
}
