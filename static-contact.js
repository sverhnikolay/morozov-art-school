(() => {
  const form = document.querySelector('[data-static-contact]');
  if (!form) return;
  const status = document.createElement('p');
  status.className = 'lp-form-note mr-static-form-status';
  status.setAttribute('aria-live', 'polite');
  form.append(status);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.consent = data.get('consent') === '1';
    status.textContent = 'Отправляем заявку…';
    submit.disabled = true;
    try {
      const response = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      status.textContent = result.message || 'Готово.';
      status.classList.toggle('mr-static-form-status--success', response.ok);
      if (response.ok) form.reset();
    } catch {
      status.textContent = 'Нет соединения. Попробуйте ещё раз.';
    } finally {
      submit.disabled = false;
    }
  });
})();
