/**
 * Ověří Turnstile token u Cloudflare API.
 */
async function verifyTurnstileToken(token, secretKey) {
    const verificationURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const response = await fetch(verificationURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    });
    const data = await response.json();
    return data.success;
}

/**
 * Hlavní funkce, která zpracovává požadavky.
 */
export async function onRequestPost(context) {
    try {
        const { env, request } = context;
        const secretKey = env.TURNSTILE_SECRET_KEY;
        const destinationURL = env.DESTINATION_URL;

        const formData = await request.formData();
        const turnstileToken = formData.get('cf-turnstile-response');

        if (!turnstileToken || !secretKey || !destinationURL) {
            console.error("Chyba: Chybí token nebo konfigurační proměnné.");
            return new Response('Chyba konfigurace serveru.', { status: 500 });
        }

        const isValid = await verifyTurnstileToken(turnstileToken, secretKey);

        if (isValid) {
            return new Response(null, {
                status: 302,
                headers: { 'Location': destinationURL, 'Cache-Control': 'no-store' }
            });
        } else {
            return new Response('Ověření selhalo. Jste robot?', { status: 403 });
        }
    } catch (error) {
        console.error("Kritická chyba ve funkci redirect:", error);
        return new Response('Došlo k interní chybě na serveru.', { status: 500 });
    }
}
