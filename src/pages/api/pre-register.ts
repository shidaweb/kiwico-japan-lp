import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyCsrfToken } from '../../lib/csrf';
import { readEnv, resolveCsrfSecret } from '../../lib/server-env';
import { escapeHtml } from '../../lib/html-escape';
import {
  INTEREST_CHOICES,
  INTEREST_OTHER,
  NOTIFICATION_CHOICES,
  PRICE_CHOICES,
  THEME_CHOICES,
  THEME_OTHER,
  USAGE_CHOICES,
} from '../../lib/pre-register-options';
import { isRateLimited } from '../../lib/rate-limit';

export const prerender = false;

const MAX_LEN = {
  email: 320,
  name: 200,
  children_ages: 2000,
  other: 2000,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function normalizeStrings(arr: unknown, allowed: readonly string[]): string[] | null {
  if (!Array.isArray(arr)) return null;
  const out: string[] = [];
  for (const x of arr) {
    if (typeof x !== 'string') return null;
    if (!allowed.includes(x)) return null;
    out.push(x);
  }
  return [...new Set(out)];
}

function optionalOne(value: unknown, allowed: readonly string[]): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  if (!allowed.includes(value)) return null;
  return value;
}

function clip(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max);
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    return new Response(JSON.stringify({ error: 'Invalid content type' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'しばらく時間をおいて再度お試しください' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: 'リクエストの形式が正しくありません' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const honeypot = body.website;
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return new Response(JSON.stringify({ error: '送信に失敗しました' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const csrfSecret = resolveCsrfSecret(import.meta.env.DEV);
  if (!(await verifyCsrfToken(body.csrfToken, csrfSecret))) {
    return new Response(JSON.stringify({ error: 'セッションの有効期限が切れました。ページを再読み込みしてください。' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = readEnv('SUPABASE_URL');
  const supabaseKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = readEnv('RESEND_API_KEY');

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    return new Response(JSON.stringify({ error: 'サーバー設定が完了していません' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const emailRaw = typeof body.email === 'string' ? body.email.trim() : '';
  const nameRaw = typeof body.name === 'string' ? body.name.trim() : '';
  const childrenAgesRaw = typeof body.children_ages === 'string' ? body.children_ages.trim() : '';
  const interestOtherRaw =
    typeof body.interest_other === 'string' ? body.interest_other.trim() : '';
  const themeOtherRaw = typeof body.theme_other === 'string' ? body.theme_other.trim() : '';

  const interests = normalizeStrings(body.interests, INTEREST_CHOICES);
  const themes = normalizeStrings(body.themes, THEME_CHOICES);
  let notifications: string[];
  if (body.notifications === undefined || body.notifications === null) {
    notifications = [];
  } else {
    const n = normalizeStrings(body.notifications, NOTIFICATION_CHOICES);
    if (!n) {
      return new Response(JSON.stringify({ error: '案内希望の選択が不正です' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    notifications = n;
  }
  const priceRange = optionalOne(body.price_range, PRICE_CHOICES);
  const usageImage = optionalOne(body.usage_image, USAGE_CHOICES);
  const consent = body.consent === true;

  if (!emailRaw || !nameRaw || !childrenAgesRaw || !interests?.length || !themes?.length || !consent) {
    return new Response(JSON.stringify({ error: '必須項目を入力してください' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!EMAIL_RE.test(emailRaw)) {
    return new Response(JSON.stringify({ error: '有効なメールアドレスを入力してください' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (emailRaw.length > MAX_LEN.email || nameRaw.length > MAX_LEN.name || childrenAgesRaw.length > MAX_LEN.children_ages) {
    return new Response(JSON.stringify({ error: '入力が長すぎます' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (interests.includes(INTEREST_OTHER) && !interestOtherRaw) {
    return new Response(JSON.stringify({ error: '「その他」の内容を入力してください' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (themes.includes(THEME_OTHER) && !themeOtherRaw) {
    return new Response(JSON.stringify({ error: '「その他」の内容を入力してください' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (interestOtherRaw.length > MAX_LEN.other || themeOtherRaw.length > MAX_LEN.other) {
    return new Response(JSON.stringify({ error: '入力が長すぎます' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = clip(emailRaw, MAX_LEN.email);
  const name = clip(nameRaw, MAX_LEN.name);
  const children_ages = clip(childrenAgesRaw, MAX_LEN.children_ages);
  const interest_other = interestOtherRaw ? clip(interestOtherRaw, MAX_LEN.other) : null;
  const theme_other = themeOtherRaw ? clip(themeOtherRaw, MAX_LEN.other) : null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const resend = new Resend(resendKey);

  const ua = request.headers.get('user-agent') ?? null;

  const { data: row, error: dbError } = await supabase
    .from('pre_registrations')
    .insert({
      email,
      name,
      children_ages,
      interests,
      interest_other,
      themes,
      theme_other,
      price_range: priceRange,
      notifications,
      usage_image: usageImage,
      consent,
      ip_address: ip,
      user_agent: ua,
    })
    .select('created_at')
    .single();

  if (dbError || !row) {
    console.error('Supabase insert error:', dbError);
    return new Response(JSON.stringify({ error: 'データの保存に失敗しました' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const interestsStr = interests.join('、');
  const themesStr = themes.join('、');
  const notificationsStr = notifications.length ? notifications.join('、') : '未選択';
  const createdJa = new Date(row.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  const e = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    children_ages: escapeHtml(children_ages),
    interestsStr: escapeHtml(interestsStr),
    themesStr: escapeHtml(themesStr),
    interest_other: interest_other ? escapeHtml(interest_other) : '',
    theme_other: theme_other ? escapeHtml(theme_other) : '',
    price_range: escapeHtml(priceRange ?? '未回答'),
    usage_image: escapeHtml(usageImage ?? '未回答'),
    notificationsStr: escapeHtml(notificationsStr),
    createdJa: escapeHtml(createdJa),
  };

  const userHtml = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">${e.name} 様</h2>
  <p>KiwiCo Japan に事前登録いただき、ありがとうございます！</p>
  <p>ご登録内容を以下の通り受け付けました。</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">お名前</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.name}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">メールアドレス</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.email}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">お子様の年齢</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.children_ages}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">興味のある点</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.interestsStr}${e.interest_other ? `<br>（その他: ${e.interest_other}）` : ''}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">関心テーマ</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.themesStr}${e.theme_other ? `<br>（その他: ${e.theme_other}）` : ''}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">価格帯</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.price_range}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">ご利用イメージ</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.usage_image}</td></tr>
  </table>
  <p>サービス開始時期が決まり次第、優先的にご案内いたします。<br>今しばらくお待ちください。</p>
  <p style="margin-top: 30px; color: #666;">KiwiCo Japan チーム<br><a href="https://kiwicojp.com" style="color: #16a34a;">https://kiwicojp.com</a></p>
</div>`;

  const adminHtml = `
<div style="font-family: sans-serif;">
  <h2>新しい事前登録がありました</h2>
  <ul>
    <li><strong>名前:</strong> ${e.name}</li>
    <li><strong>メール:</strong> ${e.email}</li>
    <li><strong>子供の年齢:</strong> ${e.children_ages}</li>
    <li><strong>興味:</strong> ${e.interestsStr}${e.interest_other ? `（その他: ${e.interest_other}）` : ''}</li>
    <li><strong>テーマ:</strong> ${e.themesStr}${e.theme_other ? `（その他: ${e.theme_other}）` : ''}</li>
    <li><strong>価格帯:</strong> ${e.price_range}</li>
    <li><strong>案内希望:</strong> ${e.notificationsStr}</li>
    <li><strong>利用イメージ:</strong> ${e.usage_image}</li>
    <li><strong>登録日時:</strong> ${e.createdJa}</li>
  </ul>
</div>`;

  const subjectSafe = (s: string) => s.replace(/[\r\n\u0000]+/g, ' ').trim().slice(0, 120);

  const [userSend, adminSend] = await Promise.all([
    resend.emails.send({
      from: 'KiwiCo Japan <noreply@kiwicojp.com>',
      to: email,
      subject: '【KiwiCo Japan】事前登録ありがとうございます',
      html: userHtml,
    }),
    resend.emails.send({
      from: 'KiwiCo Japan <noreply@kiwicojp.com>',
      to: 'nori@kiwico.com',
      subject: `【新規事前登録】${subjectSafe(name)}様 (${subjectSafe(email)})`,
      html: adminHtml,
    }),
  ]);

  if (userSend.error || adminSend.error) {
    console.error('Resend error:', userSend.error ?? adminSend.error);
    return new Response(JSON.stringify({ error: '確認メールの送信に失敗しました。時間をおいて再度お試しください。' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
