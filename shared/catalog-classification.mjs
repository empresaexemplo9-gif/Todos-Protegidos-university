export const CATALOG_CLASSIFICATION_VERSION = "2026-08-21-v1";

export const CATALOG_CATEGORIES = Object.freeze([
  "Automação",
  "Interruptores e keypads",
  "Sensores",
  "Segurança e CFTV",
  "Rede e infraestrutura",
  "Energia e proteção",
  "Áudio e vídeo",
  "Diversos",
  "Serviço",
]);

const categoryIndex = new Map(CATALOG_CATEGORIES.map((category, index) => [category, index]));

export function normalizeCatalogText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const aliases = new Map([
  ["automacao", "Automação"],
  ["interruptores e keypads", "Interruptores e keypads"],
  ["interruptores", "Interruptores e keypads"],
  ["keypads", "Interruptores e keypads"],
  ["sensores", "Sensores"],
  ["sensor", "Sensores"],
  ["seguranca e cftv", "Segurança e CFTV"],
  ["seguranca", "Segurança e CFTV"],
  ["controle de acesso", "Segurança e CFTV"],
  ["rede e infraestrutura", "Rede e infraestrutura"],
  ["redes wi fi", "Rede e infraestrutura"],
  ["rede", "Rede e infraestrutura"],
  ["infraestrutura", "Rede e infraestrutura"],
  ["energia e protecao", "Energia e proteção"],
  ["protecao de energia", "Energia e proteção"],
  ["energia", "Energia e proteção"],
  ["audio e video", "Áudio e vídeo"],
  ["audio video", "Áudio e vídeo"],
  ["audiovisual", "Áudio e vídeo"],
  ["audio", "Áudio e vídeo"],
  ["home cinema", "Áudio e vídeo"],
  ["som ambiente", "Áudio e vídeo"],
  ["sonorizacao", "Áudio e vídeo"],
  ["cabos e conectividade", "Diversos"],
  ["cabeamento estruturado", "Diversos"],
  ["diversos", "Diversos"],
  ["ava", "Diversos"],
  ["servico", "Serviço"],
  ["servicos", "Serviço"],
  ["instalacao", "Serviço"],
  ["programacao", "Serviço"],
  ["engenharia", "Serviço"],
  ["entrega", "Serviço"],
  ["suporte", "Serviço"],
]);

const serviceCategories = /^(servico|servicos|instalacao|programacao|engenharia|entrega|suporte)$/;
const serviceTerms = /\b(servico|servicos|mao de obra|instalacao|programacao|calibracao|configuracao|comissionamento|treinamento|levantamento|certificacao|manutencao|suporte tecnico|projeto executivo|documentacao as built|visita tecnica)\b/;

// Acessórios e consumíveis têm precedência sobre o sistema ao qual serão ligados.
// Ex.: um cabo HDMI pertence a Diversos, e não a Áudio e vídeo.
const accessoryTerms = /\b(cabo|cabos|fio|fios|cordao|patch cord|patch cable|plug|plugs|conector|conectores|adaptador|adaptadores|ponteira|ponteiras|terminal|terminais|emenda|keystone|pigtail|splitter|balun|chicote|rabicho|acoplador|extensor)\b/;
const connectorInterfaceTerms = /\b(jack|rj45|rj11|rca|hdmi|toslink|fibra optica|cabo optico|optical cable)\b/;
const cableMeasurementTerms = /\b\d+\s*x\s*\d+(?:\s+\d+)?\s*mm(?:2|²)?\b/;
const completeEquipmentTerms = /\b(roteador|router|switch|receiver|amplificador|amplifier|caixa de som|caixa acustica|access point|edgerouter|gateway|controladora|central|modulo|rele|relay|interruptor|keypad|camera|fechadura|sensor)\b/;

