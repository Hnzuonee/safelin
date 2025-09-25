// functions/redirect.js
export async function onRequestPost(context) {
  const { request, env } = context;

  const json = (obj, status = 200, extraHeaders = {}) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        ...extraHeaders
      }
    });

  try {
    const body = await request.formData();
    const token = body.get('cf-turnstile-response');
    const secret = env.TURNSTILE_SECRET_KEY;
    const destinationURL = env.DESTINATION_URL; // single target MVP

    if (!secret) return json({ error: 'Missing TURNSTILE_SECRET_KEY' }, 500);
    if (!destinationURL) return json({ error: 'Missing DESTINATION_URL' }, 500);
    if (!token) return json({ error: 'Missing Turnstile token' }, 400);

    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);

    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });
    const outcome = await verify.json();
    if (!outcome.success) {
      return json({ error: 'Turnstile failed', codes: outcome['error-codes'] || [] }, 403);
    }

    const nonce = crypto.randomUUID();

    if (!env.LINKS_KV) {
      return json({ error: 'Server misconfiguration: missing LINKS_KV binding' }, 500);
    }

    const ttlSeconds = 45;
    await env.LINKS_KV.put(`go:${nonce}`, destinationURL, { expirationTtl: ttlSeconds });

    return json({ ok: true, nonce });
  } catch (e) {
    return json({ error: 'Internal error', details: e?.message || String(e) }, 500);
  }
}
