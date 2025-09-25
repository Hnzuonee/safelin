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
 * Zpracovává POST požadavky z formuláře, ověří token a přesměruje.
 */
export async function onRequestPost(context) {
    try {
        // ZMĚNA ZDE: Načítáme data z formuláře místo JSON
        const formData = await context.request.formData();
        const token = formData.get('cf-turnstile-response'); // Název políčka je dán Cloudflarem
        
        const secretKey = context.env.TURNSTILE_SECRET_KEY;

        if (!token || !secretKey) {
            return new Response('Chybí token nebo serverový klíč.', { status: 400 });
        }

        const isValid = await verifyTurnstileToken(token, secretKey);

        if (isValid) {
            const destinationURL = "https://onlyfans.com/jentvojekiks/c9";
            return new Response(null, {
                status: 302,
                headers: { 'Location': destinationURL, 'Cache-Control': 'no-store' }
            });
        } else {
            return new Response('Ověření selhalo. Jste robot?', { status: 403 });
        }
    } catch (error) {
        console.error("Chyba ve funkci redirect:", error);
        return new Response('Došlo k interní chybě na serveru.', { status: 500 });
    }
}
