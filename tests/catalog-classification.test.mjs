import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyCatalogItem,
  normalizeCatalogItem,
  normalizeProposalItems,
} from "../shared/catalog-classification.mjs";

const classify = (name, category = "Diversos", system = "AUTOMAÇÃO", kind = "equipment", brand = "") =>
  classifyCatalogItem({ name, category, system, kind, brand });

test("todos os serviços convergem para uma categoria única", () => {
  assert.equal(classify("Instalação de home cinema", "Áudio e vídeo", "VETRA", "service"), "Serviço");
  assert.equal(classify("Calibração de áudio e vídeo", "Áudio e vídeo", "VETRA", "service"), "Serviço");
  assert.equal(classify("Programação Scenario", "Programação", "SCENARIO"), "Serviço");
  assert.equal(normalizeCatalogItem({ name: "Configuração de rede", kind: "equipment", category: "Redes Wi-Fi" }).kind, "service");
});

test("cabos, fios, plugs, conectores e adaptadores sempre ficam em Diversos", () => {
  assert.equal(classify("Cabo HDMI 2.1 UHD 8K", "Áudio e vídeo", "ÁUDIO/VÍDEO"), "Diversos");
  assert.equal(classify("PATCH CORD U/UTP CAT6", "Rede e infraestrutura", "WI-FI"), "Diversos");
  assert.equal(classify("Adaptador óptico Toslink", "Áudio e vídeo", "ÁUDIO/VÍDEO"), "Diversos");
  assert.equal(classify("Conector RJ45 blindado", "Rede e infraestrutura"), "Diversos");
  assert.equal(classify("Adaptador HDMI para receiver", "Áudio e vídeo"), "Diversos");
  assert.equal(classify("Ponteira para cabo", "AVA"), "Diversos");
  assert.equal(classify("AAT CLASSIC - 2 x 2.5 mm² - 150m", "Diversos", "AUTOMAÇÃO", "equipment", "AAT"), "Diversos");
  assert.equal(classify("Roteador com 4 portas RJ45", "Rede e infraestrutura"), "Rede e infraestrutura");
  assert.equal(classify("Roteador digital com conexão com fio", "Rede e infraestrutura"), "Rede e infraestrutura");
});

test("equipamentos de áudio e vídeo são corrigidos mesmo quando vieram como Diversos", () => {
  assert.equal(classify("RECEIVER ONKYO TX-RZ30"), "Áudio e vídeo");
  assert.equal(classify("DENON AVR-S770H"), "Áudio e vídeo");
  assert.equal(classify("AAT Q5-50B (BRANCA) G2", "Diversos", "AUTOMAÇÃO", "equipment", "AAT"), "Áudio e vídeo");
  assert.equal(classify("Caixa acústica de embutir"), "Áudio e vídeo");
});

test("demais famílias técnicas recebem sua classificação funcional", () => {
  assert.equal(classify("Câmera Wi-Fi Full Color"), "Segurança e CFTV");
  assert.equal(classify("Switch PoE 16 portas"), "Rede e infraestrutura");
  assert.equal(classify("Filtro de linha com 6 tomadas", "Interruptores e keypads"), "Energia e proteção");
  assert.equal(classify("Sensor Zigbee mmWave"), "Sensores");
  assert.equal(classify("Keypad Scenario 6 botões"), "Interruptores e keypads");
  assert.equal(classify("Módulo relé Scenario"), "Automação");
  assert.equal(classify("EDGEROUTER X ER-X PORTAS RJ45", "Rede e infraestrutura"), "Rede e infraestrutura");
  assert.equal(classify("Hub Zigbee Wi-Fi sem fio", "Rede e infraestrutura"), "Automação");
  assert.equal(classify("Keypad Scenario 4 relés Wi-Fi", "Rede e infraestrutura"), "Interruptores e keypads");
});

test("imagens do projeto não entram na classificação comercial", () => {
  assert.equal(classifyCatalogItem({ kind: "plan-image", category: "Plantas do projeto", name: "Cabo na planta" }), "Plantas do projeto");
});

test("itens da proposta são normalizados e ordenados por família", () => {
  const result = normalizeProposalItems([
    { id: 1, category: "Instalação", description: "Instalação do sistema" },
    { id: 2, category: "Cabos e conectividade", description: "Cabo HDMI" },
    { id: 3, category: "Diversos", description: "Receiver Denon" },
    { id: 4, category: "Automação", description: "Módulo relé" },
  ]);
  assert.deepEqual(result.map((item) => item.category), ["Automação", "Áudio e vídeo", "Diversos", "Serviço"]);
});
