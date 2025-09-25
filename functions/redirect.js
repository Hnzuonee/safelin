<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kris | Exkluzivní obsah</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap" rel="stylesheet" />
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    :root{
      --bg:#0d0d1a;--pink:#f900ff;--cyan:#00f2ff;--text:#f0f0f0;--surface:rgba(26,26,41,.7)
    }
    *{box-sizing:border-box}
    body{margin:0;font-family:Poppins,sans-serif;color:var(--text);
      background:linear-gradient(-45deg,#0d0d1a,#1a0d1a,#0d1a1a,#0d0d1a);
      background-size:400% 400%;animation:grad 20s ease infinite}
    @keyframes grad{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
    .container{max-width:900px;margin:0 auto;padding:40px 20px}
    .card{background:var(--surface);backdrop-filter:blur(15px);border:1px solid rgba(255,255,255,.1);
      border-radius:24px;padding:40px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.37);margin-bottom:30px}
    .profile-picture{width:150px;height:150px;border-radius:50%;object-fit:cover;border:4px solid var(--pink);margin:0 auto 20px}
    h1{font-size:3rem;font-weight:900;margin:.2rem 0}
    .bio-short{opacity:.9;margin-bottom:30px}
    .cta-button{color:#fff;border:none;border-radius:50px;padding:18px 45px;font-size:1.1rem;font-weight:700;cursor:pointer;
      text-transform:uppercase;letter-spacing:1.5px;transition:.2s;
      background:linear-gradient(-45deg,var(--pink),var(--cyan));background-size:200% 200%;animation:grad 8s ease infinite}
    .cta-button:disabled{opacity:.7;cursor:not-allowed}
    .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;margin-top:30px}
    .gallery img{width:100%;height:100%;object-fit:cover;border-radius:16px}
    .footer{opacity:.6;text-align:center;padding:20px 0;font-size:.9rem}
  </style>
</head>
<body>
  <div class="container">
    <section class="card">
      <img src="img/profil.jpg" alt="Profilová fotka Kris" class="profile-picture" />
      <h1>Kris</h1>
      <p class="bio-short">Vítej v mé soukromé zóně. Zde začíná ta pravá zábava.</p>

      <!-- Turnstile kořen (viditelná/flexible varianta je stabilní) -->
      <div id="turnstile-root"
           class="cf-turnstile"
           data-sitekey="0x4AAAAAAB3S4iz1VmOz-kYh"
           data-callback="onTurnstileSuccess"
           data-error-callback="onTurnstileError"
           data-size="flexible"
           data-theme="auto">
      </div>

      <button id="cta-button" class="cta-button" type="button">Vstupte</button>
      <div id="msg" style="margin-top:12px;opacity:.8;"></div>
    </section>

    <section class="card">
      <h2>Co na tebe čeká?</h2>
      <ul style="text-align:left;list-style:none;padding:0;opacity:.85">
        <li>✓ Denně nové fotky a videa v HD kvalitě.</li>
        <li>✓ Přímý chat – odpovídám na všechny zprávy.</li>
        <li>✓ Obsah na míru přesně pro tebe.</li>
        <li>✓ Exkluzivní živé přenosy pro členy.</li>
      </ul>
      <div class="gallery">
        <img src="img/galerie-01.jpeg" alt="Ukázka fotky 1" />
        <img src="img/galerie-02.jpeg" alt="Ukázka fotky 2" />
        <img src="img/galerie-03.jpeg" alt="Ukázka fotky 3" />
      </div>
    </section>
  </div>

  <footer class="footer">
    <p>&copy; 2025 Kris. Vstupem potvrzuješ, že je ti 18+.</p>
  </footer>

  <script>
    let widgetId = null;
    const btn = document.getElementById('cta-button');
    const msg = document.getElementById('msg');

    function setState(disabled, text){
      btn.disabled = disabled;
      if (text) btn.innerText = text;
    }
    function note(t){ msg.textContent = t || ''; }

    // Render widgetu (stabilní cesta – velikost flexible, žádné "invisible")
    function ensureRendered(){
      if (widgetId || typeof turnstile === 'undefined') return;
      try{
        widgetId = turnstile.render('#turnstile-root', {
          sitekey: '0x4AAAAAAB3S4iz1VmOz-kYh',
          callback: onTurnstileSuccess,
          'error-callback': onTurnstileError,
          size: 'flexible',
          theme: 'auto',
          appearance: 'always'
        });
      }catch(e){ console.error('Turnstile render error:', e); }
    }

    window.onTurnstileSuccess = function(token){
      // top-level navigace: server udělá 302 → cílová URL nikdy není v klientovi
      window.location.href = '/redirect?token=' + encodeURIComponent(token);
    };

    window.onTurnstileError = function(){
      try{ if (widgetId) turnstile.reset(widgetId); }catch(e){}
      setState(false, 'Chyba, zkuste to znovu');
      note('Ověření se nepovedlo.');
    };

    btn.addEventListener('click', () => {
      setState(true, 'Kontroluji...');
      note('');
      try{
        ensureRendered();
        try{ if (widgetId) turnstile.reset(widgetId); }catch(e){}
        if (!widgetId) throw new Error('Turnstile není připraven');
        turnstile.execute(widgetId);
      }catch(e){
        console.error(e);
        onTurnstileError();
      }
    });

    window.addEventListener('load', ensureRendered);
  </script>
</body>
</html>
