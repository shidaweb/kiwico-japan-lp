/** Best-effort per-instance rate limit (suitable for serverless cold starts). */
const hits = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let arr = hits.get(ip) ?? [];
  arr = arr.filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_REQUESTS) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}
