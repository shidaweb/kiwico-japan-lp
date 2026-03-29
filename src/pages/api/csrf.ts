import type { APIRoute } from 'astro';
import { createCsrfToken } from '../../lib/csrf';
import { resolveCsrfSecret } from '../../lib/server-env';

export const prerender = false;

export const GET: APIRoute = async () => {
  const secret = resolveCsrfSecret(import.meta.env.DEV);
  const token = await createCsrfToken(secret);
  if (!token) {
    return new Response(JSON.stringify({ error: 'CSRF is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
