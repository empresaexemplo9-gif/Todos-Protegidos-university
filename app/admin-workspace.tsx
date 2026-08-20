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

export type ProposalExtraPage = {
  id: number;
  title: string;
  subtitle: string;
  body: string;
  images: string[];
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
  extraPages: ProposalExtraPage[];
};

export type ScopeTool = { id: string; code: string; label: string; color: string; category: string };
export type ScopeMarker = { id: number; type: string; label: string; environment: string; description: string; status: "previsto" | "revisar" | "aprovado"; x: number; y: number; size: number; range: number; apModel?: string; catalogItemId?: string; catalogName?: string };
export type PlanAsset = { id: number; name: string; src: string; x: number; y: number; width: number; rotation?: number };
type ScopeCatalogItem = { id: string; name: string; category: string; brand: string; model: string; system: string; sku?: string; unit?: string; description?: string; salePrice?: number; purchasePrice?: number; imageUrl?: string };
export type ScopeReport = { client: string; project: string; address: string; planImage: string | null; markers: ScopeMarker[]; tools: ScopeTool[]; assets: PlanAsset[]; items: ProposalItem[]; itemImages: Record<number, string[]>; productImages: string[]; markerImages: Record<number, string>; equipmentLegend: { image: string; name: string; qty: number }[] };

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

// Materiais de parede com atenuação real (dB), referência 5 GHz — mesma ordem de grandeza
// que a Ubiquiti usa no UniFi Design Center ao desenhar paredes por material.
export type WallMaterial = "drywall" | "glass" | "wood" | "brick" | "concrete" | "metal";
export const wallMaterials: Array<{ id: WallMaterial; label: string; db: number; color: string }> = [
  { id: "drywall", label: "Gesso / drywall", db: 3, color: "#8f9ba4" },
  { id: "wood", label: "Madeira", db: 4, color: "#b98a4e" },
  { id: "glass", label: "Vidro", db: 6, color: "#3fb0d4" },
  { id: "brick", label: "Tijolo / alvenaria", db: 9, color: "#c56a4a" },
  { id: "concrete", label: "Concreto", db: 14, color: "#5f676c" },
  { id: "metal", label: "Metal / laje", db: 25, color: "#33393f" },
];
const wallDb = (id: WallMaterial) => (wallMaterials.find((m) => m.id === id) ?? wallMaterials[0]).db;
const wallColor = (id: WallMaterial) => (wallMaterials.find((m) => m.id === id) ?? wallMaterials[0]).color;
// Faixas mais altas atravessam obstáculos com mais perda.
const bandWallFactor = (band: "2.4" | "5" | "6") => (band === "2.4" ? 0.8 : band === "6" ? 1.15 : 1);
// Expoente de perda de percurso (log-distância) por faixa, típico de ambiente residencial.
const pathLossExp = (band: "2.4" | "5" | "6") => (band === "2.4" ? 2.9 : band === "6" ? 3.25 : 3.1);
// dBm de referência para as cores (padrão de leitura Wi-Fi da Ubiquiti).
const RSSI_EDGE = -73; // borda útil de cobertura, ancorada ao alcance do modelo
const RSSI_MIN = -86;  // abaixo disso o sinal é desprezível
const RSSI_MAX = -46;  // muito próximo do AP

// Camada de cobertura: modelo de RF em dBm que combina os APs, respeita a escala e
// reduz o sinal em dB reais ao atravessar cada parede conforme o material.
function WifiHeatLayer({ aps, planWidthMeters, walls, band }: {
  aps: ScopeMarker[];
  planWidthMeters: number;
  walls: Array<{ id: number; pts: Array<{ x: number; y: number }>; material: WallMaterial }>;
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
      const wallFactor = bandWallFactor(band);
      const exponent = pathLossExp(band);
      const segments = walls.flatMap((wall) => wall.pts.slice(1).map((point, index) => ({ a: wall.pts[index], b: point, db: wallDb(wall.material) })));
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
          let bestRssi = -Infinity;
          for (const ap of aps) {
            const apx = ap.x / 100 * sw;
            const apy = ap.y / 100 * sh;
            const radius = Math.max(1, ap.range || modelRadius(ap.apModel ?? "u6-pro", band));
            const distance = Math.max(0.5, Math.hypot(x - apx, y - apy) * metersPerPixel);
            // Perda log-distância ancorada ao alcance do modelo: no raio, RSSI = borda útil.
            let rssi = Math.min(RSSI_MAX, RSSI_EDGE + 10 * exponent * Math.log10(radius / distance));
            if (segments.length) {
              let loss = 0;
              for (const seg of segments) {
                if (intersects(apx, apy, x, y, seg.a.x / 100 * sw, seg.a.y / 100 * sh, seg.b.x / 100 * sw, seg.b.y / 100 * sh)) loss += seg.db;
              }
              rssi -= loss * wallFactor;
            }
            if (rssi > bestRssi) bestRssi = rssi;
          }
          if (bestRssi < RSSI_MIN) continue;
          const value = Math.max(0, Math.min(1, (bestRssi - RSSI_MIN) / (RSSI_MAX - RSSI_MIN)));
          const [r, g, b] = colorAt(value);
          const offset = (y * sw + x) * 4;
          image.data[offset] = r;
          image.data[offset + 1] = g;
          image.data[offset + 2] = b;
          image.data[offset + 3] = Math.round(45 + value * 165);
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
  extraPages: [],
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
    setProposal({ ...initialProposal, ...(bundle?.proposal ?? {}), extraPages: bundle?.proposal?.extraPages ?? [] });
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
    const canShare = typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title: `Proposta ${proposal.code}`, text: `Proposta SONA para ${proposal.client}`, url });
      else await navigator.clipboard.writeText(url);
      await fetch("/api/proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "markSent", id: proposalId }) });
      setProposalStatus("sent");
      await refreshProposals();
      showNotice(canShare ? "Proposta preparada para envio" : "Link do cliente copiado");
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
            setItemImages(report.itemImages ?? {});
            setProductImages(report.productImages ?? []);
            patchProposal("items", report.items);
            patchProposal("client", report.client);
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
  const extraPages = proposal.extraPages ?? [];
  const addExtraPage = () => patchProposal("extraPages", [...extraPages, { id: Math.max(0, ...extraPages.map((page) => page.id)) + 1, title: "Nova página", subtitle: "", body: "", images: [] }]);
  const updateExtraPage = (id: number, patch: Partial<ProposalExtraPage>) => patchProposal("extraPages", extraPages.map((page) => page.id === id ? { ...page, ...patch } : page));
  const removeExtraPage = (id: number) => patchProposal("extraPages", extraPages.filter((page) => page.id !== id));
  const addExtraPageImages = async (id: number, files: FileList) => {
    const uploaded = await Promise.all(Array.from(files).slice(0, 4).map(imageFileToDataUrl));
    const current = extraPages.find((page) => page.id === id)?.images ?? [];
    updateExtraPage(id, { images: [...current, ...uploaded].slice(0, 4) });
  };
  const removeExtraPageImage = (id: number, imageIndex: number) => {
    const current = [...(extraPages.find((page) => page.id === id)?.images ?? [])];
    const [removed] = current.splice(imageIndex, 1);
    if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);
    updateExtraPage(id, { images: current });
  };
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

        <div className="form-card">
          <div className="form-card__head"><span>06</span><div><h3>Páginas adicionais</h3><p>Inclua quantas páginas livres quiser — cada uma vira uma folha da proposta.</p></div><button className="mini-add" onClick={addExtraPage}>＋ Adicionar página</button></div>
          <div className="extra-pages">
            {extraPages.map((page, index) => (
              <div className="extra-page-card" key={page.id}>
                <div className="extra-page-card__head"><span>Página {index + 1}</span><button className="remove" onClick={() => removeExtraPage(page.id)} aria-label={`Remover página ${index + 1}`}>×</button></div>
                <div className="form-grid">
                  <label className="field">Título<input value={page.title} onChange={(e) => updateExtraPage(page.id, { title: e.target.value })} /></label>
                  <label className="field">Subtítulo <small>opcional</small><input value={page.subtitle} onChange={(e) => updateExtraPage(page.id, { subtitle: e.target.value })} /></label>
                  <label className="field field--full">Conteúdo <small>um parágrafo por linha</small><textarea rows={5} value={page.body} onChange={(e) => updateExtraPage(page.id, { body: e.target.value })} /></label>
                  <label className="media-upload field--full">
                    <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && addExtraPageImages(page.id, e.target.files)} />
                    <span>＋</span><div><strong>Adicionar imagens da página</strong><small>PNG ou JPG · até 4 · opcionais</small></div>
                    {page.images.length > 0 && <em>{page.images.length} adicionada{page.images.length > 1 ? "s" : ""}</em>}
                  </label>
                  {page.images.length > 0 && <div className="cover-image-thumbs field--full">{page.images.map((src, imageIndex) => <span key={src}><img src={src} alt={`Imagem ${imageIndex + 1} da página ${page.title}`} /><button type="button" onClick={() => removeExtraPageImage(page.id, imageIndex)} aria-label={`Remover imagem ${imageIndex + 1}`}>×</button></span>)}</div>}
                </div>
              </div>
            ))}
            {extraPages.length === 0 && <button className="empty-items" onClick={addExtraPage}>＋ Crie a primeira página adicional</button>}
          </div>
        </div>
      </section>

      <aside className="preview-panel">
        <div className="preview-toolbar">
          <div className="document-mode-tabs"><button className={!wordMode ? "active" : ""} onClick={onAutomaticMode}><span className="live-dot" /> AUTOMÁTICO</button><button className={wordMode ? "active" : ""} onClick={onStartWordMode}>W&nbsp; EDITAR DOCUMENTO</button></div>
          <div><span className={`proposal-state proposal-state--${status}`}>{proposalStatusLabel[status]}</span><button onClick={onExport} title="Baixar dados">⇩</button><button onClick={onPrint} className="toolbar-primary">Gerar PDF</button></div>
        </div>
        {wordMode && <WordToolbar editorRef={manualEditorRef} proposal={proposal} />}
        {wordMode ? <EditableProposalDocument editorRef={manualEditorRef} html={manualHtml} /> : <div ref={generatedPreviewRef}><ProposalSheet proposal={proposal} subtotal={subtotal} total={total} productImages={productImages} itemImages={itemImages} scopeReport={scopeReport} /></div>}
      </aside>
    </div>
  );
}

