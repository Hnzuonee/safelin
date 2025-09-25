// functions/redirect.ts (Cloudflare Pages Functions)
export const onRequestGet: PagesFunction<{
  TURNSTILE_SECRET: string,
  DESTINATION_URL: string
}> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
  }

  // Ověření Turnstile server-to-server
  const form = new URLSearchParams();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  const ip = request.headers.get('cf-connecting-ip') || '';
  if (ip) form.append('remoteip', ip);

  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form
  });
  const result = await verify.json();

  if (!result.success) {
    // Volitelně zalogovat result, score, error-codes
    return new Response(JSON.stringify({ error: 'Turnstile failed' }), { status: 403 });
  }

  // Doplňkové kontroly — hostname/action/score/age
  // if (result.hostname !== 'tvoje-domena.cz') return new Response('Bad hostname', { status: 403 });

  // Tady NIKDY neposílej cílové URL v JSON — přímo redirect:
  return Response.redirect(env.DESTINATION_URL, 302);
};
