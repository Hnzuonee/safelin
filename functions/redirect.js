export async function onRequestPost(context) {
    // 1. Načteme data z formuláře
    const formData = await context.request.formData();
    const token = formData.get('cf-turnstile-response');
    
    // ZMĚNA ZDE: Vložte svůj Secret Key přímo sem do uvozovek
    const secretKey = "0x4AAAAAAB3S4r5Z9xssInbpJXe_DjbRkDE"; 

    // 2. Připravíme požadavek na ověření u Cloudflare
    const verificationURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const verificationRequest = new Request(verificationURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-urlencoded' },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    });

    // 3. Pošleme požadavek a získáme výsledek
    const verificationResponse = await fetch(verificationRequest);
    const verificationResult = await verificationResponse.json();

    // 4. Pokud je výsledek platný, přesměrujeme
    if (verificationResult.success) {
        const destinationURL = context.env.DESTINATION_URL;
        return new Response(null, {
            status: 302,
            headers: { 'Location': destinationURL }
        });
    } 
    // 5. Pokud není platný, vrátíme chybu
    else {
        // Vrátíme i chybovou hlášku od Cloudflare, abychom viděli, co se děje
        const error = verificationResult['error-codes'] ? verificationResult['error-codes'][0] : 'neznámá chyba';
        return new Response(`Ověření selhalo: ${error}`, { status: 403 });
    }
}
