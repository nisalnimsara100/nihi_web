"use client";

/**
 * In-browser OCR with tesseract.js. The engine and English model are served
 * from /tesseract (copied by scripts/copy-tesseract.mjs), so nothing is fetched
 * from a CDN and the image never leaves the device. The library is imported on
 * first use, so only people who press Scan pay the download.
 */
import type { Worker } from "tesseract.js";

export type OcrResult = { text: string; confidence: number };

const IDLE_MS = 60_000;
let workerPromise: Promise<Worker> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let onProgress: ((fraction: number) => void) | null = null;

function getWorker(): Promise<Worker> {
  workerPromise ??= import("tesseract.js")
    .then(({ createWorker, OEM }) =>
      createWorker("eng", OEM.LSTM_ONLY, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract",
        langPath: "/tesseract/lang",
        logger: (m) => {
          if (m.status === "recognizing text") onProgress?.(m.progress);
        },
      }),
    )
    .catch((error) => {
      workerPromise = null;
      throw error;
    });
  return workerPromise;
}

function scheduleIdleStop() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const pending = workerPromise;
    workerPromise = null;
    pending?.then((w) => w.terminate()).catch(() => {});
  }, IDLE_MS);
}

export async function recognize(canvas: HTMLCanvasElement, progress?: (fraction: number) => void): Promise<OcrResult> {
  clearTimeout(idleTimer);
  onProgress = progress ?? null;
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(canvas);
    return { text: data.text, confidence: data.confidence };
  } finally {
    onProgress = null;
    scheduleIdleStop();
  }
}
