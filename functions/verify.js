export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.token) return json({ error: "missing token" }, 400);

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

    // >>> DEBUG: vrať přesně co poslal Turnstile
    if (!res?.success) {
      return json({
        error: "verification failed",
        codes: res["error-codes"] || null,   // např. "invalid-input-secret", "invalid-input-response", "timeout-or-duplicate", "hostname-mismatch"
        hostname: res.hostname || null
      }, 403);
    }
    // <<< DEBUG END

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
