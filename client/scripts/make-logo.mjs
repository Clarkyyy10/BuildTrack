// Removes the (near-white) background from a source logo image and writes a
// transparent PNG the app uses everywhere (/buildtrack-logo.png).
//
// Usage:
//   1) Save your image as client/public/logo-source.png (or .jpg/.jpeg/.webp)
//   2) From the client folder run:  npm run logo
//
// The background is removed via a flood fill starting from the image borders,
// so light areas INSIDE the mascot (blueprint, vest stripes) are preserved.

import Jimp from 'jimp';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const pub = path.resolve('public');
const source = readdirSync(pub).find((f) => /^logo-source\.(png|jpe?g|webp)$/i.test(f));

if (!source) {
  console.error('No source found. Save your image as client/public/logo-source.png');
  process.exit(1);
}

const THRESHOLD = 224; // pixels lighter than this (and border-connected) become transparent

const img = await Jimp.read(path.join(pub, source));
const { width, height, data } = img.bitmap;

const isLight = (i) => data[i] >= THRESHOLD && data[i + 1] >= THRESHOLD && data[i + 2] >= THRESHOLD;

const visited = new Uint8Array(width * height);
const stack = [];
const consider = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const p = y * width + x;
  if (visited[p]) return;
  visited[p] = 1;
  if (isLight(p * 4)) stack.push(p);
};

// Seed from all border pixels
for (let x = 0; x < width; x++) { consider(x, 0); consider(x, height - 1); }
for (let y = 0; y < height; y++) { consider(0, y); consider(width - 1, y); }

let cleared = 0;
while (stack.length) {
  const p = stack.pop();
  data[p * 4 + 3] = 0; // transparent
  cleared++;
  const x = p % width;
  const y = (p - x) / width;
  consider(x + 1, y); consider(x - 1, y); consider(x, y + 1); consider(x, y - 1);
}

// Tight-crop to the mascot using per-row/column opaque-pixel density, so a few
// stray edge specks don't prevent a clean crop.
const colCount = new Uint32Array(width);
const rowCount = new Uint32Array(height);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 24) { colCount[x]++; rowCount[y]++; }
  }
}
const colMin = Math.max(3, Math.floor(height * 0.006));
const rowMin = Math.max(3, Math.floor(width * 0.006));
let minX = 0, maxX = width - 1, minY = 0, maxY = height - 1;
while (minX < maxX && colCount[minX] < colMin) minX++;
while (maxX > minX && colCount[maxX] < colMin) maxX--;
while (minY < maxY && rowCount[minY] < rowMin) minY++;
while (maxY > minY && rowCount[maxY] < rowMin) maxY--;
if (maxX > minX && maxY > minY) {
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.05);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  img.crop(minX, minY, maxX - minX + 1, maxY - minY + 1);
}

const out = path.join(pub, 'buildtrack-logo.png');
await img.writeAsync(out);
console.log(`Done. Cleared ${cleared} bg px, cropped to ${img.bitmap.width}x${img.bitmap.height} -> ${out}`);
