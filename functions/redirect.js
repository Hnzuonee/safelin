/**
 * Ověří Turnstile token u Cloudflare API.
 */
async function verifyTurnstileToken(token, secretKey) {
    // ... (tato funkce zůstává stejná)
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
 * Zpracovává POST požadavky, ověří token a přesměruje.
 */
export async function onRequestPost(context) {
    try {
        const formData = await context.request.formData();
        const token = formData.get('cf-turnstile-response');

        const secretKey = context.env.TURNSTILE_SECRET_KEY;
        const destinationURL = context.env.DESTINATION_URL;

        if (!token || !secretKey || !destinationURL) {
            console.error("Chyba: Chybí token nebo konfigurační proměnné na serveru.");
            return new Response('Chyba konfigurace serveru.', { status: 500 });
        }
        
        // Získáme informace o požadavku pro logování
        const requestHeaders = context.request.headers;
        const ip = requestHeaders.get('cf-connecting-ip') || 'N/A';
        const country = requestHeaders.get('cf-ipcountry') || 'N/A';
        const userAgent = requestHeaders.get('user-agent') || 'N/A';

        const isValid = await verifyTurnstileToken(token, secretKey);

        if (isValid) {
            // ✅ ÚSPĚCH: Logujeme platného uživatele
            console.log(`[SUCCESS] Ověření úspěšné. IP: ${ip}, Země: ${country}`);
            
            return new Response(null, {
                status: 302,
                headers: { 'Location': destinationURL, 'Cache-Control': 'no-store' }
            });
        } else {
            // ❌ SELHÁNÍ: Logujeme bota nebo neúspěšný pokus
            console.log(`[BOT DETECTED] Ověření selhalo. IP: ${ip}, Země: ${country}, User-Agent: ${userAgent}`);
            
            return new Response('Ověření selhalo. Jste robot?', { status: 403 });
        }
    } catch (error) {
        console.error("Chyba ve funkci redirect:", error);
        return new Response('Došlo k interní chybě na serveru.', { status: 500 });
    }
}