type ImageHandlePosition = { left: number; top: number };

type RgbColor = { red: number; green: number; blue: number };

function cornerColor(data: Uint8ClampedArray, width: number, height: number, cornerX: 0 | 1, cornerY: 0 | 1): RgbColor {
  const sampleSize = Math.max(2, Math.min(12, Math.round(Math.min(width, height) * .012)));
  const startX = cornerX === 0 ? 0 : width - sampleSize;
  const startY = cornerY === 0 ? 0 : height - sampleSize;
  let red = 0;
  let green = 0;
  let blue = 0;
  let samples = 0;

  for (let y = startY; y < startY + sampleSize; y += 1) {
    for (let x = startX; x < startX + sampleSize; x += 1) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] === 0) continue;
      red += data[offset];
      green += data[offset + 1];
      blue += data[offset + 2];
      samples += 1;
    }
  }

  return samples > 0
    ? { red: red / samples, green: green / samples, blue: blue / samples }
    : { red: 255, green: 255, blue: 255 };
}

function colorDistanceSquared(data: Uint8ClampedArray, offset: number, color: RgbColor) {
  const red = data[offset] - color.red;
  const green = data[offset + 1] - color.green;
  const blue = data[offset + 2] - color.blue;
  return red * red + green * green + blue * blue;
}

function removeConnectedImageBackground(imageData: ImageData) {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const background = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  const colors = [
    cornerColor(data, width, height, 0, 0),
    cornerColor(data, width, height, 1, 0),
    cornerColor(data, width, height, 0, 1),
    cornerColor(data, width, height, 1, 1),
  ];
  const cornerSpread = Math.sqrt(Math.max(...colors.flatMap((color, index) => colors.slice(index + 1).map((other) => {
    const red = color.red - other.red;
    const green = color.green - other.green;
    const blue = color.blue - other.blue;
    return red * red + green * green + blue * blue;
  }))));
  const tolerance = Math.min(96, Math.max(52, 52 + cornerSpread * .35));
  const toleranceSquared = tolerance * tolerance;
  let queueStart = 0;
  let queueEnd = 0;

  const resemblesBackground = (pixelIndex: number) => {
    const offset = pixelIndex * 4;
    if (data[offset + 3] === 0) return true;
    return colors.some((color) => colorDistanceSquared(data, offset, color) <= toleranceSquared);
  };
  const enqueue = (pixelIndex: number) => {
    if (background[pixelIndex] || !resemblesBackground(pixelIndex)) return;
    background[pixelIndex] = 1;
    queue[queueEnd] = pixelIndex;
    queueEnd += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (queueStart < queueEnd) {
    const pixelIndex = queue[queueStart];
    queueStart += 1;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    if (x > 0) enqueue(pixelIndex - 1);
    if (x + 1 < width) enqueue(pixelIndex + 1);
    if (y > 0) enqueue(pixelIndex - width);
    if (y + 1 < height) enqueue(pixelIndex + width);
  }

  if (queueEnd < Math.max(12, pixelCount * .005)) {
    throw new Error("Não foi possível identificar um fundo contínuo ao redor da imagem.");
  }

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const alphaOffset = pixelIndex * 4 + 3;
    if (background[pixelIndex]) {
      data[alphaOffset] = 0;
      continue;
    }

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const touchesBackground = (x > 0 && background[pixelIndex - 1])
      || (x + 1 < width && background[pixelIndex + 1])
      || (y > 0 && background[pixelIndex - width])
      || (y + 1 < height && background[pixelIndex + width]);
    if (!touchesBackground) continue;

    const offset = pixelIndex * 4;
    const distance = Math.sqrt(Math.min(...colors.map((color) => colorDistanceSquared(data, offset, color))));
    const feather = Math.round(255 * Math.min(1, Math.max(0, (distance - tolerance * .72) / (tolerance * .65))));
    data[alphaOffset] = Math.min(data[alphaOffset], feather);
  }

  return imageData;
}

async function imageWithoutBackground(image: HTMLImageElement) {
  if (!image.complete || image.naturalWidth === 0) {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("Não foi possível carregar a imagem.")), { once: true });
    });
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("O navegador não conseguiu preparar a remoção de fundo.");
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  context.putImageData(removeConnectedImageBackground(imageData), 0, 0);
  return canvas.toDataURL("image/png");
}

