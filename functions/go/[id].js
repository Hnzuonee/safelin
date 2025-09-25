// functions/go/[id].js
export async function onRequestGet(context) {
  const { params, env } = context;
  const id = params?.id;

  const text = (t, status = 400) =>
    new Response(t, {
      status,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      }
    });

  if (!id) return text('Missing id', 400);

  const key = `go:${id}`;
  const url = await env.LINKS_KV.get(key);
  if (!url) return text('Link expired or invalid', 410);

  await env.LINKS_KV.delete(key);
  return Response.redirect(url, 303);
}
