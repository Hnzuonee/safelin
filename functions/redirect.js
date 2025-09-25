export async function onRequestPost(context) {
    try {
        const secretKey = context.env.TURNSTILE_SECRET_KEY;
        
        if (secretKey && secretKey.length > 10) {
            // Pokud klíč existuje, ukážeme jeho prvních 5 a posledních 5 znaků
            const partialKey = `${secretKey.substring(0, 5)}...${secretKey.substring(secretKey.length - 5)}`;
            return new Response(`Server dostal Secret Key: ${partialKey}`, { status: 400 });
        } else {
            // Pokud je klíč prázdný nebo poškozený
            return new Response('CHYBA: Server nedostal žádný platný Secret Key!', { status: 400 });
        }

    } catch (error) {
        return new Response(`Došlo k chybě při čtení proměnné: ${error.message}`, { status: 500 });
    }
}
