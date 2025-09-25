export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const ticket = url.searchParams.get("ticket") || "";

    const parts = ticket.split(".");
    if (parts.length !== 4) return json({ error: "bad ticket" }, 400);

    const [id, issuedAtStr, ttlStr, sig] = parts;
    const payload = `${id}.${issuedAtStr}.${ttlStr}`;
    const expectSig = await hmac(env.SIGNING_SECRET, payload);
    if (sig !== expectSig) return json({ error: "bad signature" }, 403);

    const issuedAt = Number(issuedAtStr) | 0;
    const ttl = Number(ttlStr) | 0;
    const now = Math.floor(Date.now() / 1000);
    if (!issuedAt || !ttl || now > issuedAt + ttl) return json({ error: "expired" }, 403);

    // one-time spotřeba
    const key = `t:${id}`;
    const exists = await env.TICKETS.get(key);
    if (!exists) return json({ error: "already used or unknown" }, 403);
    await env.TICKETS.delete(key);

    const TARGET_URL = env.TARGET_URL || "";
    if (!TARGET_URL) return json({ error: "no target configured" }, 500);

    return new Response(null, { status: 303, headers: { Location: TARGET_URL } });
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

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/,'');
}
