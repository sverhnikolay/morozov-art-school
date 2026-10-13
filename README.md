# Художественная школа Сергея Морозова

Статическая сборка лендинга для Vercel. Исходная WordPress-копия остаётся в `../theme-source` и `../public`.

## Локальная сборка

```powershell
node .\build-static.mjs
```

## Заявки

Vercel Function `api/lead.js` передаёт оформленные заявки в Telegram. В настройках Vercel добавьте переменные окружения для Production, Preview и Development:

- `TELEGRAM_BOT_TOKEN` — токен бота;
- `TELEGRAM_CHAT_ID` — идентификатор чата администратора.

Значения не хранятся в репозитории.
