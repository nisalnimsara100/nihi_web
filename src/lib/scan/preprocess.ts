/**
 * Cleans an image for OCR, in the browser. Phone photos are rotated by EXIF,
 * oversized, coloured and often dark-mode; Tesseract reads dark-on-light text
 * at a moderate size best.
 *
 * An image can be read more than one way (a dark-mode SMS needs inverting; a
 * receipt on a dark table must not be), so this returns a few candidate
 * canvases and the caller keeps the best OCR result.
 */
const MAX_EDGE = 2000;
const MAX_BYTES = 25 * 1024 * 1024;

export class ScanImageError extends Error {}

export type Variant = { name: string; canvas: HTMLCanvasElement };

type Gray = { data: Uint8ClampedArray; width: number; height: number };

export async function preprocessImage(file: File): Promise<Variant[]> {
  if (!file.type.startsWith("image/")) throw new ScanImageError("That file is not an image.");
  if (file.size > MAX_BYTES) throw new ScanImageError("That image is too large (over 25 MB).");

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the phone's rotation so portrait photos are not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ScanImageError("Couldn't open that image.");
  }

  // Text under ~20px tall is where OCR fails, so enlarge small images and shrink huge ones.
  const long = Math.max(bitmap.width, bitmap.height);
  const scale = long > MAX_EDGE ? MAX_EDGE / long : long < 1400 ? Math.min(2, 1400 / long) : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ScanImageError("This browser can't process images.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const px = ctx.getImageData(0, 0, width, height).data;
  const gray: Gray = { data: new Uint8ClampedArray(width * height), width, height };
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    gray.data[j] = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
  }

  const stretched = stretch(gray);
  const dark = mean(stretched.data) < 110;
  // Photos (large JPEG/WebP) have uneven light and a background; screenshots are flat.
  const isPhoto = file.type !== "image/png";

  const variants: Variant[] = [];
  if (isPhoto) {
    const paper = cropToPaper(stretched);
    variants.push({ name: "paper", canvas: toCanvas(restretch(paper)) });
    variants.push({ name: "paper-local", canvas: toCanvas(adaptiveThreshold(paper)) });
    // A dark-mode screenshot saved as JPEG has no sheet of paper to find: read it inverted.
    if (dark && paper === stretched) variants.push({ name: "inverted", canvas: toCanvas(invert(stretched)) });
  } else {
    variants.push({ name: dark ? "inverted" : "plain", canvas: toCanvas(dark ? invert(stretched) : stretched) });
    if (dark) variants.push({ name: "plain", canvas: toCanvas(stretched) });
  }
  return variants;
}

function mean(data: Uint8ClampedArray) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  return sum / data.length;
}

/** Contrast stretch between the 1st and 99th percentile so faded text gets the full range. */
function stretch(g: Gray): Gray {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < g.data.length; i++) histogram[g.data[i]]++;
  const total = g.data.length;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && (acc += histogram[lo]) < total * 0.01; lo++);
  for (let acc = 0; hi > 0 && (acc += histogram[hi]) < total * 0.01; hi--);
  const range = Math.max(1, hi - lo);
  const data = new Uint8ClampedArray(total);
  for (let i = 0; i < total; i++) data[i] = ((g.data[i] - lo) * 255) / range;
  return { ...g, data };
}

const restretch = stretch;

function invert(g: Gray): Gray {
  const data = new Uint8ClampedArray(g.data.length);
  for (let i = 0; i < data.length; i++) data[i] = 255 - g.data[i];
  return { ...g, data };
}

/**
 * Finds the bright sheet of paper in a photo and crops to it, so the dark table,
 * fingers and wallet do not confuse the reader. Returns the input when no clear
 * sheet is found.
 */
function cropToPaper(g: Gray): Gray {
  const { data, width: w, height: h } = g;
  const threshold = otsu(data);
  if (threshold < 90) return g;
  const rows = new Uint32Array(h);
  const cols = new Uint32Array(w);
  let bright = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] > threshold) {
        rows[y]++;
        cols[x]++;
        bright++;
      }
    }
  }
  if (bright < w * h * 0.1) return g;
  // A row or column belongs to the paper when a fair share of it is bright.
  const minRow = w * 0.25;
  const minCol = h * 0.15;
  let y0 = 0;
  let y1 = h - 1;
  let x0 = 0;
  let x1 = w - 1;
  while (y0 < h && rows[y0] < minRow) y0++;
  while (y1 > y0 && rows[y1] < minRow) y1--;
  while (x0 < w && cols[x0] < minCol) x0++;
  while (x1 > x0 && cols[x1] < minCol) x1--;
  const margin = Math.round(Math.min(w, h) * 0.015);
  y0 = Math.max(0, y0 - margin);
  y1 = Math.min(h - 1, y1 + margin);
  x0 = Math.max(0, x0 - margin);
  x1 = Math.min(w - 1, x1 + margin);
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  if (cw < w * 0.3 || ch < h * 0.2 || (cw > w * 0.97 && ch > h * 0.97)) return g;
  const out = new Uint8ClampedArray(cw * ch);
  for (let y = 0; y < ch; y++) out.set(data.subarray((y0 + y) * w + x0, (y0 + y) * w + x0 + cw), y * cw);
  return { data: out, width: cw, height: ch };
}

function otsu(data: Uint8ClampedArray) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) hist[data[i]]++;
  const total = data.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

/** Mean-based local threshold using an integral image (fast enough for a phone). */
function adaptiveThreshold(g: Gray): Gray {
  const { data: gray, width: w, height: h } = g;
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += gray[y * w + x];
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row;
    }
  }
  const radius = Math.max(8, Math.round(Math.min(w, h) / 20));
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h, y + radius + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w, x + radius + 1);
      const area = (x1 - x0) * (y1 - y0);
      const s = integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1] - integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0];
      out[y * w + x] = gray[y * w + x] * area < s * 0.88 ? 0 : 255;
    }
  }
  return { data: out, width: w, height: h };
}

function toCanvas(g: Gray): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = g.width;
  canvas.height = g.height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(g.width, g.height);
  for (let i = 0, j = 0; j < g.data.length; i += 4, j++) {
    image.data[i] = image.data[i + 1] = image.data[i + 2] = g.data[j];
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
