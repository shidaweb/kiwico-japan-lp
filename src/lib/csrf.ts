function randomHex(byteLength: number): string {
  const u8 = new Uint8Array(byteLength);
  crypto.getRandomValues(u8);
  return [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function utf8ToBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(out);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createCsrfToken(secret: string | null): Promise<string | null> {
  if (!secret) return null;
  const nonce = randomHex(16);
  const exp = Date.now() + 60 * 60 * 1000;
  const payload = `${nonce}.${exp}`;
  const sig = await hmacSha256Hex(secret, payload);
  return utf8ToBase64Url(`${payload}.${sig}`);
}

export async function verifyCsrfToken(token: unknown, secret: string | null): Promise<boolean> {
  if (typeof token !== 'string' || !token || !secret) return false;
  let decoded: string;
  try {
    decoded = base64UrlToUtf8(token);
  } catch {
    return false;
  }
  const parts = decoded.split('.');
  if (parts.length !== 3) return false;
  const [nonce, expStr, sig] = parts;
  if (!nonce || !expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${nonce}.${expStr}`;
  const expected = await hmacSha256Hex(secret, payload);
  return timingSafeEqualHex(sig, expected);
}
