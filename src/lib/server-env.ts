/**
 * Read secrets/config in Cloudflare Workers (Pages), Astro dev, or Node fallback.
 * Prefer `cloudflare:workers` env (populated from `.dev.vars` locally and dashboard in production).
 */
import { env as cfEnv } from 'cloudflare:workers';

export function readEnv(key: string): string | undefined {
  const fromCf = (cfEnv as Record<string, unknown>)[key];
  if (typeof fromCf === 'string' && fromCf.length > 0) return fromCf;

  const fromMeta = (import.meta.env as Record<string, string | undefined>)[key];
  if (typeof fromMeta === 'string' && fromMeta.length > 0) return fromMeta;

  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

export function resolveCsrfSecret(isDev: boolean): string | null {
  const s = readEnv('CSRF_SECRET');
  if (s && s.length >= 16) return s;
  if (isDev) return 'astro-dev-csrf-insecure-do-not-use-in-prod';
  return null;
}
