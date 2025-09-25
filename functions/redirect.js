// Pomocná funkce pro posílání logů do Better Stacku
async function logToBetterStack(token, logData) {
    try {
        await fetch(token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...logData,
                // Přidáme timestamp pro přesné časové řazení
                dt: new Date().toISOString()
            })
        });
    } catch (e) {
        // Pokud by selhalo odeslání logu, zalogujeme chybu alespoň do Cloudflare
        console.error('Chyba při odesílání logu do Better Stack:', e.message);
    }
}

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
 * Hlavní funkce, která zpracovává požadavky.
 */
export async function onRequestPost(context) {
    // Načtení všech potřebných proměnných
    const { env, request } = context;
    const secretKey = env.TURNSTILE_SECRET_KEY;
    const destinationURL = env.DESTINATION_URL;
    const logtailToken = env.LOGTAIL_SOURCE_TOKEN; // Token pro logování

    try {
        const formData = await request.formData();
        const turnstileToken = formData.get('cf-turnstile-response');

        if (!turnstileToken || !secretKey || !destinationURL) {
            console.error("Chyba: Chybí token nebo konfigurační proměnné.");
            return new Response('Chyba konfigurace serveru.', { status: 500 });
        }

        // Získání informací o požadavku pro logování
        const headers = request.headers;
        const ip = headers.get('cf-connecting-ip') || 'N/A';
        const country = headers.get('cf-ipcountry') || 'N/A';
        const userAgent = headers.get('user-agent') || 'N/A';

        const isValid = await verifyTurnstileToken(turnstileToken, secretKey);
        
        // Připravíme data pro log, která pošleme vždy
        const logData = {
            ip: ip,
            country: country,
            userAgent: userAgent,
        };

        if (isValid) {
            // ✅ ÚSPĚCH
            if (logtailToken) {
                logToBetterStack(logtailToken, { ...logData, message: "Ověření úspěšné", status: "SUCCESS" });
            }
            return new Response(null, { status: 302, headers: { 'Location': destinationURL, 'Cache-Control': 'no-store' }});
        } else {
            // ❌ SELHÁNÍ
            if (logtailToken) {
                logToBetterStack(logtailToken, { ...logData, message: "Ověření selhalo - BOT DETECTED", status: "FAILURE" });
            }
            return new Response('Ověření selhalo. Jste robot?', { status: 403 });
        }
    } catch (error) {
        console.error("Kritická chyba ve funkci redirect:", error);
        if (logtailToken) {
            logToBetterStack(logtailToken, { message: `Kritická chyba: ${error.message}`, status: "CRITICAL_ERROR" });
        }
        return new Response('Došlo k interní chybě na serveru.', { status: 500 });
    }
}
