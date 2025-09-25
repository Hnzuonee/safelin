/**
 * Ověří Turnstile token u Cloudflare API.
 * @param {string} token - Token z frontendu.
 * @param {string} secretKey - Náš tajný klíč z proměnných prostředí.
 * @returns {Promise<boolean>} - True, pokud je token platný.
 */
async function verifyTurnstileToken(token, secretKey) {
    const verificationURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    
    // Odeslání požadavku na ověřovací endpoint Cloudflare
    const response = await fetch(verificationURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    });

    const data = await response.json();
    return data.success; // Vrátí true, pokud byl token úspěšně ověřen
}


/**
 * Zpracovává POST požadavky na /redirect, ověří token a POUZE POTÉ přesměruje.
 */
export async function onRequestPost(context) {
    try {
        // Získáme data odeslaná z frontendu (očekáváme JSON s tokenem)
        const body = await context.request.json();
        const token = body.token;
        
        // Získáme tajný klíč z proměnných prostředí, které jsi nastavil v Cloudflare
        const secretKey = context.env.TURNSTILE_SECRET_KEY;

        // Kontrola, zda máme vše potřebné
        if (!token || !secretKey) {
            return new Response('Chybí token nebo serverový klíč.', { status: 400 });
        }

        // Ověříme, zda je token od uživatele platný
        const isValid = await verifyTurnstileToken(token, secretKey);

        if (isValid) {
            // === TOKEN JE PLATNÝ ===
            // Teprve teď provedeme přesměrování

            // Tvoje finální URL adresa
            const destinationURL = "https://onlyfans.com/jentvojekiks/c9";

            console.log(`Token ověřen. Přesměrovávám na: ${destinationURL}`);
            
            return new Response(null, {
                status: 302,
                headers: { 
                    'Location': destinationURL,
                    'Cache-Control': 'no-store'
                }
            });
        } else {
            // === TOKEN JE NEPLATNÝ ===
            // Vrátíme chybu a nepovolíme přístup
            console.log("Ověření Turnstile selhalo. Požadavek zablokován.");
            return new Response('Ověření selhalo. Jste robot?', { status: 403 });
        }
    } catch (error) {
        console.error("Chyba ve funkci redirect:", error);
        return new Response('Došlo k interní chybě na serveru.', { status: 500 });
    }
}
