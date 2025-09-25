# jedemezkopce-redirect

Cloudflare Pages + Functions projekt pro bezpečné redirect flow s Turnstile.

## Co dělá
1. Uživatelské kliknutí spustí invisible Turnstile.
2. Po úspěchu se provede POST na `/redirect`.
3. Server zvaliduje Turnstile a uloží nonce do KV (TTL ~45s).
4. Vrátí `{ nonce }` → klient udělá `GET /go/{nonce}`.
5. Funkce `functions/go/[id].js` načte URL z KV, smaže ji a přesměruje (303).

## Nasazení
- Přidej KV namespace binding `LINKS_KV` v CF Pages.
- Nastav environment variables: `TURNSTILE_SECRET_KEY`, `DESTINATION_URL`.
