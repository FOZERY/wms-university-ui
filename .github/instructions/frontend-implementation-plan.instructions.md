---
applyTo: "**"
---

# Frontend план (Vue3) — WMS University

Важно: описание проекта (DeepSeek) может быть неточным — перед тем как углубляться в реализацию новых модулей, сверяемся со Swagger и реальными контроллерами в `wms-university/src/modules/*`.

## 0) Фактическое состояние бэка (проверено по коду)

### Auth

-   `POST /auth/login` — принимает `{ login, password }`, ставит cookie `sessionId`, body отсутствует
-   `GET /auth/me` — возвращает `UserSession`:
    -   `id, login, firstname, lastname, middlename?, role`
-   `POST /auth/logout` — чистит cookie

Роли (enum): `manager`, `storeKeeper`.

### Suppliers (read-only)

-   `GET /suppliers`
-   `GET /suppliers/:id`

### Nomenclature

-   `GET /nomenclature`
-   `GET /nomenclature/:id`
-   `POST /nomenclature` (по спецификации должно быть только для manager; на бэке явно не ограничено декоратором — UI всё равно скрывает для storeKeeper)
-   `PATCH /nomenclature/:id` — только manager (`@Roles(UserRoles.Manager)`)

## 1) Каркас UI (сделано)

-   Vite + Vue 3 + TS
-   Vue Router + Pinia
-   Axios c baseURL `/api` + dev proxy `/api -> BACKEND`
-   Разделение layout: `/login` без шапки, остальные страницы с `AppShell`

## 2) Экраны (MVP порядок реализации)

### Этап A — Авторизация и базовая навигация

1. Login
    - форма `login/password`
    - после логина: запрос `GET /auth/me`, сохранить в store
2. Профиль
    - показать данные из `/auth/me`
3. Route guard
    - если нет сессии → редирект на `/login`

### Этап B — Реальные модули, которые уже есть на бэке

4. Поставщики (list)
    - таблица из `GET /suppliers`
5. Номенклатура (list)
    - таблица из `GET /nomenclature`
    - ограничения по ролям:
        - storeKeeper: только просмотр
        - manager: показать кнопки create/edit (после появления экранов)

### Этап C — Модули из спецификации (когда появятся на бэке)

6. Warehouses
    - list + details
    - create/edit: только manager
7. Documents
    - list: manager видит все; storeKeeper видит только свои (серверная фильтрация или query)
    - draft/create: incoming/transfer (оба), production (только manager)
    - change status/cancel: только manager
8. Stock
    - просмотр остатков: обе роли
    - корректировка: только manager

## 3) Правила ролевки (как делаем в UI)

-   Роуты доступны обеим ролям, если это "просмотр".
-   Действия (кнопки/формы) скрываем через permissions:
    -   `canEditNomenclature` — manager
    -   `canCreateProductionDocuments` — manager
    -   `canCancelDocuments` — manager
    -   `canAdjustStock` — manager

## 4) Важные замечания

-   Cookie-based auth: все запросы должны идти через `/api/*` (proxy), иначе упремся в CORS.
-   Типы держим близко к реальным схемам из бэка (camelCase + nullable поля как `null`).