function EditableProposalDocument({ editorRef, html }: { editorRef: React.RefObject<HTMLElement | null>; html: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const resizeRef = useRef<{ image: HTMLImageElement; parentWidth: number; pointerId: number; startWidth: number; startX: number; startY: number } | null>(null);
  const [handlePosition, setHandlePosition] = useState<ImageHandlePosition | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  // Keep the same prop reference while editing so React does not restore the original HTML after each handle movement.
  const documentHtml = useMemo(() => ({ __html: html }), [html]);

  const placeHandle = (image = selectedImageRef.current) => {
    const stage = stageRef.current;
    if (!stage || !image?.isConnected) {
      setHandlePosition(null);
      return;
    }
    const stageRect = stage.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    setHandlePosition({ left: imageRect.right - stageRect.left, top: imageRect.bottom - stageRect.top });
  };

  const selectImage = (image: HTMLImageElement | null) => {
    editorRef.current?.querySelectorAll("[data-word-selected]").forEach((node) => node.removeAttribute("data-word-selected"));
    selectedImageRef.current = image;
    if (image) {
      image.setAttribute("data-word-selected", "true");
      placeHandle(image);
    } else {
      setHandlePosition(null);
    }
  };

  useEffect(() => {
    selectImage(null);
  }, [html]);

  useEffect(() => {
    const update = () => placeHandle();
    const resizeImage = (event: PointerEvent) => {
      const resize = resizeRef.current;
      if (!resize || event.pointerId !== resize.pointerId) return;
      event.preventDefault();
      const deltaX = event.clientX - resize.startX;
      const deltaY = event.clientY - resize.startY;
      const delta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
      const width = Math.min(resize.parentWidth, Math.max(40, resize.startWidth + delta));
      resize.image.style.width = `${(width / resize.parentWidth) * 100}%`;
      resize.image.style.height = "auto";
      resize.image.style.maxWidth = "none";
      resize.image.style.maxHeight = "none";
      placeHandle(resize.image);
    };
    const finishResize = (event: PointerEvent) => {
      if (!resizeRef.current || event.pointerId !== resizeRef.current.pointerId) return;
      resizeRef.current = null;
      placeHandle();
    };
    const observer = new MutationObserver(update);
    if (editorRef.current) observer.observe(editorRef.current, { attributes: true, subtree: true, attributeFilter: ["style"] });
    window.addEventListener("resize", update);
    window.addEventListener("pointermove", resizeImage, { passive: false });
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("pointermove", resizeImage);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
    };
  }, []);

  return <div className="word-editor-stage" ref={stageRef}>
    <article
      ref={editorRef}
      className="proposal-document proposal-document--editable"
      id="proposal-print"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onPointerDown={(event) => selectImage(event.target instanceof HTMLImageElement ? event.target : null)}
      onDragStart={(event) => { if (event.target instanceof HTMLImageElement) event.preventDefault(); }}
      onKeyUp={() => placeHandle()}
      onLoadCapture={(event) => { if (event.target === selectedImageRef.current) placeHandle(); }}
      onPaste={(event) => {
        event.preventDefault();
        document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
      }}
      dangerouslySetInnerHTML={documentHtml}
    />
    {handlePosition && <>
      <button
        type="button"
        className="word-image-background-button"
        style={{ left: handlePosition.left - 88, top: handlePosition.top }}
        aria-label="Remover fundo da imagem selecionada"
        title={isRemovingBackground ? "Removendo fundo…" : "Remover fundo da imagem"}
        disabled={isRemovingBackground}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={async (event) => {
          event.stopPropagation();
          const image = selectedImageRef.current;
          if (!image || isRemovingBackground) return;
          setIsRemovingBackground(true);
          try {
            const transparentImage = await imageWithoutBackground(image);
            if (!image.isConnected) return;
            image.removeAttribute("srcset");
            image.src = transparentImage;
            editorRef.current?.focus();
            placeHandle(image);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Não foi possível remover o fundo desta imagem.";
            window.alert(`${message}\n\nUse uma imagem enviada do computador e com o objeto separado das bordas.`);
          } finally {
            setIsRemovingBackground(false);
          }
        }}
      >{isRemovingBackground ? "…" : "Fundo −"}</button>
      <button
        type="button"
        className="word-image-delete-button"
        style={{ left: handlePosition.left - 36, top: handlePosition.top }}
        aria-label="Excluir imagem selecionada"
        title="Excluir imagem"
        onClick={(event) => {
          event.stopPropagation();
          const image = selectedImageRef.current;
          if (!image || !window.confirm("Excluir esta imagem da proposta?")) return;
          image.remove();
          selectImage(null);
          editorRef.current?.focus();
        }}
      >×</button>
      <button
        type="button"
        className="word-image-resize-handle"
        style={{ left: handlePosition.left, top: handlePosition.top }}
        aria-label="Redimensionar imagem selecionada"
        title="Arraste para aumentar ou diminuir a imagem"
        onPointerDown={(event) => {
          const image = selectedImageRef.current;
          const parent = image?.parentElement;
          if (!image || !parent) return;
          event.preventDefault();
          event.stopPropagation();
          const parentWidth = parent.getBoundingClientRect().width;
          resizeRef.current = { image, parentWidth, pointerId: event.pointerId, startWidth: image.getBoundingClientRect().width, startX: event.clientX, startY: event.clientY };
        }}
      />
    </>}
  </div>;
}

