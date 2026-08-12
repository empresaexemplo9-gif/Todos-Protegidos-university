// Gera os ícones PNG do app (marca SONA: anel teal sobre fundo escuro),
// sem dependências externas — apenas node:zlib. Rode: node tools/generate-icons.mjs
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([SIGNATURE, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
function draw(N) {
  const buf = Buffer.alloc(N * N * 4);
  const cx = N / 2, cy = N / 2;
  const rOuter = N * 0.33, thick = N * 0.092, rInner = rOuter - thick;
  const inkTop = [46, 57, 63], inkBottom = [22, 27, 30], teal = [14, 189, 158];
  const edge = Math.max(1, N * 0.006);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      const t = y / N;
      let r = inkTop[0] + (inkBottom[0] - inkTop[0]) * t;
      let g = inkTop[1] + (inkBottom[1] - inkTop[1]) * t;
      let b = inkTop[2] + (inkBottom[2] - inkTop[2]) * t;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const insideOuter = 1 - smooth(rOuter - edge, rOuter + edge, d);
      const outsideInner = smooth(rInner - edge, rInner + edge, d);
      const k = insideOuter * outsideInner;
      r += (teal[0] - r) * k;
      g += (teal[1] - g) * k;
      b += (teal[2] - b) * k;
      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = 255;
    }
  }
  return buf;
}

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable.png", 512],
  ["apple-touch-icon.png", 180],
];
for (const [name, size] of targets) {
  writeFileSync(join(outDir, name), encodePng(size, size, draw(size)));
  console.log("gerado", name, `(${size}px)`);
}
