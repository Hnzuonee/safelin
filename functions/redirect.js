export async function onRequestPost(context) {
    const { request, env } = context;

    function createErrorResponse(message, status, data = {}) {
        const body = JSON.stringify({ error: message, ...data });
        return new Response(body, { 
            status: status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.formData();
        const token = body.get('cf-turnstile-response');
        const secret = env.TURNSTILE_SECRET_KEY;
        const destinationURL = env.DESTINATION_URL;

        if (!secret) return createErrorResponse('Chyba serveru: Chybí proměnná TURNSTILE_SECRET_KEY.', 500);
        if (!destinationURL) return createErrorResponse('Chyba serveru: Chybí proměnná DESTINATION_URL.', 500);
        if (!token) return createErrorResponse('Chybějící token od klienta.', 400);

        const formData = new FormData();
        formData.append('secret', secret);
        formData.append('response', token);

        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const result = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        
        if (outcome.success) {
            return Response.redirect(destinationURL, 302);
        } else {
            return createErrorResponse('Ověření Turnstile selhalo.', 403, { codes: outcome['error-codes'] });
        }

    } catch (error) {
        return createErrorResponse('Došlo k neočekávané interní chybě.', 500, { details: error.message });
    }
}
