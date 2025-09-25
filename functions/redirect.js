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
        const formData = await context.request.formData();
        const token = formData.get('cf-turnstile-response');

        // Načtení klíčů a cílové URL z proměnných prostředí
        const secretKey = context.env.TURNSTILE_SECRET_KEY;
        const destinationURL = context.env.DESTINATION_URL; // ZMĚNA ZDE

        if (!token || !secretKey) {
            return new Response('Chybí token nebo serverový klíč.', { status: 400 });
        }

        // Kontrola, zda je cílová URL nastavena na serveru
        if (!destinationURL) {
            console.error("Chyba: Proměnná prostředí DESTINATION_URL není nastavena.");
            return new Response('Chyba konfigurace serveru.', { status: 500 });
        }

        const isValid = await verifyTurnstileToken(token, secretKey);

        if (isValid) {
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
