/**
 * Ověří Turnstile token u Cloudflare API.
 */
async function verifyTurnstileToken(token, secretKey) {
    const verificationURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const response = await fetch(verificationURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-urlencoded' },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    });
    const data = await response.json();
    return data.success;
}

/**
 * Zpracovává POST požadavky, ověří token a přesměruje.
 */
export async function onRequestPost(context) {
    try {
        const { env, request } = context;
        const secretKey = env.TURNSTILE_SECRET_KEY;
        const destinationURL = env.DESTINATION_URL;

        const formData = await request.formData();
        const turnstileToken = formData.get('cf-turnstile-response');

        // Pokud chybí jakákoliv klíčová informace, vrátíme chybu
        if (!turnstileToken || !secretKey || !destinationURL) {
            return new Response('Chyba konfigurace nebo chybějící token.', { status: 400 });
        }
        
        const isValid = await verifyTurnstileToken(turnstileToken, secretKey);

        if (isValid) {
            // Úspěch -> Přesměrování
            return new Response(null, {
                status: 302,
                headers: { 'Location': destinationURL, 'Cache-Control': 'no-store' }
            });
        } else {
            // Selhání -> Chyba 403
            return new Response('Ověření selhalo. Jste robot?', { status: 403 });
        }
    } catch (error) {
        // Kritická chyba
        return new Response('Došlo k interní chybě na serveru.', { status: 500 });
    }
}
