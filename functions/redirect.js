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
 * Zpracovává POST požadavky, ověří token, zaloguje výsledek a přesměruje.
 */
export async function onRequestPost(context) {
    const { env, request } = context;
    const secretKey = env.TURNSTILE_SECRET_KEY;
    const destinationURL = env.DESTINATION_URL;

    try {
        if (!secretKey || !destinationURL) {
            console.error("Chyba: Chybí konfigurační proměnné na serveru.");
            return new Response('Chyba konfigurace serveru.', { status: 500 });
        }
        
        const formData = await request.formData();
        const turnstileToken = formData.get('cf-turnstile-response');

        if (!turnstileToken) {
            console.log(`[BOT DETECTED] Pokus o přístup bez tokenu.`);
            return new Response('Chybí ověřovací token.', { status: 403 });
        }
        
        const headers = request.headers;
        const ip = headers.get('cf-connecting-ip') || 'N/A';
        const country = headers.get('cf-ipcountry') || 'N/A';
        const userAgent = headers.get('user-agent') || 'N/A';

        const isValid = await verifyTurnstileToken(turnstileToken, secretKey);

        if (isValid) {
            console.log(`[SUCCESS] Ověření úspěšné. IP: ${ip}, Země: ${country}`);
            return new Response(null, {
                status: 302,
                headers: { 'Location': destinationURL, 'Cache-Control': 'no-store' }
            });
        } else {
            console.log(`[BOT DETECTED] Neplatný token. IP: ${ip}, Země: ${country}, User-Agent: ${userAgent}`);
            return new Response('Ověření selhalo. Jste robot?', { status: 403 });
        }
    } catch (error) {
        console.error("Kritická chyba ve funkci redirect:", error.message);
        // TADY BYL PŘEKLEP "Do k"
        return new Response('Došlo k interní chybě na serveru.', { status: 500 });
    }
}
