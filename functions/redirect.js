export async function onRequestPost(context) {
    const { env, request } = context;
    const secretKey = env.TURNSTILE_SECRET_KEY;
    const destinationURL = env.DESTINATION_URL;

    try {
        if (!secretKey || !destinationURL) {
            console.error("Chyba: Chybí konfigurační proměnné.");
            return new Response('Chyba konfigurace serveru.', { status: 500 });
        }
        
        const formData = await request.formData();
        const token = formData.get('cf-turnstile-response');

        if (!token) {
            return new Response('Chybí ověřovací token.', { status: 403 });
        }
        
        const verificationURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const response = await fetch(verificationURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-urlencoded' },
            body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
        });
        
        const result = await response.json();

        if (result.success) {
            // Důležité: Místo přesměrování vracíme jen status 200, přesměrování řeší frontend
            return new Response(null, {
                status: 302, // Opraveno na 302 pro přesměrování
                headers: {
                    'Location': destinationURL
                }
            });
        } else {
            return new Response('Ověření selhalo.', { status: 403 });
        }
    } catch (error) {
        console.error("Kritická chyba:", error.message);
        return new Response('Došlo k interní chybě.', { status: 500 });
    }
}
