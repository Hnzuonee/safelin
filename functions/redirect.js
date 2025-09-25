// functions/redirect.js
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Ověření Turnstile (server-to-server)
  const form = new URLSearchParams();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);

  const ip = request.headers.get('cf-connecting-ip') || '';
  if (ip) form.append('remoteip', ip);

  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });

  let result;
  try {
    result = await verify.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Verify parse failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Turnstile failed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Volitelné zpevnění:
  // if (result.hostname !== 'tvuj-web.cz' && result.hostname !== 'tvuj-projekt.pages.dev') {
  //   return new Response('Bad hostname', { status: 403 });
  // }
  // if (typeof result.score === 'number' && result.score < 0.3) {
  //   return new Response('Low score', { status: 403 });
  // }

  // Bezpečný redirect – cílová URL jen v ENV
  return Response.redirect(env.DESTINATION_URL, 302);
}
