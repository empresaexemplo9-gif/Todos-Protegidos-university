// Armazenamento local em arquivo JSON (sem banco externo).
// Tudo fica em data/sona-data.json, dentro da própria pasta do projeto.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const dataDir = join(root, "data");
const dataFile = join(dataDir, "sona-data.json");

const empty = () => ({
  users: [],
  catalogItems: [],
  budgets: [],
  budgetItems: [],
  proposals: [],
  meta: {},
});

let cache = null;
let writing = Promise.resolve();

export async function getData() {
  if (cache) return cache;
  try {
    const raw = await readFile(dataFile, "utf8");
    cache = { ...empty(), ...JSON.parse(raw) };
  } catch {
    cache = empty();
  }
  return cache;
}

export async function saveData(data) {
  cache = data;
  await mkdir(dataDir, { recursive: true });
  const tmp = `${dataFile}.tmp`;
  // Serializa as gravações para evitar corrupção em escritas concorrentes.
  writing = writing.then(async () => {
    await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await rename(tmp, dataFile); // libuv sobrescreve o destino no Windows
  });
  await writing;
}

// Lê, aplica a função de mutação e persiste. Retorna o valor da função.
export async function mutate(fn) {
  const data = await getData();
  const result = await fn(data);
  await saveData(data);
  return result;
}
