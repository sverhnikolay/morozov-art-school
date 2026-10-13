const telegramEndpoint = (token) => `https://api.telegram.org/bot${token}/sendMessage`;

function clean(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Метод не поддерживается.' });
  }
  try {
    const payload = await readJson(req);
    const name = clean(payload.name, 60);
    const phone = clean(payload.phone, 24);
    const program = clean(payload.program, 80) || 'Помогите выбрать';
    const digits = phone.replace(/\D/g, '');
    if (name.length < 2 || digits.length < 10 || digits.length > 15 || !payload.consent || payload.website) {
      return res.status(400).json({ ok: false, message: 'Проверьте имя, телефон и согласие на обработку данных.' });
    }
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return res.status(503).json({ ok: false, message: 'Приём заявок временно настраивается.' });
    const text = [
      '<b>Новая заявка с сайта</b>',
      `<b>Имя:</b> ${escapeHtml(name)}`,
      `<b>Телефон:</b> ${escapeHtml(phone)}`,
      `<b>Занятия:</b> ${escapeHtml(program)}`,
    ].join('\n');
    const telegram = await fetch(telegramEndpoint(token), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    if (!telegram.ok) throw new Error(`Telegram returned ${telegram.status}`);
    return res.status(200).json({ ok: true, message: 'Заявка отправлена. Мы скоро свяжемся с вами.' });
  } catch (error) {
    console.error('lead-handler', error.message);
    return res.status(500).json({ ok: false, message: 'Не удалось отправить заявку. Попробуйте ещё раз.' });
  }
};
