export async function onRequestPost({ request, env }) {
  try {
    // --- sanity checks na env/bindings ---
    if (!env.TURNSTILE_SECRET) {
      return json({ error: "server_misconfig", reason: "TURNSTILE_SECRET missing in Pages env" }, 500);
    }
    if (!env.SIGNING_SECRET) {
      return json({ error: "server_misconfig", reason: "SIGNING_SECRET missing in Pages env" }, 500);
    }
    if (!env.TICKETS || !env.TICKETS.put) {
      return json({ error: "server_misconfig", reason: "KV binding TICKETS is not configured/bound" }, 500);
    }

    const body = await request.json().catch(() => null);
    if (!body?.token) return json({ error: "missing token" }, 400);

    // 1) Turnstile verify
    const form = new URLSearchParams();
    form.append("secret", env.TURNSTILE_SECRET);
    form.append("response", body.token);
    const ip = request.headers.get("cf-connecting-ip") || "";
    if (ip) form.append("remoteip", ip);

    let res;
    try {
      const ver = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: form
      });
      res = await ver.json();
    } catch (e) {
      return json({ error: "verify_request_failed", detail: String(e) }, 502);
    }

    if (!res?.success) {
      return json({
        error: "verification_failed",
        codes: res["error-codes"] || null,
        hostname: res.hostname || null
      }, 403);
    }

    // 2) vystavit one-time ticket (KV + TTL)
    const id = cryptoRandomId();
    const ttl = 60;
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = `${id}.${issuedAt}.${ttl}`;

    let sig;
    try {
      sig = await hmac(env.SIGNING_SECRET, payload);
    } catch (e) {
      return json({ error: "signing_failed", detail: String(e) }, 500);
    }

    try {
      await env.TICKETS.put(`t:${id}`, "1", { expirationTtl: ttl });
    } catch (e) {
      return json({ error: "kv_put_failed", detail: String(e) }, 500);
    }

    return json({ ticket: `${id}.${issuedAt}.${ttl}.${sig}` }, 200);
  } catch (e) {
    return json({ error: "server_error", detail: String(e) }, 500);
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
