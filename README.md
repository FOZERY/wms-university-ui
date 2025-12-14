# wms-university-ui

Frontend (Vue 3 + TypeScript) для WMS University.

## Запуск

-   Установка зависимостей: `npm i`
-   Dev-сервер: `npm run dev`
-   Сборка: `npm run build`

## Подключение к бэку

Бэк использует cookie-based сессию (`sessionId` в httpOnly cookie) и эндпоинты вида `/auth/*`, `/suppliers/*`, `/nomenclature/*`.

Во время разработки Vite проксирует запросы с `/api/*` на бэк, чтобы не упираться в CORS:

-   `GET /api/auth/me` -> `GET /auth/me`

По умолчанию target бэка: `http://localhost:3000`.
Если у тебя бэк на другом адресе/порту:

-   `VITE_BACKEND_URL=http://localhost:3000`
