import { INTEREST_OTHER, THEME_OTHER } from '../lib/pre-register-options';

function getCheckedValues(form: HTMLFormElement, name: string): string[] {
  return [...form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map((el) => el.value);
}

function setFieldError(form: HTMLFormElement, key: string, message: string) {
  const el = form.querySelector(`[data-error-for="${key}"]`);
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
  }
}

function clearErrors(form: HTMLFormElement) {
  form.querySelectorAll('[data-error-for]').forEach((el) => {
    el.textContent = '';
    el.classList.add('hidden');
  });
  const top = form.querySelector('[data-form-error]');
  if (top) {
    top.textContent = '';
    top.classList.add('hidden');
  }
}

function validate(form: HTMLFormElement): boolean {
  clearErrors(form);
  let ok = true;

  const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim() ?? '';
  const name = (form.elements.namedItem('name') as HTMLInputElement)?.value?.trim() ?? '';
  const childrenAges = (form.elements.namedItem('children_ages') as HTMLInputElement)?.value?.trim() ?? '';
  const interests = getCheckedValues(form, 'interests');
  const themes = getCheckedValues(form, 'themes');
  const consent = (form.elements.namedItem('consent') as HTMLInputElement)?.checked === true;
  const interestOther = (form.elements.namedItem('interest_other') as HTMLInputElement)?.value?.trim() ?? '';
  const themeOther = (form.elements.namedItem('theme_other') as HTMLInputElement)?.value?.trim() ?? '';

  if (!email) {
    setFieldError(form, 'email', 'メールアドレスを入力してください');
    ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError(form, 'email', '有効なメールアドレスを入力してください');
    ok = false;
  }

  if (!name) {
    setFieldError(form, 'name', 'お名前を入力してください');
    ok = false;
  }

  if (!childrenAges) {
    setFieldError(form, 'children_ages', 'お子様の年齢を入力してください');
    ok = false;
  }

  if (interests.length === 0) {
    setFieldError(form, 'interests', '1つ以上選択してください');
    ok = false;
  } else if (interests.includes(INTEREST_OTHER) && !interestOther) {
    setFieldError(form, 'interest_other', '「その他」の内容を入力してください');
    ok = false;
  }

  if (themes.length === 0) {
    setFieldError(form, 'themes', '1つ以上選択してください');
    ok = false;
  } else if (themes.includes(THEME_OTHER) && !themeOther) {
    setFieldError(form, 'theme_other', '「その他」の内容を入力してください');
    ok = false;
  }

  const priceRanges = getCheckedValues(form, 'price_ranges');
  const notifications = getCheckedValues(form, 'notifications');
  const usageImages = getCheckedValues(form, 'usage_images');

  if (priceRanges.length === 0) {
    setFieldError(form, 'price_ranges', '1つ以上選択してください');
    ok = false;
  }

  if (notifications.length === 0) {
    setFieldError(form, 'notifications', '1つ以上選択してください');
    ok = false;
  }

  if (usageImages.length === 0) {
    setFieldError(form, 'usage_images', '1つ以上選択してください');
    ok = false;
  }

  if (!consent) {
    setFieldError(form, 'consent', '個人情報の取り扱いに同意してください');
    ok = false;
  }

  return ok;
}

async function loadCsrf(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>('input[name="csrfToken"]');
  if (!input) return;
  const top = form.querySelector('[data-form-error]');
  const showInitError = () => {
    if (top) {
      top.textContent = 'フォームの初期化に失敗しました。ページを再読み込みしてください。';
      top.classList.remove('hidden');
    }
  };

  try {
    const res = await fetch('/api/csrf');
    let data: { token?: string; error?: string } = {};
    try {
      data = (await res.json()) as { token?: string; error?: string };
    } catch {
      /* non-JSON body */
    }

    if (!res.ok) {
      console.warn('[pre-register] /api/csrf failed:', res.status, data.error ?? res.statusText);
      if (res.status === 503 && data.error === 'CSRF is not configured') {
        console.warn(
          '[pre-register] 本番 Worker に CSRF_SECRET（16文字以上）が未設定です。Cloudflare Dashboard の Variables / Secrets か wrangler secret put で登録してください。'
        );
      }
      showInitError();
      return;
    }

    if (!data.token) {
      console.warn('[pre-register] /api/csrf: response had no token');
      showInitError();
      return;
    }

    input.value = data.token;
  } catch (e) {
    console.warn('[pre-register] /api/csrf fetch error:', e);
    showInitError();
  }
}

function main() {
  const form = document.getElementById('pre-register-form');
  if (!form || !(form instanceof HTMLFormElement)) return;

  void loadCsrf(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    if (!validate(form)) return;

    const submitBtn = form.querySelector<HTMLButtonElement>('[data-submit-btn]');
    if (submitBtn?.disabled) return;

    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const children_ages = (form.elements.namedItem('children_ages') as HTMLInputElement).value.trim();
    const interests = getCheckedValues(form, 'interests');
    const themes = getCheckedValues(form, 'themes');
    const notifications = getCheckedValues(form, 'notifications');
    const price_ranges = getCheckedValues(form, 'price_ranges');
    const usage_images = getCheckedValues(form, 'usage_images');
    const interest_other = (form.elements.namedItem('interest_other') as HTMLInputElement).value.trim();
    const theme_other = (form.elements.namedItem('theme_other') as HTMLInputElement).value.trim();
    const csrfToken = (form.elements.namedItem('csrfToken') as HTMLInputElement).value;
    const website = (form.elements.namedItem('website') as HTMLInputElement).value;

    const consentChecked = (form.elements.namedItem('consent') as HTMLInputElement).checked;

    const payload = {
      email,
      name,
      children_ages,
      interests,
      themes,
      notifications,
      price_ranges,
      usage_images,
      interest_other: interest_other || null,
      theme_other: theme_other || null,
      consent: consentChecked,
      csrfToken,
      website,
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      const label = submitBtn.querySelector('[data-submit-label]');
      if (label) label.textContent = '送信中…';
    }

    try {
      const res = await fetch('/api/pre-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || '送信に失敗しました');
      }

      window.location.href = '/thanks';
    } catch (err) {
      const top = form.querySelector('[data-form-error]');
      if (top) {
        top.textContent = err instanceof Error ? err.message : '送信に失敗しました。もう一度お試しください。';
        top.classList.remove('hidden');
      }
      void loadCsrf(form);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
        const label = submitBtn.querySelector('[data-submit-label]');
        if (label) label.textContent = '送信する';
      }
    }
  });
}

main();
