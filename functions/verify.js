export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.token) return json({ error: "missing token" }, 400);

    // 1) Turnstile verify
    const form = new URLSearchParams();
    form.append("secret", env.TURNSTILE_SECRET || "");
    form.append("response", body.token);

    const ip = request.headers.get("cf-connecting-ip") || "";
    if (ip) form.append("remoteip", ip);

    const ver = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form
    });
    const res = await ver.json().catch(() => ({}));
    if (!res?.success) {
      return json({ error: "verification failed" }, 403);
    }

    // 2) Vystav ticket (one-time, TTL ~60s)
    const id = cryptoRandomId();
    const ttl = 60;
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = `${id}.${issuedAt}.${ttl}`;
    const sig = await hmac(env.SIGNING_SECRET, payload);

    await env.TICKETS.put(`t:${id}`, "1", { expirationTtl: ttl });

    return json({ ticket: `${id}.${issuedAt}.${ttl}.${sig}` }, 200);
  } catch (e) {
    return json({ error: "server error" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
function cryptoRandomId() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/,'');
}
