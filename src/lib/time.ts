/** Whole days from now until an ISO timestamp, rounded up. Zero or less means it has passed. */
export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function hasPassed(iso: string) {
  return new Date(iso).getTime() < Date.now();
}