function WordToolbar({ editorRef, proposal }: { editorRef: React.RefObject<HTMLElement | null>; proposal: Proposal }) {
  const savedRange = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
  };
  const styled = (name: string, value: string) => {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(name, false, value);
    document.execCommand("styleWithCSS", false, "false");
  };
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  };
  const restoreSelection = () => {
    const selection = window.getSelection();
    if (savedRange.current && selection) { selection.removeAllRanges(); selection.addRange(savedRange.current); }
  };
  const resizeImage = (delta: number) => {
    const image = editorRef.current?.querySelector<HTMLImageElement>("img[data-word-selected]");
    if (!image) return;
    const current = Number.parseFloat(image.style.width) || 100;
    image.style.width = `${Math.min(100, Math.max(20, current + delta))}%`;
    image.style.height = "auto";
  };
  const insertImageFromFile = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const dataUrl = await imageFileToDataUrl(files[0]);
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertImage", false, dataUrl);
  };
  const insertGeneratedImage = (dataUrl: string, description: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    document.execCommand("insertImage", false, dataUrl);
    const inserted = Array.from(editor.querySelectorAll<HTMLImageElement>("img")).find((image) => image.src === dataUrl);
    if (inserted) {
      inserted.alt = description;
      inserted.style.width = "100%";
      inserted.style.height = "auto";
      inserted.style.maxWidth = "100%";
    }
  };
  const generateAiImage = async () => {
    const prompt = aiPrompt.trim();
    if (prompt.length < 5 || aiBusy) {
      setAiError("Descreva a imagem com um pouco mais de detalhe.");
      return;
    }
    setAiBusy(true);
    setAiError("");
    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt}. Projeto: ${proposal.project}. Cliente: ${proposal.client}.`,
        }),
      });
      const data = await response.json().catch(() => ({})) as { image?: string; error?: string };
      if (!response.ok || !data.image) throw new Error(data.error || "Não foi possível gerar a imagem.");
      insertGeneratedImage(data.image, `Imagem gerada por IA: ${prompt}`);
      setAiOpen(false);
      setAiPrompt("");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Não foi possível gerar a imagem.");
    } finally {
      setAiBusy(false);
    }
  };
  const applyColor = (name: "foreColor" | "hiliteColor", value: string) => { restoreSelection(); styled(name, value); };
  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) { editorRef.current?.focus(); restoreSelection(); document.execCommand("createLink", false, /^https?:|^mailto:/.test(url) ? url : `https://${url}`); }
    setLinkOpen(false); setLinkUrl("");
  };
  const addPage = () => {
    const doc = editorRef.current;
    if (!doc) return;
    const section = document.createElement("section");
    section.className = "proposal-page proposal-page--extra";
    section.innerHTML = '<div class="solution-heading"><h2>NOVA PÁGINA</h2></div><p>Escreva o conteúdo desta página…</p>';
    doc.appendChild(section);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div className="word-toolbar" role="toolbar" aria-label="Ferramentas de edição do documento" onMouseDown={(event) => event.preventDefault()}>
    <div className="word-toolbar__brand"><b>W</b><span>Documento</span></div>
    <select aria-label="Estilo do parágrafo" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)} onMouseDown={(event) => event.stopPropagation()}><option value="p">Texto normal</option><option value="h2">Título</option><option value="h3">Subtítulo</option><option value="blockquote">Citação</option></select>
    <select aria-label="Fonte" defaultValue="" onChange={(event) => event.target.value && styled("fontName", event.target.value)} onMouseDown={(event) => event.stopPropagation()}><option value="">Fonte padrão</option><option value='Georgia, "Times New Roman", serif'>Serifada</option><option value='"Segoe UI", system-ui, sans-serif'>Moderna</option><option value='"Courier New", monospace'>Mono</option></select>
    <select aria-label="Tamanho do texto" defaultValue="3" onChange={(event) => styled("fontSize", event.target.value)} onMouseDown={(event) => event.stopPropagation()}><option value="1">Mínimo</option><option value="2">Pequeno</option><option value="3">Normal</option><option value="4">Médio</option><option value="5">Grande</option><option value="6">Enorme</option><option value="7">Máximo</option></select>
    <div className="word-toolbar__group"><button onClick={() => command("undo")} title="Desfazer">↶</button><button onClick={() => command("redo")} title="Refazer">↷</button></div>
    <div className="word-toolbar__group"><button onClick={() => command("bold")} title="Negrito"><b>B</b></button><button onClick={() => command("italic")} title="Itálico"><i>I</i></button><button onClick={() => command("underline")} title="Sublinhado"><u>U</u></button><button onClick={() => command("strikeThrough")} title="Tachado"><s>S</s></button></div>
    <div className="word-toolbar__group word-toolbar__colors">
      <label title="Cor do texto"><span style={{ color: "#1e654c" }}>A</span><input type="color" defaultValue="#1e654c" onMouseDown={saveSelection} onChange={(event) => applyColor("foreColor", event.target.value)} /></label>
      <label title="Cor de destaque"><span className="word-toolbar__marker">▉</span><input type="color" defaultValue="#ffef9f" onMouseDown={saveSelection} onChange={(event) => applyColor("hiliteColor", event.target.value)} /></label>
    </div>
    <div className="word-toolbar__group"><button onClick={() => command("justifyLeft")} title="Alinhar à esquerda">⯇</button><button onClick={() => command("justifyCenter")} title="Centralizar">≡</button><button onClick={() => command("justifyRight")} title="Alinhar à direita">⯈</button><button onClick={() => command("justifyFull")} title="Justificar">☰</button></div>
    <div className="word-toolbar__group"><button onClick={() => command("insertUnorderedList")} title="Lista">•☰</button><button onClick={() => command("insertOrderedList")} title="Lista numerada">1☰</button><button onClick={() => command("outdent")} title="Diminuir recuo">⇤</button><button onClick={() => command("indent")} title="Aumentar recuo">⇥</button></div>
    <div className="word-toolbar__group">
      <label className="word-toolbar__file" title="Inserir imagem" onMouseDown={saveSelection}><span>🖼</span><input type="file" accept="image/*" onChange={(event) => { void insertImageFromFile(event.target.files); event.target.value = ""; }} /></label>
      <button
        className={aiOpen ? "word-toolbar__ai is-active" : "word-toolbar__ai"}
        onMouseDown={saveSelection}
        onClick={() => { setAiOpen((open) => !open); setAiError(""); }}
        title="Criar uma imagem com inteligência artificial"
      >✦ IA</button>
      <button onClick={() => { saveSelection(); setLinkOpen((open) => !open); }} title="Inserir link" className={linkOpen ? "is-active" : ""}>🔗</button>
      <button onClick={() => command("insertHorizontalRule")} title="Linha divisória">―</button>
      <button onClick={() => command("removeFormat")} title="Limpar formatação">⌫</button>
    </div>
    <div className="word-toolbar__group word-toolbar__images"><button onClick={() => resizeImage(-10)} title="Diminuir imagem">Imagem −</button><button onClick={() => resizeImage(10)} title="Aumentar imagem">Imagem +</button></div>
    <button className="word-toolbar__page" onClick={addPage} title="Adicionar nova página">＋ Página</button>
    {aiOpen && <div className="word-toolbar__ai-panel" onMouseDown={(event) => event.stopPropagation()}>
      <div>
        <strong>Gerar imagem com IA</strong>
        <span>A imagem entra no ponto do cursor. A geração pode levar até 2 minutos.</span>
      </div>
      <textarea
        autoFocus
        value={aiPrompt}
        placeholder="Ex.: sala de cinema residencial sofisticada, iluminação indireta, caixas acústicas discretas e acabamento em madeira"
        onChange={(event) => { setAiPrompt(event.target.value); setAiError(""); }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void generateAiImage();
          if (event.key === "Escape" && !aiBusy) setAiOpen(false);
        }}
        disabled={aiBusy}
      />
      <button className="word-toolbar__ai-generate" onClick={() => void generateAiImage()} disabled={aiBusy}>
        {aiBusy ? "Gerando…" : "Gerar e inserir"}
      </button>
      <button className="word-toolbar__ai-cancel" onClick={() => setAiOpen(false)} disabled={aiBusy}>×</button>
      {aiError && <p role="alert">{aiError}</p>}
    </div>}
    {linkOpen && <div className="word-toolbar__link" onMouseDown={(event) => event.stopPropagation()}>
      <input autoFocus value={linkUrl} placeholder="https://…" onChange={(event) => setLinkUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applyLink(); if (event.key === "Escape") { setLinkOpen(false); setLinkUrl(""); } }} />
      <button onClick={applyLink}>Aplicar</button>
      <button className="word-toolbar__link-cancel" onClick={() => { setLinkOpen(false); setLinkUrl(""); }}>×</button>
    </div>}
    <span className="word-toolbar__hint">Clique na imagem para redimensionar ou excluir</span>
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
  const extraPages = proposal.extraPages ?? [];
  const afterLocationPage = 2 + solutionPages.length + (scopeReport ? 1 : 0);
  const detailsPage = afterLocationPage + extraPages.length;
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
        <div className="proposal-location-plan"><div className="report-plan__canvas">{scopeReport.planImage ? <img src={scopeReport.planImage} alt={`Planta do projeto ${scopeReport.project}`} /> : <DefaultFloorPlan />}{scopeReport.assets.map((asset) => <img className="report-plan__asset" key={asset.id} src={asset.src} alt={asset.name} style={{ left: `${asset.x}%`, top: `${asset.y}%`, width: `${asset.width}%`, transform: `translate(-50%, -50%) rotate(${asset.rotation ?? 0}deg)` }} />)}{scopeReport.markers.map((item) => { const tool = scopeReport.tools.find((entry) => entry.id === item.type) ?? scopeReport.tools[0]; const photo = scopeReport.markerImages?.[item.id]; if (photo) return <img className="report-plan__speaker" key={item.id} src={photo} alt={item.label} style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size }} />; return <span key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size, background: tool?.color ?? "#638c7e" }}>{item.label}</span>; })}</div>{(scopeReport.equipmentLegend?.length ?? 0) > 0 && <aside className="plan-equipment"><span className="plan-equipment__title">Equipamentos</span>{scopeReport.equipmentLegend.map((eq, legendIndex) => <div className="plan-equipment__item" key={legendIndex}><img src={eq.image} alt={eq.name} /><div><strong>{eq.name}</strong><b>{String(eq.qty).padStart(2, "0")} un</b></div></div>)}</aside>}</div>
        <div className="report-legend">{scopeReport.tools.map((tool) => { const qty = scopeReport.markers.filter((item) => item.type === tool.id).length; return qty > 0 ? <div key={tool.id}><i style={{ background: tool.color }}>{tool.code}</i><span>{tool.label}</span><b>{qty}</b></div> : null; })}</div>
        <PageFooter number={String(2 + solutionPages.length)} />
      </section>}

      {extraPages.map((page, index) => (
        <section className="proposal-page proposal-page--extra" key={page.id}>
          <DottedFrame />
          <div className="solution-heading"><h2>{(page.title || "Página adicional").toLocaleUpperCase("pt-BR")}</h2>{page.subtitle && <p>{page.subtitle}</p>}</div>
          {page.body && <div className="extra-page-body">{page.body.split("\n").filter(Boolean).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>}
          {page.images.length > 0 && <div className={`product-gallery product-gallery--${Math.min(4, page.images.length)}`}>{page.images.map((src, imageIndex) => <img key={imageIndex} src={src} alt={`Imagem ${imageIndex + 1} de ${page.title}`} />)}</div>}
          <PageFooter number={String(afterLocationPage + index)} />
        </section>
      ))}

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
  const [client, setClient] = useState("Cliente / Empreendimento");
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
  const [canvasMode, setCanvasMode] = useState<"marker" | "pan" | "wall" | "room" | "calibrate">("marker");
  const [walls, setWalls] = useState<Array<{ id: number; pts: Array<{ x: number; y: number }>; material: WallMaterial }>>([]);
  const [wallDraft, setWallDraft] = useState<Array<{ x: number; y: number }>>([]);
  // Primeiro canto do cômodo enquanto a ferramenta de sala está sendo usada (2 cliques definem o retângulo).
  const [roomDraft, setRoomDraft] = useState<{ x: number; y: number } | null>(null);
  // Ponto sob o cursor para a prévia elástica das paredes/cômodo (igual ao traçado ao vivo do oficial).
  const [wallPreview, setWallPreview] = useState<{ x: number; y: number } | null>(null);
  const [wallMaterial, setWallMaterial] = useState<WallMaterial>("drywall");
  const [selectedWall, setSelectedWall] = useState<number | null>(null);
  const [draggingVertex, setDraggingVertex] = useState<{ wallId: number; index: number } | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [planPages, setPlanPages] = useState<string[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [calibLine, setCalibLine] = useState<Array<{ x: number; y: number }>>([]);
  const [calibMeters, setCalibMeters] = useState("");
  const panRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const clampZoom = (z: number) => Math.min(6, Math.max(0.3, z));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const finishWall = () => { if (wallDraft.length >= 2) setWalls((w) => [...w, { id: Date.now(), pts: wallDraft, material: wallMaterial }]); setWallDraft([]); setWallPreview(null); };
  // Cria um cômodo retangular fechado (4 paredes) a partir de dois cantos opostos, como a ferramenta de sala do oficial.
  const finishRoom = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x), y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
    setRoomDraft(null); setWallPreview(null);
    if (x2 - x1 < 0.6 || y2 - y1 < 0.6) return;
    const pts = [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }, { x: x1, y: y1 }];
    setWalls((w) => [...w, { id: Date.now(), pts, material: wallMaterial }]);
  };
  const updateWall = (id: number, patch: Partial<{ material: WallMaterial }>) => setWalls((current) => current.map((wall) => wall.id === id ? { ...wall, ...patch } : wall));
  const removeWall = (id: number) => { setWalls((current) => current.filter((wall) => wall.id !== id)); setSelectedWall(null); };
  const moveVertex = (id: number, index: number, point: { x: number; y: number }) => setWalls((current) => current.map((wall) => wall.id === id ? { ...wall, pts: wall.pts.map((pt, i) => i === index ? point : pt) } : wall));
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
  const quickCatalog = useMemo(() => {
    const term = quickSearch.trim().toLocaleLowerCase("pt-BR");
    if (!term) return suggestedCatalog;
    return catalogItems.filter((item) => [item.name, item.brand, item.model, item.sku, item.category].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(term)).slice(0, 12);
  }, [quickSearch, suggestedCatalog, catalogItems]);
  const linkedIds = useMemo(() => new Set(catalogItems.map((item) => item.id)), [catalogItems]);
  const scopeGaps = useMemo(() => {
    const unlinked = markers.filter((point) => !point.catalogItemId);
    const noPrice = markers.filter((point) => point.catalogItemId && !((catalogItems.find((entry) => entry.id === point.catalogItemId)?.salePrice ?? 0) > 0));
    return { unlinked, noPrice };
  }, [markers, catalogItems]);

  useEffect(() => {
    void fetch("/api/budget").then((response) => response.json()).then((data: { catalogItems?: ScopeCatalogItem[] }) => setCatalogItems(data.catalogItems ?? [])).catch(() => setCatalogItems([]));
    const stored = window.localStorage.getItem("sona-scope-draft");
    const timer = window.setTimeout(() => { if (stored) {
      try {
        const draft = JSON.parse(stored) as { tools?: ScopeTool[]; markers?: ScopeMarker[]; assets?: PlanAsset[]; walls?: Array<{ id: number; pts: Array<{ x: number; y: number }>; material?: WallMaterial }>; client?: string; project?: string; address?: string; detectedTools?: string[] };
        if (draft.tools?.length) setTools(draft.tools);
        if (draft.markers?.length) setMarkers(draft.markers.map((item) => ({ ...item, size: item.size || 38, range: item.range || 18 })));
        if (draft.assets) setAssets(draft.assets.map((item) => ({ ...item, rotation: item.rotation ?? 0 })));
        if (draft.walls?.length) setWalls(draft.walls.map((wall) => ({ ...wall, material: wall.material ?? "drywall" })));
        if (draft.client) setClient(draft.client);
        if (draft.project) setProject(draft.project);
        if (draft.address) setAddress(draft.address);
        if (draft.detectedTools) setDetectedTools(draft.detectedTools);
      } catch { /* mantém o projeto seguro */ }
    } }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const editingWalls = canvasMode === "wall" || canvasMode === "room";
    if (!editingWalls) { setSelectedWall(null); setDraggingVertex(null); }
    if (canvasMode !== "wall") setWallDraft([]);
    if (canvasMode !== "room") setRoomDraft(null);
    setWallPreview(null);
  }, [canvasMode]);

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
      x: 12 + (index % 4) * 8, y: 12 + (index % 3) * 9, width: 14, rotation: 0,
    })));
    setAssets((current) => [...current, ...next]);
    setSelectedAsset(next[0]?.id ?? null);
    setSelectedMarker(null);
  };

  const saveScope = () => {
    window.localStorage.setItem("sona-scope-draft", JSON.stringify({ tools, markers, assets, walls, client, project, address, detectedTools }));
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
    const grouped = new Map<string, { category: string; description: string; qty: number; unit: string; unitPrice: number; imageUrl: string }>();
    markers.forEach((point) => {
      const tool = tools.find((entry) => entry.id === point.type) ?? tools[0];
      const key = point.catalogItemId ?? point.type;
      const catalogItem = point.catalogItemId ? catalogItems.find((entry) => entry.id === point.catalogItemId) : undefined;
      const label = catalogItem
        ? [catalogItem.name, [catalogItem.brand, catalogItem.model].filter(Boolean).join(" ")].filter(Boolean).join(" · ")
        : (point.catalogName ?? tool.label);
      const current = grouped.get(key) ?? {
        category: catalogItem?.category || tool.category,
        description: label,
        qty: 0,
        unit: catalogItem?.unit || "un",
        unitPrice: catalogItem?.salePrice ?? 0,
        imageUrl: catalogItem?.imageUrl || "",
      };
      grouped.set(key, { ...current, qty: current.qty + 1 });
    });
    const entries = Array.from(grouped.values());
    const items = entries.map((item, index) => ({ id: index + 1, category: item.category, description: item.description, qty: item.qty, unit: item.unit, unitPrice: item.unitPrice }));
    const itemImages: Record<number, string[]> = {};
    entries.forEach((item, index) => { if (item.imageUrl) itemImages[index + 1] = [item.imageUrl]; });
    const productImages = Array.from(new Set(entries.map((item) => item.imageUrl).filter(Boolean))).slice(0, 3);
    // Fotos das caixas de sonorização por marcador, para a planta da proposta.
    const markerImages: Record<number, string> = {};
    // Legenda de equipamentos usados na planta (modelo + foto + quantidade), como no padrão da proposta.
    const legendMap = new Map<string, { image: string; name: string; qty: number }>();
    markers.forEach((point) => {
      if (point.type !== "audio" || !point.catalogItemId) return;
      const ci = catalogItems.find((entry) => entry.id === point.catalogItemId);
      if (!ci?.imageUrl) return;
      markerImages[point.id] = ci.imageUrl;
      const name = [ci.name, [ci.brand, ci.model].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || ci.name;
      const current = legendMap.get(ci.id) ?? { image: ci.imageUrl, name, qty: 0 };
      legendMap.set(ci.id, { ...current, qty: current.qty + 1 });
    });
    const equipmentLegend = Array.from(legendMap.values());
    onGenerate({ items, client, project, address, planImage, markers, tools, assets, itemImages, productImages, markerImages, equipmentLegend });
  };

  return (
    <div className="scope-workspace">
      <section className="scope-main">
        <div className="scope-heading">
          <div><span className="eyebrow">MAPA DO PROJETO</span><h2>Editor técnico de planta</h2><p>Arraste símbolos e imagens, redimensione os elementos e transforme a legenda em quantitativo.</p></div>
          <div className="scope-actions"><button className="btn btn--ghost" onClick={saveScope}>✓ Salvar</button><button className="btn btn--ghost" onClick={printScope}>↗ Imprimir</button><button className="btn btn--dark" onClick={generateItems} disabled={markers.length === 0}>Gerar proposta <span>→</span></button></div>
        </div>

        <div className="scope-meta">
          <label>Cliente<input value={client} onChange={(e) => setClient(e.target.value)} /></label>
          <label>Projeto<input value={project} onChange={(e) => setProject(e.target.value)} /></label>
          <label>Local<input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <div><small>PONTOS</small><strong>{markers.length}</strong></div>
          <div><small>DISCIPLINAS</small><strong>{totals.length}</strong></div>
        </div>

        {markers.length > 0 && (scopeGaps.unlinked.length > 0 || scopeGaps.noPrice.length > 0) && <div className="scope-warning">
          <span>!</span>
          <p><strong>Revise antes de gerar a proposta</strong><small>{[scopeGaps.unlinked.length ? `${scopeGaps.unlinked.length} ponto(s) sem item do catálogo` : "", scopeGaps.noPrice.length ? `${scopeGaps.noPrice.length} sem preço de venda` : ""].filter(Boolean).join(" · ")} — entram na proposta sem imagem e/ou valor.</small></p>
          {scopeGaps.unlinked.length > 0
            ? <button onClick={() => { setCanvasMode("marker"); setSelectedMarker(scopeGaps.unlinked[0].id); }}>Revisar ponto →</button>
            : <button onClick={() => { setCanvasMode("marker"); setSelectedMarker(scopeGaps.noPrice[0].id); }}>Revisar ponto →</button>}
        </div>}

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
            <div><span className="live-dot" /> PLANTA DE MARCAÇÃO</div><div className="plan-bar-actions"><div className="plan-modes"><button className={canvasMode === "marker" ? "active" : ""} onClick={() => setCanvasMode("marker")} title="Inserir pontos">✛ Marcar</button><button className={canvasMode === "pan" ? "active" : ""} onClick={() => setCanvasMode("pan")} title="Arrastar a planta">✋ Mover</button><button className={canvasMode === "wall" ? "active" : ""} onClick={() => setCanvasMode("wall")} title="Desenhar paredes — clique para traçar, 2 cliques finaliza, clique direito cancela">▟ Parede</button><button className={canvasMode === "room" ? "active" : ""} onClick={() => { setCanvasMode("room"); setRoomDraft(null); }} title="Desenhar um cômodo retangular — clique em dois cantos opostos, clique direito cancela">▭ Cômodo</button><button className={canvasMode === "calibrate" ? "active" : ""} onClick={() => { setCanvasMode("calibrate"); setCalibLine([]); }} title="Calibrar escala: trace uma medida conhecida na planta">📏 Escala</button></div>{(canvasMode === "wall" || canvasMode === "room") && <select className="wall-material" value={wallMaterial} onChange={(event) => setWallMaterial(event.target.value as WallMaterial)} title="Material da parede — define a atenuação real do sinal em dB">{wallMaterials.map((material) => <option key={material.id} value={material.id}>{material.label} · {material.db} dB</option>)}</select>}<div className="plan-zoom"><button onClick={() => setZoom((z) => clampZoom(z / 1.2))} title="Diminuir">−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((z) => clampZoom(z * 1.2))} title="Aumentar">＋</button><button onClick={resetView} title="Ajustar à tela">⤢</button>{walls.length > 0 && <button onClick={() => { setWalls([]); setWallDraft([]); }} title="Limpar paredes">🗑</button>}</div><button className={heatmap ? "active" : ""} onClick={() => setHeatmap((value) => !value)}>◉ Mapa de calor</button><select value={heatBand} onChange={(event) => setHeatBand(event.target.value as "2.4" | "5" | "6")}><option value="2.4">2,4 GHz</option><option value="5">5 GHz</option><option value="6">6 GHz</option></select><label className="plan-scale">Escala<input type="number" min="1" max="80" value={planWidthMeters} onChange={(event) => setPlanWidthMeters(Math.max(1, Number(event.target.value) || 1))} title="Largura real da planta, em metros" /><span>m</span></label><label className="plan-upload"><input type="file" accept="image/*" multiple onChange={(e) => e.target.files && void addOverlayImages(e.target.files)} />＋ Imagens</label><label className="plan-upload"><input type="file" accept="image/*,.pdf,application/pdf" onChange={(e) => e.target.files?.[0] && void loadPlan(e.target.files[0])} />{planImage ? "Trocar planta" : "＋ Carregar planta/PDF"}</label></div>
          </div>
          <div
            className={`plan-canvas plan-canvas--mode-${canvasMode} ${planImage ? "plan-canvas--image" : ""}`}
            ref={canvasRef}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); const point = pointFromEvent(event.clientX, event.clientY); const toolId = event.dataTransfer.getData("sona/tool"); if (point && toolId) addMarkerAt(point.x, point.y, toolId); }}
            onContextMenu={(e) => { if (canvasMode === "wall" && wallDraft.length) { e.preventDefault(); setWallDraft([]); setWallPreview(null); } else if (canvasMode === "room" && roomDraft) { e.preventDefault(); setRoomDraft(null); setWallPreview(null); } }}
            onDoubleClick={() => { if (canvasMode === "wall") finishWall(); }}
            onPointerDown={(e) => { if (canvasMode !== "pan") return; panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ } }}
            onPointerMove={(e) => { if (panRef.current) { setPan({ x: panRef.current.px + (e.clientX - panRef.current.sx), y: panRef.current.py + (e.clientY - panRef.current.sy) }); return; } if ((canvasMode === "wall" && wallDraft.length) || (canvasMode === "room" && roomDraft)) { const p = pointFromEvent(e.clientX, e.clientY); if (p) setWallPreview(p); } }}
            onPointerUp={(e) => { if (panRef.current) { panRef.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ } } }}
            onClick={(e) => {
              if (canvasMode === "pan" || dragging || draggingAsset || resizingMarker || resizingAsset || draggingVertex) return;
              if (canvasMode === "marker" && !selectedTool) { setSelectedMarker(null); setSelectedAsset(null); return; }
              const point = pointFromEvent(e.clientX, e.clientY);
              if (!point) return;
              if (canvasMode === "wall") { if (selectedWall !== null) { setSelectedWall(null); return; } setWallDraft((d) => [...d, point]); setWallPreview(point); return; }
              if (canvasMode === "room") { if (selectedWall !== null) { setSelectedWall(null); return; } if (!roomDraft) { setRoomDraft(point); setWallPreview(point); } else { finishRoom(roomDraft, point); } return; }
              if (canvasMode === "calibrate") { setCalibLine((c) => (c.length >= 2 ? [point] : [...c, point])); return; }
              addMarkerAt(point.x, point.y, selectedTool ?? undefined);
            }}
          >
            {planImage ? <img className="plan-canvas__image" src={planImage} alt="Planta completa do projeto" draggable={false} /> : <DefaultFloorPlan />}
            {heatmap && <WifiHeatLayer aps={markers.filter((item) => item.type === "access-point")} planWidthMeters={planWidthMeters} walls={walls} band={heatBand} />}
            {assets.map((item) => <div key={item.id} className={`plan-asset ${selectedAsset === item.id ? "selected" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, transform: `translate(-50%, -50%) rotate(${item.rotation ?? 0}deg)` }} onPointerDown={(event) => { event.stopPropagation(); setDraggingAsset(item.id); setSelectedAsset(item.id); setSelectedMarker(null); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (draggingAsset !== item.id || resizingAsset === item.id || event.buttons === 0) return; const point = pointFromEvent(event.clientX, event.clientY); if (point) updateAsset(item.id, point); }} onPointerUp={(event) => { event.stopPropagation(); setDraggingAsset(null); event.currentTarget.releasePointerCapture(event.pointerId); }}><img src={item.src} alt={item.name} draggable={false} /><small>{item.name}</small><button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setAssets((current) => current.filter((entry) => entry.id !== item.id)); setSelectedAsset(null); }} aria-label={`Excluir ${item.name}`}>×</button><span className="resize-handle" onPointerDown={(event) => { event.stopPropagation(); setResizingAsset(item.id); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (resizingAsset !== item.id || event.buttons === 0) return; const rect = canvasRef.current?.getBoundingClientRect(); if (rect) updateAsset(item.id, { width: Math.max(5, Math.min(95, item.width + ((event.movementX + event.movementY) / rect.width) * 100)) }); }} onPointerUp={(event) => { event.stopPropagation(); setResizingAsset(null); event.currentTarget.releasePointerCapture(event.pointerId); }} /></div>)}
            <div className="canvas-hint">{canvasMode === "pan" ? "Arraste para mover · use o zoom" : canvasMode === "wall" ? (selectedWall !== null ? "Parede selecionada · troque o material ou arraste os pontos" : `Clique para traçar · 2 cliques finaliza · clique numa parede para editar · material: ${wallMaterials.find((m) => m.id === wallMaterial)?.label ?? ""}`) : canvasMode === "room" ? (selectedWall !== null ? "Cômodo selecionado · troque o material ou arraste os cantos" : roomDraft ? "Clique no canto oposto para fechar o cômodo · clique direito cancela" : `Clique em dois cantos para desenhar um cômodo · material: ${wallMaterials.find((m) => m.id === wallMaterial)?.label ?? ""}`) : selectedTool ? <>Clique para inserir <b>{activeTool.code}</b> · clique novamente na legenda para desmarcar</> : "Nenhuma legenda selecionada · selecione uma para inserir pontos"}</div>
            {heatmap && markers.some((item) => item.type === "access-point") && <div className="wifi-legend" aria-hidden="true"><strong>Sinal em dBm · {heatBand === "2.4" ? "2,4" : heatBand} GHz</strong><span><i style={{ background: "#23a152" }} />Excelente <b>≥ −55</b></span><span><i style={{ background: "#a6dc49" }} />Bom <b>−65</b></span><span><i style={{ background: "#faca39" }} />Regular <b>−73</b></span><span><i style={{ background: "#f47d2f" }} />Fraco <b>−80</b></span><span><i style={{ background: "#cd313d" }} />Ruim <b>&lt; −83</b></span></div>}
            {(walls.length > 0 || wallDraft.length > 0 || roomDraft || calibLine.length > 0) && <svg className="plan-walls" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{walls.map((wall) => { const pointsStr = wall.pts.map((p) => `${p.x},${p.y}`).join(" "); const isSel = selectedWall === wall.id; return <g key={wall.id}>
              <polyline className={`plan-wall ${isSel ? "plan-wall--selected" : ""}`} points={pointsStr} style={{ stroke: wallColor(wall.material) }} />
              {(canvasMode === "wall" || canvasMode === "room") && <polyline className="plan-wall-hit" points={pointsStr} style={{ pointerEvents: "stroke" }} onClick={(event) => { event.stopPropagation(); setWallDraft([]); setRoomDraft(null); setWallPreview(null); setSelectedWall(wall.id); }} />}
              {(canvasMode === "wall" || canvasMode === "room") && isSel && wall.pts.map((pt, index) => <circle key={index} className="plan-wall-node" cx={pt.x} cy={pt.y} r="1.1" style={{ pointerEvents: "auto" }} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.stopPropagation(); setDraggingVertex({ wallId: wall.id, index }); try { (event.currentTarget as SVGCircleElement).setPointerCapture(event.pointerId); } catch { /* noop */ } }} onPointerMove={(event) => { if (!draggingVertex || draggingVertex.wallId !== wall.id || draggingVertex.index !== index || event.buttons === 0) return; const point = pointFromEvent(event.clientX, event.clientY); if (point) moveVertex(wall.id, index, point); }} onPointerUp={(event) => { event.stopPropagation(); setDraggingVertex(null); try { (event.currentTarget as SVGCircleElement).releasePointerCapture(event.pointerId); } catch { /* noop */ } }} />)}
            </g>; })}{wallDraft.length > 0 && <polyline className="plan-walls__draft" points={wallDraft.map((p) => `${p.x},${p.y}`).join(" ")} />}{canvasMode === "wall" && wallDraft.length > 0 && wallPreview && <polyline className="plan-walls__draft" points={`${wallDraft[wallDraft.length - 1].x},${wallDraft[wallDraft.length - 1].y} ${wallPreview.x},${wallPreview.y}`} />}{roomDraft && wallPreview && (() => { const x1 = Math.min(roomDraft.x, wallPreview.x), x2 = Math.max(roomDraft.x, wallPreview.x), y1 = Math.min(roomDraft.y, wallPreview.y), y2 = Math.max(roomDraft.y, wallPreview.y); return <polyline className="plan-walls__draft" points={`${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2} ${x1},${y1}`} />; })()}{calibLine.length > 0 && <polyline className="plan-calib" points={calibLine.map((p) => `${p.x},${p.y}`).join(" ")} />}{calibLine.map((p, i) => <circle key={`c${i}`} className="plan-calib-node" cx={p.x} cy={p.y} r="0.9" />)}</svg>}
            {markers.map((item) => {
              const tool = tools.find((entry) => entry.id === item.type) ?? tools[0];
              const catItem = item.catalogItemId ? catalogItems.find((entry) => entry.id === item.catalogItemId) : undefined;
              // Só na sonorização (áudio): quando o ponto está ligado a uma caixa do catálogo,
              // o marcador mostra a foto real do equipamento (de frente) para demonstrar a distribuição.
              const photo = item.type === "audio" && catItem?.imageUrl ? catItem.imageUrl : "";
              return <button
                key={item.id}
                className={`scope-marker ${photo ? "scope-marker--photo" : ""} ${selectedMarker === item.id ? "selected" : ""}`}
                style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size, ...(photo ? {} : { background: tool.color }) }}
                onClick={(e) => { e.stopPropagation(); setSelectedMarker(item.id); setSelectedAsset(null); }}
                onPointerDown={(e) => { e.stopPropagation(); if (resizingMarker === item.id) return; setDragging(item.id); e.currentTarget.setPointerCapture(e.pointerId); setSelectedMarker(item.id); setSelectedAsset(null); }}
                onPointerMove={(e) => { if (dragging !== item.id || resizingMarker === item.id || e.buttons === 0) return; const point = pointFromEvent(e.clientX, e.clientY); if (point) updateMarker(item.id, point); }}
                onPointerUp={(e) => { e.stopPropagation(); setDragging(null); e.currentTarget.releasePointerCapture(e.pointerId); }}
                title={`${tool.label} · ${item.environment}${catItem ? " · " + catItem.name : ""}`}
              >{photo
                  ? <><img className="scope-marker__photo" src={photo} alt={catItem?.name ?? item.label} draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} /><span className="scope-marker__cap">{item.label}</span></>
                  : <>{item.label}{item.catalogItemId && linkedIds.has(item.catalogItemId) && <i className="scope-marker__linked" aria-hidden="true">✓</i>}</>}
                <span className="resize-handle" onPointerDown={(event) => { event.stopPropagation(); setDragging(null); setResizingMarker(item.id); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (resizingMarker !== item.id || event.buttons === 0) return; updateMarker(item.id, { size: Math.max(26, Math.min(90, item.size + event.movementX)) }); }} onPointerUp={(event) => { event.stopPropagation(); setResizingMarker(null); event.currentTarget.releasePointerCapture(event.pointerId); }} /></button>;
            })}
          </div>
          {planPages.length > 1 && <div className="plan-pages">{planPages.map((src, i) => <button key={i} className={activePage === i ? "active" : ""} onClick={() => { setActivePage(i); setPlanImage(src); }} title={`Página ${i + 1}`}><img src={src} alt={`Página ${i + 1}`} /><span>{i + 1}</span></button>)}</div>}
          {canvasMode === "calibrate" && <div className="calib-panel">{calibLine.length < 2 ? <span>Trace uma medida conhecida na planta ({calibLine.length}/2)</span> : <><label>Distância real<input type="number" min="0.1" step="0.1" value={calibMeters} onChange={(e) => setCalibMeters(e.target.value)} autoFocus /><span>m</span></label><button className="calib-apply" onClick={() => applyCalibration(Number(calibMeters))}>Aplicar</button></>}<button className="calib-cancel" onClick={() => { setCalibLine([]); setCalibMeters(""); }}>Limpar</button></div>}
          {(canvasMode === "wall" || canvasMode === "room") && selectedWall !== null && (() => { const wall = walls.find((entry) => entry.id === selectedWall); if (!wall) return null; return <div className="wall-panel"><span className="wall-panel__dot" style={{ background: wallColor(wall.material) }} /><label>Material<select value={wall.material} onChange={(event) => updateWall(wall.id, { material: event.target.value as WallMaterial })}>{wallMaterials.map((material) => <option key={material.id} value={material.id}>{material.label} · {material.db} dB</option>)}</select></label><span className="wall-panel__hint">Arraste os pontos para ajustar</span><button className="wall-panel__delete" onClick={() => removeWall(wall.id)}>Excluir parede</button><button className="calib-cancel" onClick={() => setSelectedWall(null)}>OK</button></div>; })()}
          {canvasMode === "marker" && marker && <div className="quickpick" onPointerDown={(event) => event.stopPropagation()}>
            <div className="quickpick__head"><strong>Ligar {marker.label} ao catálogo</strong><button onClick={() => setSelectedMarker(null)} aria-label="Fechar">×</button></div>
            <input className="quickpick__search" value={quickSearch} onChange={(event) => setQuickSearch(event.target.value)} placeholder="Buscar equipamento, marca, código…" />
            <div className="quickpick__list">
              {quickCatalog.length ? quickCatalog.map((item) => { const linked = marker.catalogItemId === item.id; return <button key={item.id} className={linked ? "linked" : ""} onClick={() => updateMarker(marker.id, { catalogItemId: item.id, catalogName: item.name, description: `${item.name} · ${[item.brand, item.model].filter(Boolean).join(" ")}`.trim() })}>
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /> : <span className="quickpick__ph">{item.name.slice(0, 1).toUpperCase()}</span>}
                <span className="quickpick__info"><b>{item.name}</b><small>{[item.brand, item.model].filter(Boolean).join(" · ") || item.category}</small></span>
                <span className="quickpick__price">{item.salePrice ? brl.format(item.salePrice) : "—"}<i>{linked ? "✓" : "+"}</i></span>
              </button>; }) : <p className="quickpick__empty">Nenhum item. Cadastre no catálogo ou importe do AVA.</p>}
            </div>
            {marker.catalogItemId && <button className="quickpick__unlink" onClick={() => updateMarker(marker.id, { catalogItemId: undefined, catalogName: undefined })}>Desvincular item</button>}
          </div>}
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
        </> : asset ? <><div className="asset-inspector-preview"><img src={asset.src} alt={asset.name} /></div><label className="field">Nome da imagem<input value={asset.name} onChange={(event) => updateAsset(asset.id, { name: event.target.value })} /></label><label className="field">Tamanho<input type="range" min="5" max="95" value={asset.width} onChange={(event) => updateAsset(asset.id, { width: Number(event.target.value) })} /><small>{asset.width}% da largura da planta</small></label><label className="field">Rotação<input type="range" min="-180" max="180" step="1" value={asset.rotation ?? 0} onChange={(event) => updateAsset(asset.id, { rotation: Number(event.target.value) })} /><small>{asset.rotation ?? 0}°</small></label><div className="asset-rotation-actions"><button type="button" onClick={() => updateAsset(asset.id, { rotation: ((asset.rotation ?? 0) - 90 + 180) % 360 - 180 })}>↶ 90°</button><button type="button" onClick={() => updateAsset(asset.id, { rotation: ((asset.rotation ?? 0) + 90 + 180) % 360 - 180 })}>90° ↷</button><button type="button" onClick={() => updateAsset(asset.id, { rotation: 0 })}>Restaurar</button></div><button className="delete-marker" onClick={() => { setAssets((current) => current.filter((item) => item.id !== asset.id)); setSelectedAsset(null); }}>Excluir imagem</button></> : <div className="inspector-empty"><span>⌖</span><p>Selecione um marcador ou uma imagem para mover, editar, aumentar, diminuir ou excluir.</p></div>}

        <div className="legend-editor">
          <div className="legend-editor__head"><div><span>LEGENDA EDITÁVEL</span><p>Altere nomes, siglas e cores.</p></div><button onClick={() => { const id = `custom-${Date.now()}`; setTools((current) => [...current, { id, code: "X", label: "Novo marcador", color: "#5f6964", category: "Automação" }]); setSelectedTool(id); }}>＋</button></div>
          <div className="legend-list">{tools.map((tool) => <div key={tool.id} className={detectedTools.includes(tool.id) ? "detected" : ""}><input type="color" value={tool.color} onChange={(e) => setTools((current) => current.map((item) => item.id === tool.id ? { ...item, color: e.target.value } : item))} aria-label={`Cor de ${tool.label}`} /><input className="legend-code" value={tool.code} onChange={(e) => setTools((current) => current.map((item) => item.id === tool.id ? { ...item, code: e.target.value.toUpperCase().slice(0, 3) } : item))} aria-label={`Sigla de ${tool.label}`} /><input value={tool.label} onChange={(e) => setTools((current) => current.map((item) => item.id === tool.id ? { ...item, label: e.target.value } : item))} aria-label={`Nome de ${tool.label}`} /><button onClick={() => { setTools((current) => current.filter((item) => item.id !== tool.id)); setMarkers((current) => current.filter((item) => item.type !== tool.id)); }} aria-label={`Excluir ${tool.label}`}>×</button></div>)}</div>
        </div>
      </aside>

      <section className="scope-report" aria-hidden="true">
        <DottedFrame /><div className="word-title"><strong>ESCOPO TÉCNICO</strong><b>{project}</b></div><p className="report-address">{address}</p>
        <div className="report-plan"><div className="report-plan__canvas">{planImage ? <img src={planImage} alt="" /> : <DefaultFloorPlan />}{assets.map((item) => <img className="report-plan__asset" key={item.id} src={item.src} alt="" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, transform: `translate(-50%, -50%) rotate(${item.rotation ?? 0}deg)` }} />)}{markers.map((item) => { const tool = tools.find((entry) => entry.id === item.type) ?? tools[0]; return <span key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size, background: tool.color }}>{item.label}</span>; })}</div></div>
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
