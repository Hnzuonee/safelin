export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.formData();
        
        // Získání tokenu z formuláře a tajného klíče + cílové URL z proměnných prostředí
        const token = body.get('cf-turnstile-response');
        const secret = env.TURNSTILE_SECRET_KEY;
        const destinationURL = env.DESTINATION_URL;

        // Kontrola, zda jsou všechny potřebné údaje k dispozici
        if (!token || !secret || !destinationURL) {
            console.error('Chybějící konfigurace: Ujisti se, že jsou nastaveny TURNSTILE_SECRET_KEY a DESTINATION_URL.');
            return new Response('Chyba serveru: Chybí potřebné údaje pro ověření.', { status: 500 });
        }

        // Sestavení dat pro ověřovací požadavek na Cloudflare
        const formData = new FormData();
        formData.append('secret', secret);
        formData.append('response', token);

        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

        // Odeslání požadavku na ověření
        const result = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();

        // Pokud ověření proběhlo úspěšně, přesměrujeme uživatele
        if (outcome.success) {
            return Response.redirect(destinationURL, 302);
        } else {
            // Pokud ověření selhalo, vrátíme chybu
            console.error('Ověření Turnstile selhalo:', outcome['error-codes'] || 'Žádné chybové kódy');
            return new Response('Ověření se nezdařilo. Jste si jistí, že nejste robot?', { status: 403 });
        }

    } catch (error) {
        // Zpracování neočekávaných chyb
        console.error('Došlo k interní chybě:', error);
        return new Response('Na serveru došlo k neočekávané chybě.', { status: 500 });
    }
}