const audioVideoTerms = /\b(audio|video|audiovisual|home cinema|multiroom|sonorizacao|caixa de som|caixa acustica|alto falante|speaker|subwoofer|woofer|tweeter|amplificador|amplifier|receiver|soundbar|streamer|projetor|projector|televisao|blu ray|dac)\b/;
const audioVideoBrands = /\b(aat|denon|onkyo|frahm|elac|loud|jbl|soundsmart|sound smart|wave)\b/;
const securityTerms = /\b(camera|cftv|nvr|dvr|alarme|fechadura|interfone|videoporteiro|controle de acesso|biometria|sirene)\b/;
const networkEquipmentTerms = /\b(access point|roteador|router|switch|unifi|ubiquiti|edgerouter|gateway de rede|modulo de rede|rede ethernet|poe|patch panel)\b/;
const networkTerms = /\b(wi fi|wifi|rede|ethernet)\b/;
const energyTerms = /\b(fonte|nobreak|ups|protetor de energia|protecao|filtro de linha|dps|fullprotect|condicionador de energia|transformador|estabilizador)\b/;
const sensorTerms = /\b(sensor|sensoriamento|mmwave|movimento|presenca|fumaca|vazamento|temperatura|umidade)\b/;
const keypadTerms = /\b(interruptor|keypad|tecla|touch switch|espelho keypad|frame keypad|tomada|kp\d|kp\/)/;
const automationTerms = /\b(automacao|modulo|rele|relay|dimmer|dimer|controladora|central de automacao|gateway|controle remoto|zigbee|smartlife|scenario)\b/;

function canonicalCategory(value) {
  const normalized = normalizeCatalogText(value);
  return aliases.get(normalized) ?? "";
}

function identityFor(item) {
  return normalizeCatalogText([
    item?.name,
    item?.brand,
    item?.model,
    item?.sku,
    item?.category,
  ].filter(Boolean).join(" "));
}

export function classifyCatalogItem(item = {}) {
  if (item.kind === "plan-image") return item.category || "Plantas do projeto";

  const categoryText = normalizeCatalogText(item.category);
  const identity = identityFor(item);
  // “sem fio” e “com fio” descrevem conectividade do equipamento, não um fio avulso.
  const accessoryIdentity = identity.replace(/\b(?:sem|com) fio\b/g, "");
  const searchable = normalizeCatalogText([identity, item.description].filter(Boolean).join(" "));
  const system = normalizeCatalogText(item.system);

  if (item.kind === "service" || serviceCategories.test(categoryText) || serviceTerms.test(searchable)) {
    return "Serviço";
  }
  if (categoryText === "cabos e conectividade" || categoryText === "cabeamento estruturado"
    || cableMeasurementTerms.test(accessoryIdentity)
    || accessoryTerms.test(accessoryIdentity)
    || (connectorInterfaceTerms.test(accessoryIdentity) && !completeEquipmentTerms.test(accessoryIdentity))) {
    return "Diversos";
  }
  if (/audio video|audiovisual/.test(system) || audioVideoTerms.test(identity) || audioVideoBrands.test(identity)) {
    return "Áudio e vídeo";
  }
  if (securityTerms.test(identity)) return "Segurança e CFTV";
  if (energyTerms.test(identity)) return "Energia e proteção";
  if (keypadTerms.test(identity)) return "Interruptores e keypads";
  if (sensorTerms.test(identity)) return "Sensores";
  if (networkEquipmentTerms.test(identity)) return "Rede e infraestrutura";
  if (automationTerms.test(identity)) return "Automação";
  if (networkTerms.test(identity)) return "Rede e infraestrutura";

  return canonicalCategory(item.category) || "Diversos";
}

export function normalizeCatalogItem(item = {}) {
  const category = classifyCatalogItem(item);
  if (item.kind === "plan-image") return { ...item, category };
  const kind = category === "Serviço" ? "service" : (item.kind === "service" ? "service" : "equipment");
  return {
    ...item,
    kind,
    category,
    unit: item.unit || (kind === "service" ? "sv" : "un"),
  };
}

export function catalogCategoryRank(value) {
  const canonical = canonicalCategory(value) || value;
  return categoryIndex.get(canonical) ?? CATALOG_CATEGORIES.length;
}

export function compareCatalogItems(a, b) {
  const categoryA = classifyCatalogItem(a);
  const categoryB = classifyCatalogItem(b);
  return catalogCategoryRank(categoryA) - catalogCategoryRank(categoryB)
    || categoryA.localeCompare(categoryB, "pt-BR", { numeric: true })
    || String(a?.name ?? a?.description ?? "").localeCompare(String(b?.name ?? b?.description ?? ""), "pt-BR", { numeric: true });
}

export function normalizeProposalItems(items = []) {
  return items
    .map((item) => ({
      ...item,
      category: classifyCatalogItem({
        kind: item.kind,
        name: item.description || item.name,
        category: item.category,
        brand: item.brand,
        model: item.model,
        sku: item.sku,
        system: item.system,
      }),
    }))
    .sort(compareCatalogItems);
}
