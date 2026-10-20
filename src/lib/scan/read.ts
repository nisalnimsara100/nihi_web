"use client";

import { recognize } from "./ocr";
import { parseScan, type ParsedScan } from "./parse";
import { preprocessImage } from "./preprocess";

export type ScanReading = { text: string; results: ParsedScan[] };

/** How much a reading is worth: finding the amount matters most, then the other fields. */
function quality(results: ParsedScan[], confidence: number) {
  const best = results[0];
  let score = confidence / 10;
  if (best.amount.minor !== null) score += 50 + (best.amount.confidence === "high" ? 20 : 0);
  if (best.date.confidence !== "missing") score += 5;
  if (best.merchant.confidence !== "missing") score += 5;
  return score + Math.min(results.length, 5);
}

/**
 * Reads an image the best way for its kind (see preprocess.ts for the variants)
 * and keeps the reading that parses best, stopping early once the amount is clear.
 * Returns null when `isCurrent` turns false (the user started another scan).
 */
export async function readScan(
  file: File,
  today: string,
  onProgress: (fraction: number) => void,
  onReading: () => void,
  isCurrent: () => boolean,
): Promise<ScanReading | null> {
  const variants = await preprocessImage(file);
  if (!isCurrent()) return null;
  onReading();
  let best: (ScanReading & { score: number }) | null = null;
  for (const [i, variant] of variants.entries()) {
    const { text, confidence } = await recognize(variant.canvas, (p) => onProgress((i + p) / variants.length));
    if (!isCurrent()) return null;
    const results = parseScan(text, today);
    const score = quality(results, confidence);
    if (!best || score > best.score) best = { text, results, score };
    if (results[0].amount.confidence === "high" && confidence >= 70) break;
  }
  return best && { text: best.text, results: best.results };
}
