export async function onRequestPost(context) {
    try {
        const { env, request } = context;
        const secretKey = env.TURNSTILE_SECRET_KEY;
        const destinationURL = env.DESTINATION_URL;

        const formData = await request.formData();
        const turnstileToken = formData.get('cf-turnstile-response');

        if (!turnstileToken || !secretKey || !destinationURL) {
            return new Response('Chyba konfigurace nebo chybějící token.', { status: 400 });
        }

        const verificationURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const response = await fetch(verificationURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-urlencoded' },
            body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(turnstileToken)}`
        });

        const result = await response.json();

        if (result.success) {
            return new Response(null, {
                status: 302,
                headers: { 'Location': destinationURL, 'Cache-Control': 'no-store' }
            });
        } else {
            return new Response('Ověření selhalo. Jste robot?', { status: 403 });
        }
    } catch (error) {
        return new Response('Došlo k interní chybě na serveru.', { status: 500 });
    }
}
