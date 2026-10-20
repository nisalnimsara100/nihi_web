// Copies the OCR engine into public/tesseract so the browser loads it from our
// own origin instead of a CDN. Runs after `npm install`. The output is
// generated, so it is git-ignored.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "tesseract");
const core = join(root, "node_modules", "tesseract.js-core");
const worker = join(root, "node_modules", "tesseract.js", "dist", "worker.min.js");
const lang = join(root, "node_modules", "@tesseract.js-data", "eng", "4.0.0_best_int", "eng.traineddata.gz");

if (![core, worker, lang].every(existsSync)) {
  console.warn("copy-tesseract: OCR packages not installed yet, skipping.");
  process.exit(0);
}

mkdirSync(join(out, "lang"), { recursive: true });
cpSync(worker, join(out, "worker.min.js"));
cpSync(lang, join(out, "lang", "eng.traineddata.gz"));
// NiHi uses the LSTM engine only; the other builds are never requested.
for (const file of readdirSync(core)) {
  if (file.includes("-lstm") && !file.endsWith(".map")) cpSync(join(core, file), join(out, file));
}
console.log("copy-tesseract: engine copied to public/tesseract");
