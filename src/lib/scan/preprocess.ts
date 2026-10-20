/**
 * Cleans an image for OCR, in the browser. Phone photos are rotated by EXIF,
 * oversized, coloured and often dark-mode; Tesseract reads dark-on-light text
 * at a moderate size best.
 */
const MAX_EDGE = 1600;
const MAX_BYTES = 25 * 1024 * 1024;

export class ScanImageError extends Error {}

export async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  if (!file.type.startsWith("image/")) throw new ScanImageError("That file is not an image.");
  if (file.size > MAX_BYTES) throw new ScanImageError("That image is too large (over 25 MB).");

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the phone's rotation so portrait photos are not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ScanImageError("Couldn't open that image.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  // Small screenshots read better enlarged; text under ~20px tall is where OCR fails.
  const upscale = scale === 1 && Math.max(bitmap.width, bitmap.height) < 900 ? 2 : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale * upscale));
  const height = Math.max(1, Math.round(bitmap.height * scale * upscale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ScanImageError("This browser can't process images.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const image = ctx.getImageData(0, 0, width, height);
  const px = image.data;
  const gray = new Uint8ClampedArray(width * height);
  const histogram = new Uint32Array(256);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const v = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    gray[j] = v;
    histogram[v]++;
  }

  // Contrast stretch between the 1st and 99th percentile so faded text gets full range.
  const total = gray.length;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && (acc += histogram[lo]) < total * 0.01; lo++);
  for (let acc = 0; hi > 0 && (acc += histogram[hi]) < total * 0.01; hi--);
  const range = Math.max(1, hi - lo);
  let sum = 0;
  for (let i = 0; i < gray.length; i++) {
    gray[i] = Math.max(0, Math.min(255, ((gray[i] - lo) * 255) / range));
    sum += gray[i];
  }

  // Dark-mode screenshots: light text on dark. Flip to dark text on light.
  if (sum / gray.length < 110) {
    for (let i = 0; i < gray.length; i++) gray[i] = 255 - gray[i];
  }

  // Camera photos have uneven light, so compare each pixel with its local average.
  const isPhoto = file.type === "image/jpeg" && file.size > 600 * 1024;
  const out = isPhoto ? adaptiveThreshold(gray, width, height) : gray;

  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    px[i] = px[i + 1] = px[i + 2] = out[j];
    px[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Mean-based local threshold using an integral image (fast enough for a phone). */
function adaptiveThreshold(gray: Uint8ClampedArray, w: number, h: number) {
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += gray[y * w + x];
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row;
    }
  }
  const radius = Math.max(8, Math.round(Math.min(w, h) / 16));
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h, y + radius + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w, x + radius + 1);
      const area = (x1 - x0) * (y1 - y0);
      const s = integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1] - integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0];
      out[y * w + x] = gray[y * w + x] * area < s * 0.9 ? 0 : 255;
    }
  }
  return out;
}
