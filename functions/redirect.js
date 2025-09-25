/**
 * Zpracovává POST požadavky na endpoint /redirect
 * a odpovídá přesměrováním (HTTP 302).
 */
export async function onRequestPost(context) {
  
  // Zde bude finální URL adresa, na kterou chceme uživatele přesměrovat.
  // !! TOTO JE JEDINÉ MÍSTO, KDE BUDE ODKAZ NA OF !!
  const destinationURL = "https://onlyfans.com/jentvojekiks/c9";

  // Volitelné: Pro extra bezpečnost bychom zde v reálném provozu
  // ověřili i token z Turnstile, který by nám poslal klient.
  // Pro testovací vzorek to ale stačí takto.

  console.log(`Přesměrovávám na: ${destinationURL}`);

  // Vytvoříme a vrátíme odpověď s kódem 302 a hlavičkou "Location".
  // Prohlížeč se o zbytek postará sám.
  return new Response(null, {
    status: 302,
    headers: {
      'Location': destinationURL
    }
  });
}
