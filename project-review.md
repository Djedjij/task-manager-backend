# Ревью проекта `back` (Task Manager API) относительно `backend-nodejs-learning-plan.md`

> Дата ревью: 2026-09-20. Последний коммит: `a23131f` («Added pagination helper»), ветка `main`.
> Метод: чтение кода + запуск (`node -r ts-node/register src/index.ts`, `npx tsc --noEmit`, `npx tsc --outDir build-tmp`, `npm run swagger`, `node dist/index.js`).
> Live-проверка: PostgreSQL/Docker на машине не подняты (порт 5432 закрыт, docker daemon не запущен), поэтому сценарии с БД проверялись статически; HTTP-слой проверен на живом сервере (`/health`, `/ready`, `/tasks`, `/docs`, 404).

---

## 1. Краткое резюме

Проект уверенно «перешёл» рубеж **недели 4 плана** (auth + JWT refresh + CRUD задач + проекты и участники) и начал **неделю 2/11** (пагинация, Swagger-заготовка). Архитектура правильная: `routes → controllers → services → prisma`, DTO-валидация Zod, централизованный error middleware, barrel-хелперы, декларативное расширение `Express.Request`.

Оценка по областям (0–10):

| Область | Оценка | Почему |
|---|---|---|
| Структура и читаемость кода | 8 | Слои разделены, имена аккуратные, комментарии по делу |
| Данные и Prisma-модель | 7 | Нормальные отношения, индексы, `select`-объекты; нет `status/priority`, нет транзакций в кейсах «проект + задача» |
| AuthN/AuthZ | 6 | Полноценный refresh-flow с хешем токена, но роли/RBAC отсутствуют, cookie без `secure/path`, logout не очищает cookie |
| Контракт API | 4 | Три разных формата ответа и два разных формата ошибок, нет error `code`, docs не описывают реальные пути |
| Тестирование | 0 | Тестов нет вообще, нет Jest/Supertest, нет скрипта `test` |
| Безопасность (неделя 6) | 3 | Нет helmet, rate-limit, политики пароля; есть утечки данных между пользователями |
| Эксплуатация/DevEx | 4 | docker-compose для dev работает, но `npm run build` + `npm start` падает, `npm run swagger` зависает, нет CI, нет `.env.example` |

**Итог: ~6.5/10 для текущего этапа.** База отличная, но проект пока «не доведён до релиза»: есть один реально ломающий прод-старт баг, несколько утечек данных и отсутствует слой тестов, который по плану должен идти следующим шагом (неделя 5).

---

## 2. Сверка с планом (что закрыто, что нет)

| План | Задание | Статус | Комментарий |
|---|---|---|---|
| Н0 | Node/TS/Docker/Postgres | ✅ | `docker-compose.yml` (pg 15 + app), Prisma 7 + driver-adapter `PrismaPg` |
| Н0 | Скрипты `dev/build/start/test/test:watch/lint` | ⚠️ частично | есть `dev`, `build`, `start`, `seed`, `db:*`, `swagger`; **нет** `test`, `test:watch`, `lint` |
| Н0 | ESLint + Prettier | ❌ | ни конфигов, ни зависимостей |
| Н0 | `GET /health`, `GET /ready` | ✅ | `ready` реально пингует БД (`SELECT 1`), отдаёт 503 — верно |
| Н0 | Конфиг env + logger | ⚠️ | env через `dotenv` без валидации; логгер = `console.log` |
| Н1 | Единый формат ошибок + коды 400/401/403/404/409/500 | ⚠️ | `errorMiddleware` покрывает 404/409/400/500 + Prisma-коды; **формат расходится** с валидатором; нет `code`, нет correlationId |
| Н1 | Роут `users` с заглушками register/login | ✅ | позже заменено настоящим `/auth/register`, `/auth/login` — нормально |
| Н1 | DTO-валидация (Zod) | ✅ | `src/schemas/*`, `validate(schema, "body")`, `validate(schema, "params")` |
| Н1 | correlation-id + duration логов | ✅ | `express-correlation-id` + `loggingMiddleware` |
| Н1 | CORS | ⚠️ | политика есть, но ошибка CORS уходит в 500 и список origin захардкожен |
| Н2 | Swagger/OpenAPI с контрактами | ❌ | `src/swagger-output.json` — устаревший, пути без префиксов (`/user/{id}` вместо `/users/{id}`), Swagger 2.0, генератор не работает |
| Н2 | CRUD `Tasks` | ✅ | POST/GET/GET:id/PUT/DELETE, доступ только владельцу |
| Н2 | Пагинация + фильтры (`limit/offset`, max limit) | ⚠️ | пагинация только для `GET /projects`; `MAX_LIMIT = 1000` (план: 50); фильтров/поиска нет вовсе; `GET /tasks` возвращает всё без лимита |
| Н3 | Схема Prisma (User/Task), FK, unique email, индексы | ✅ (+1 модель) | `@@index([userId])`, `@@index([userId, dueAt])`, `@@index([projectId])`; добавлены `Project`, `ProjectMember` (сверх плана) |
| Н3 | `status` у задачи | ❌ | в модели нет `status`/`priority` |
| Н3 | Сервисный слой | ✅ | `TaskService`, `ProjectService`, `UserService`, `AuthService` |
| Н4 | Регистрация/логин, bcrypt, 409 | ✅ | `bcryptjs` (salt 10), дубль email → 409 |
| Н4 | AuthMiddleware, refresh, logout | ✅ | есть `authenticate` + `optionalAuth` (последний не используется) |
| Н4 | Роли (user/admin) + RolesMiddleware | ❌ | роли только как строковое поле `ProjectMember.role`; на `User` роли нет, middleware прав нет |
| Н4 | Негативные кейсы (неверный пароль, чужой ресурс) | ✅ | 401/403/404 реализованы осмысленно |
| Н5 | Jest + Supertest, тестовая БД, coverage | ❌ | 0 тестов |
| Н6 | helmet, rate-limit, лимиты входа, идемпотентность | ❌ | ничего из этого нет |
| Н7 | Кэш, ограничения параллельности | ❌ | ожидаемо (опционально) |
| Н8 | Структурные логи (pino), диагностика | ⚠️ | `console.log`/`console.warn` вместо логгера; correlationId в логи есть, **в ответы об ошибках — нет** |
| Н9 | BullMQ/Redis | ❌ | ожидаемо (опционально) |
| Н10 | Dockerfile/compose, CI, README | ⚠️ | Docker — dev-вариант; CI нет; README только про Prisma-команды |
| Н11 | Нагрузочные тесты, полировка контракта | ❌ | не начато |

---

## 3. Плюсы (что сделано сильно)

### 3.1 Архитектура и структура
- Чёткое разделение слоёв: `src/routes` → `src/controllers` → `src/services` → `src/lib/prisma.ts`. Это ровно то, к чему план ведёт в неделе 11 («отделение слоев: controllers/services/repos») — сделано заранее.
- `src/helpers/index.ts` — barrel-файл с подробным комментарием, почему нужен ручной реэкспорт. Хорошая привычка и хорошее объяснение «для себя через полгода».
- `src/@types/express/index.d.ts` — декларативное расширение `Express.Request` через `declare global` вместо `any`-костылей. Правильный способ.
- `src/types/*` (DTO/response-типы), `src/schemas/*` (валидация) и `src/consts/*` разнесены по назначению.
- JSDoc-комментарии в контроллерах коротко и по делу описывают правило доступа («только владелец», «владелец или участник»).

### 3.2 Prisma и данные
- Модель данных продумана: `User 1—N Task`, `User 1—N Project`, `Project N—N User` через `ProjectMember` с `@@unique([projectId, userId])`.
- UUID генерируются в БД (`dbgenerated("gen_random_uuid()")` + `@db.Uuid`) — согласованно с миграцией `add_uuid`.
- Правильные `onDelete`: `Cascade` для владельца/участника, `SetNull` для `Task.projectId` (задача не исчезает при удалении проекта). Это осознанное решение, а не копипаста.
- Индексы расставлены под реальные запросы: `[userId]`, `[userId, dueAt]`, `[projectId]`, `[ownerId]`, `[projectId, userId]`.
- Переиспользуемые `Prisma.validator<...Select>()` + `Prisma.*GetPayload<...>` в `userService.ts` / `projectService.ts` — типизированные «безопасные» проекции, из ответов физически не могут утечь `hashedPassword` и `refreshToken`.
- `prisma.$transaction([findMany, count])` для пагинации — сразу два запроса одной транзакцией, консистентные `data` + `meta`.
- Миграции в репозитории и с человеко-читаемой историей (`remove_required_user_uuid`, `rename_pass_column`) — видно эволюцию, это ценно для обучения.
- Сид (`prisma/seed.ts`) сделан по-взрослому: детерминированные UUID и email (идемпотентность), `parseArgs` для флага `--reset`, один `$transaction`, финальный отчёт с проверкой «ровно 51/51/51» и подсказкой, как починить расхождение.

### 3.3 Auth и безопасность (что уже есть)
- Пароли хешируются (`bcryptjs`, salt 10), сравнение только через `bcrypt.compare`.
- Refresh-token не хранится в открытом виде — в БД лежит bcrypt-хеш (`refreshToken`), плюс **ротация** при каждом `/auth/refresh-token` (старый токен становится невалидным). Это уже уровень выше типичного обучающего проекта.
- Access/refresh — разные секреты и разное время жизни из env (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRY=15m`, `REFRESH_TOKEN_EXPIRY=7d`).
- Refresh-токен отдаётся в `httpOnly` cookie, а не в JSON — правильно (XSS-риск ниже).
- Ответы авторизации не раскрывают существование пользователя: неверный email и неверный пароль дают одинаковый `401 Incorrect email or password`.

### 3.4 Обработка ошибок, валидация, наблюдаемость
- `AppError(message, status)` + единый `errorMiddleware`: клиент не получает stack trace, 5xx логируются, 4xx — предупреждением.
- `errorMiddleware` умеет мапить Prisma-коды (`P2025→404`, `P2002→409`, `P2003/P2023→400`) — то, что большинство делает только к неделе 6.
- `asyncWrapper` — корректная обёртка `Promise.resolve(fn()).catch(next)`, без неё async-ошибки терялись бы.
- Zod-схемы покрывают body и params, есть `.trim()`, `max(...)`, `z.coerce.date()`, `uuid()` — защита от мусора и от слишком длинных строк есть уже сейчас.
- Логирование: request id (`express-correlation-id`) + duration + method/url/status — есть, и id реально прокидывается в логи (проверено на живом сервере).
- `/health` и `/ready` разведены семантически: `/health` всегда 200, `/ready` проверяет БД и отдаёт 503 — как в плане недели 8.

### 3.5 Практика «принятия решений»
- В `tasksController` явно зафиксировано: **`userId` берётся из токена, а не из body** («иначе задачу можно привязать к чужому пользователю»), и есть whitelist обновляемых полей (`title/description/dueAt/projectId`), а не `data: req.body`. Это лучшая строка в проекте: предотвращён mass-assignment.
- Порядок роутов продуман: `/user/:userId`, `/project/:projectId`, `/` объявлены до `/:id`; `/my` — до `/:id` в проектах, с комментарием почему.
- 404 для неизвестных маршрутов обрабатывается через `AppError` + `errorMiddleware`, а не отдельным `res.status(404)` вразнобой.

---

## 4. Минусы и риски

### 4.1 P0 — блокеры (подтверждено запуском)

1. **`npm run build` + `npm start` падает.** `tsc` не копирует `src/swagger-output.json`, а `src/index.ts` делает `require("./swagger-output.json")`.
   Проверено: `npx tsc --outDir build-tmp` → `node build-tmp/index.js` → `Error: Cannot find module './swagger-output.json'`.
   «Прод-режим» проекта сейчас неработоспособен, хотя `npm run dev` работает.
2. **`npm run swagger` зависает и ничего не генерирует.** Проверено дважды: процесс жив через 12–30 c, `swagger-output.json` не создаётся ни в корне, ни в `src/`. При этом скрипт пишет в `./swagger-output.json` относительно **cwd** (корень), а `index.ts` читает файл относительно `src/` → даже после починки пути разъедутся. Плюс `src/swagger-output.json` закоммичен — то есть документация «заморожена» и уже врёт.
3. **Swagger описывает несуществующие маршруты.** `swagger-autogen` получил роутеры без mount-path, поэтому в файле `/`, `/{id}`, `/user/{id}`, `/login`, `/register` вместо `/tasks`, `/tasks/{id}`, `/users/{id}`, `/auth/login`. `basePath: "/"`, Swagger 2.0, все `description: ""`, схем почти нет. Как «документация API по плану недель 2/8» — не выполнено, а как артефакт — вредно (фронтендер по нему напишет неверный клиент).
4. **`GET /projects` отдаёт проекты всех пользователей** (`ProjectService.getProjects` — `findMany` без `where` + `paginate`), а `GET /users` — список всех пользователей. Любой залогиненный видит чужие данные (в т.ч. email всех пользователей). Для проекта, где сущности принадлежат пользователю, это утечка и логическое противоречие с `GET /projects/my`.
5. **`logout` не удаляет cookie с refresh-токеном.** В `authController.logout` чистится только БД (`refreshToken: null`), `res.clearCookie("refreshToken")` нет. Браузер продолжает отправлять «мёртвую» cookie, `/auth/refresh-token` стабильно отдаёт 401 — клиент в тупике до ручной чистки cookie.

### 4.2 P1 — контракт API, безопасность, корректность

6. **Три формата успешного ответа** в одном API:
   - `authController`: `{ success: true, data: { accessToken, user } }`;
   - `refreshToken`: `{ success: true, accessToken }` — `accessToken` вне `data` (непоследовательность внутри одного файла);
   - `tasksController` / `projectController` / `usersController`: голый объект/массив (`res.json(task)`);
   - `sendPaginated`: `{ data, meta }` (без `success`).
7. **Два формата ошибок**: `errorMiddleware` → `{ success: false, error: { message, status } }`, а `validationMiddleware` → `{ success: false, message: "Validation error", errors: [{field,message}] }`. Плюс нет обязательного по плану `error.code` (`VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`...) — клиенту не на что опереться, кроме строки.
8. **`validationMiddleware` не вызывает `next(err)`**, а сам формирует ответ и сам решает про 500 — дублирование логики `errorMiddleware`; логирование 5xx и correlationId для этого пути не работают.
9. **Cookie refresh-токена небезопасна для прод-окружения**: нет `secure: NODE_ENV === "production"`, нет `path: "/auth"` (токен уезжает на каждый запрос к API), `maxAge` захардкожен `7*24*60*60*1000` вместо вычисления из `REFRESH_TOKEN_EXPIRY`, нет `signed`. Сам `sameSite: "lax"` выбран осознанно — ок, но стоит зафиксировать в README (пункт плана недели 6).
10. **CORS-ошибка превращается в 500.** `callback(new Error("Blocked by CORS policy"))` попадает в `errorMiddleware` → клиент видит «Internal server error» вместо 403, в логах шумит `console.error`. Список origin захардкожен, `https://my-production-app.com` — фиктивный домен, который нельзя вынести в env.
11. **Нет helmet, rate-limit, ограничений на login** (неделя 6 плана целиком). `POST /auth/login` можно перебирать бесконечно; `password: min(6)` без требований к сложности; лимита на размер JSON-тела сверх `max(255/1000)` в схемах нет.
12. **Смена пароля не инвалидирует сессии**: `changePassword` обновляет `hashedPassword`, но `refreshToken` в БД остаётся — все устройства продолжают обновлять access-токены. Нет и «reuse detection» на случай кражи refresh-токена.
13. **Только одна сессия на пользователя** (одно поле `User.refreshToken`): логин со второго устройства разлогинивает первое. Для обучения допустимо, но это ограничение стоит проговорить (в проде — таблица `Session`/`RefreshToken`).
14. **`GET /users/:id` доступен любому авторизованному** для любого id, а `GET /tasks/user/:userId` честно сравнивает с текущим пользователем — политики доступа непоследовательны между сущностями.
15. **`updateTask` умеет отвязывать задачу от проекта в обход проверки прав.** Условие `if (body.projectId)` проверяет членство только для truthy-значения, а в `update` попадает `null` (валидный по `.nullish()`) — то есть `projectId: null` отвяжет задачу от чужого проекта, не спросив прав. Логика «проверяем права только если truthy» — потенциальная дыра и для будущих полей.
16. **Нет транзакций в составных операциях**: `addMember` (проверка владельца → проверка существования → create) и `createTask` с проверкой членства — это гонки. Prisma обычно отдаст `P2002` → 409, приемлемо, но лучше явно.
17. **`MAX_LIMIT = 1000`, `BASE_LIMIT = 100`** против требования плана «ограничь max limit (например, 50)», при этом `GET /tasks`, `GET /projects/my`, `GET /projects/:id/members`, `GET /users` вообще без пагинации — выгрузка всей таблицы.
18. **`GET /tasks` и `GET /tasks/user/:userId` дублируют друг друга** (для текущего пользователя результат одинаковый) — лишний роут в контракте.

### 4.3 P2 — качество, консистентность, DevEx

19. **Смешение двух стилей контроллеров**: `authController` — именованные функции с `try/catch` + `next(error)`, `ProjectController`/`TaskController`/`UsersController` — классы-синглтоны (`export default new X()`) без `try/catch` (полагаются на `asyncWrapper`). При этом `authRouter` не использует `asyncWrapper`, а остальные роутеры — используют. Нужно выбрать один стиль.
20. **Три формы сервисов**: `export const authService = new AuthService()` (класс), `export const TaskService = {...}` и `export const ProjectService = {...}` (объекты-литералы), `UserService` — тоже объект. Легко унифицировать до одного варианта.
21. **Env без валидации.** `process.env.JWT_ACCESS_SECRET!` в `jwtHelpers.ts`: если переменной нет, `jwt.sign` падает в рантайме неочевидной ошибкой (`secretOrPrivateKey must have a value`), а `!` заглушает компилятор. Правильно — `src/config/env.ts` с zod-схемой и падением на старте.
22. **Порядок загрузки env магический**: секреты читаются на этапе импорта модуля, `dotenv/config` подключается в `index.ts` и `lib/prisma.ts` — работает только потому, что импорт стоит первой строкой. Любой новый entrypoint (например, worker для недели 9) получит `undefined`.
23. **Отладочный `console.log({ take, skip, orderBy })`** в `paginationMiddleware` остался в коде; логирование запросов дублируется (loggingMiddleware + `console.warn` в errorMiddleware) — шум в проде.
24. **Мёртвый код**: `TaskService.getTasks()`, `optionalAuth`, `TaskController.getTasksByUserId` (дублирует `getTasks`), `src/types/project.types.ts` целиком (`TProjectResponse`, `TProjectMemberResponse`, `TCreateProjectDto`, `TUpdateProjectDto`, `TAddProjectMemberDto`), `RegisterInput`/`LoginInput` в `userSchema.ts` (контроллеры используют `TRegisterUserDto` из `types/`). Плюс дублирование: DTO описаны и в `types/*`, и в `schemas/*` через `z.infer` — единый источник правды не выбран.
25. **Неиспользуемые зависимости**: `@romatech/swagger` (нигде не импортируется) и `swagger-jsdoc` (не используется, генерация на `swagger-autogen`).
26. **Билд-артефакты в git**: `dist/index.js` закоммичен (при том что `dist` в `.gitignore`), а на диске лежит устаревший `dist/` от старой структуры (`dist/prisma.js`, `dist/swagger.js`).
27. **Docker**:
   - файл называется `dockerfile` (нижний регистр) — `docker build` ищет `Dockerfile`, в Linux/CI это ошибка;
   - `npm install` вместо `npm ci`, без multi-stage, dev-зависимости и `ts-node/nodemon` живут в проде, контейнер работает от root;
   - `CMD ["npm","run","dev"]` — «прод»-образа нет (`npm run build` + `node dist/index.js` невозможен из-за п.1);
   - нет `HEALTHCHECK`;
   - `docker-compose` монтирует весь проект (`.:/app`) — это dev-стек (ок), но `prisma migrate deploy` в `command` контейнера — антипаттерн для прода;
   - JWT-секреты в контейнер попадают через примонтированный `.env`, а не через `environment:`/secrets — стоит зафиксировать явно.
28. **Нет `.env.example`**, а в `.env` комментарии в неправильной кодировке (`РҐРѕСЃС‚ ...`) — при копировании на другую машину будут кракозябры.
29. **README минимальный**: нет списка эндпоинтов, формата ошибок, переменных окружения, инструкции запуска через `docker-compose up` («как запустить одной командой» из недели 10 не закрыто).
30. **Нет `lint`/`test` скриптов, нет ESLint/Prettier, нет CI** (недели 0, 5, 10) — регрессии ловятся только руками.
31. **Нет graceful shutdown**: нет обработки `SIGTERM` с `server.close()` и `prisma.$disconnect()`, нет хендлеров `unhandledRejection`/`uncaughtException`.
32. **Нет разделения `app.ts` / `server.ts`**: `index.ts` создаёт и сразу слушает приложение — интеграционные тесты через Supertest (неделя 5) потребуют рефакторинга (нужен экспорт `app` без `listen`).

### 4.4 Сводка приоритетов

| # | Проблема | Файл | Приоритет |
|---|---|---|---|
| 1 | Прод-старт падает на `require("./swagger-output.json")` | `src/index.ts`, `tsconfig.json` | P0 |
| 2 | `npm run swagger` зависает, путь вывода неверный | `src/swagger.ts`, `package.json` | P0 |
| 3 | Swagger описывает несуществующие пути | `src/swagger-output.json` | P0 |
| 4 | Утечка чужих проектов/пользователей | `projectService.getProjects`, `userRouter` | P0 |
| 5 | `logout` не чистит cookie | `authController.logout` | P0 |
| 6–8 | Единый контракт ответов/ошибок + `error.code` | `errorMiddleware`, `validationMiddleware`, все контроллеры | P1 |
| 9 | Флаги cookie (`secure`, `path`, `maxAge`) | `authController` | P1 |
| 10 | CORS → 403, origins из env | `helpers/corsOptions.ts` | P1 |
| 11 | helmet + rate-limit на login | `index.ts`, `authRouter` | P1 |
| 12 | Инвалидация сессий при смене пароля | `authService.changePassword` | P1 |
| 15 | Проверка прав при `projectId: null` | `tasksController.updateTask` | P1 |
| 17 | Лимиты пагинации и пагинация всех списков | `consts`, `taskRouter`, `userRouter` | P1 |
| 19–32 | Стиль кода, мёртвый код, Docker, тесты, CI, shutdown | — | P2 |

---

## 5. Как исправлять (конкретные сниппеты)

### 5.1 P0: прод-сборка и Swagger

Проблема: `tsc` не переносит JSON в `dist`, а `swagger.ts` пишет не туда. Вариант, который чинит обе части сразу:

```ts
// src/swagger.ts — пишем ВНУТРЬ src, чтобы файл был рядом с index.ts и в dev, и в dist
const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const doc = {
  info: { title: "Task Manager API", version: "1.0.0" },
  servers: [{ url: "http://localhost:5000" }],
};

swaggerAutogen("./src/swagger-output.json", [
  "./src/routes/*.ts",                       // wildcard: не надо править список руками
], doc).then(() => console.log("swagger-output.json обновлён"));
```

и скрипт: `"swagger": "tsx src/swagger.ts"` (у тебя уже есть `tsx` — не будет зависимости от нативного TS-рантайма, из-за которого сейчас скрипт зависает).
Отдельно зафиксировать пути вручную (`swagger-autogen` не знает про `app.use("/tasks", ...)`): либо передавать `router.mount`-хинты, либо писать `@swagger`-комментарии к роутерам — но описание путей обязано содержать `/tasks`, `/users`, `/auth`, `/projects`.
Если решено генерировать автодокументацию позже — самое дешёвое сейчас: **убрать `require("./swagger-output.json")` из `index.ts`** и подключать `/docs` только когда файл реально существует, а старый сломанный JSON удалить из репозитория.

```ts
// src/index.ts — не роняем процесс из-за отсутствующего файла документации
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";

const swaggerPath = path.join(__dirname, "swagger-output.json");
if (fs.existsSync(swaggerPath)) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(require(swaggerPath)));
}
```

### 5.2 P1: единый контракт ответа и ошибок

```ts
// src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code: string = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}
```

```ts
// src/middlewares/errorMiddleware.ts — ответ всегда одного вида
res.status(status).json({
  success: false,
  error: { code, message, status, correlationId: correlator.getId() },
});
```

Валидатор перестаёт быть «вторым errorMiddleware» — он просто бросает ошибку:

```ts
// src/middlewares/validationMiddleware.ts
catch (error) {
  if (error instanceof ZodError) {
    const details = error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    return next(new AppError("Ошибка валидации", 400, "VALIDATION_ERROR"));
    // details удобно положить в AppError.details и вернуть в errorMiddleware
  }
  return next(error);
}
```

И разом привести успешные ответы к одному виду: `{ success: true, data: ... }`, пагинация — `{ success: true, data: [...], meta: { total, limit, offset } }` (сейчас `sendPaginated` отдаёт `data` без `success`, а `refreshToken` — `accessToken` вне `data`).

### 5.3 P0: cookie и logout

```ts
// src/helpers/cookieOptions.ts
import type { CookieOptions } from "express";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/auth",                                  // не отправляем cookie на /tasks, /projects
  maxAge: 7 * 24 * 60 * 60 * 1000,                // либо вычислять из REFRESH_TOKEN_EXPIRY
};

// logout
res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: undefined });
```

### 5.4 P0: закрыть утечки данных

```ts
// projectController.getProjects — вместо «все проекты» отдавать доступные пользователю
const [projects, total] = await ProjectService.getProjectsForUser(userId, take, skip, orderBy);
// в сервисе: where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] }
```

`GET /users` → либо ограничить `admin`-ролью, либо убрать из публичного контракта; `GET /users/:id` → разрешать только `req.user.userId === id` (или admin). Для задач то же правило уже реализовано — стоит привести всех к одной политике: **404 для «не моё» вместо 403**, если хочешь не раскрывать существование записей (в плане недели 4 как раз просили зафиксировать выбор и держаться его).

### 5.5 P1: env-конфиг и `app.ts` / `server.ts`

```ts
// src/config/env.ts — падаем на старте, а не в момент первого jwt.sign
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
```

```ts
// src/app.ts — приложение без listen (для Supertest на неделе 5)
export const app = express();
// ...все middleware и роуты...

// src/index.ts — только сеть и graceful shutdown
const server = app.listen(env.PORT, () => console.log(`http://localhost:${env.PORT}`));

const shutdown = async (signal: string) => {
  console.log(`${signal}: shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
```

### 5.6 P1: права в `updateTask` и пагинация

```ts
// tasksController.updateTask — проверяем права для ЛЮБОГО явно переданного projectId, включая null
if (body.projectId !== undefined && body.projectId !== null) {
  const isMember = await ProjectService.isProjectMember(body.projectId, userId);
  if (!isMember) throw new AppError("Доступ к проекту запрещён", 403, "FORBIDDEN");
}
```

Пагинацию добавить тем же `paginate`-мидлваром в `taskRouter.get("/")`, `projectRouter.get("/my")`, `userRouter.get("/")`, `taskRouter.get("/project/:projectId")`, а в `consts` поставить `MAX_LIMIT = 50`, `BASE_LIMIT = 20` (как в плане) — дешёвое и очень заметное улучшение качества.

### 5.7 P2: гигиена кода

- Убрать `console.log` из `paginationMiddleware`, заменить `console.log/warn/error` на логгер (pino) — часть недели 8.
- Удалить мёртвый код и неиспользуемые зависимости (`@romatech/swagger`, `swagger-jsdoc`), либо начать их использовать осознанно.
- Убрать `dist/index.js` из индекса git: `git rm --cached dist/index.js` и `dist/` в `.gitignore` (он уже там).
- Переименовать `dockerfile` → `Dockerfile`, добавить multi-stage и `npm ci`, `USER node`, `HEALTHCHECK`, а `CMD` сделать продовым (`node dist/index.js`) после фикса п.5.1. Dev-режим оставить в `compose.dev.yml`.
- Добавить `.env.example` и починить кодировку комментариев в `.env`.
- В README добавить: `docker-compose up`, список эндпоинтов, примеры curl (регистрация → логин → создание задачи), формат ошибок, env-переменные, решения по безопасности (почему `Authorization` + `sameSite=lax`, а не CSRF-токен).

---

## 6. Что реализовывать дальше (роадмап под план)

Порядок важен: не начинать новую функциональность, пока не закрыты P0 и не появился первый тест — иначе тестировать придётся «всё сразу».

### Спринт A — «Зелёная база» (1–2 дня, P0-фиксы + DevEx)
1. Починить прод-сборку и `/docs` (5.1).
2. Закрыть утечки данных (`GET /projects`, `GET /users*`) и дыру в `updateTask` (5.4, 5.6).
3. Починить `logout` + флаги cookie (5.3).
4. Единый контракт ответов/ошибок + `error.code` (5.2) — сделать **до** тестов, иначе тесты придётся переписывать.
5. `Dockerfile` с большой буквы, `.env.example`, `git rm --cached dist/index.js`.
**DoD:** `npm run build && npm start` поднимает API, `/docs` открывается, ответы/ошибки однородны, `docker build` работает.

### Спринт B — неделя 5 плана: тестирование (3–5 дней) — **главный приоритет**
1. `src/app.ts` / `src/server.ts` (см. 5.5) — без этого Supertest неудобен.
2. Jest + Supertest + `ts-jest` (или Vitest), скрипты `test`, `test:watch`.
3. Отдельная тестовая БД (`mydb_test` в том же compose, отдельная schema или контейнер) + очистка данных перед тестами.
4. Минимальный набор integration-тестов:
   - `POST /auth/register`: успех, дубль → 409, невалидный email → 400;
   - `POST /auth/login` + `POST /auth/refresh-token`: ротация работает, повторный refresh старым токеном → 401;
   - `GET /tasks` без токена → 401; чужой `GET /tasks/:id` → 403/404; `PUT`/`DELETE` чужой задачи;
   - `GET /projects/my` возвращает только доступные проекты; `POST /projects/:id/members` не владельцем → 403;
   - `GET /health` → 200, `GET /ready` → 200 (и 503 при недоступной БД через мок).
5. Unit-тесты: `paginationMiddleware` (limit/offset/NaN/MAX), `errorMiddleware` (маппинг Prisma-кодов), `jwtHelpers`.
6. Порог coverage по критичным путям (auth, доступ), не 100%.
**DoD:** `npm test` зелёный; удаление любой проверки доступа ломает тест.

### Спринт C — неделя 6 плана: безопасность (2–4 дня)
1. `helmet`, `express-rate-limit` (жёсткий лимит на `/auth/login`, `/auth/register`, общий — мягкий).
2. Политика пароля (min 8 + проверка популярных паролей), лимиты длины в схемах, `express.json({ limit: "100kb" })`.
3. Инвалидация сессий: при `changePassword` — сброс `refreshToken`; опционально таблица `Session` (несколько устройств, отзыв per-device, reuse detection).
4. CORS из env, ошибка CORS → 403 через `AppError`.
5. Раздел «Безопасность» в README: почему `Authorization` + `sameSite=lax` достаточно и CSRF-токен не нужен; что сделано, что осознанно отложено.
**DoD:** перебор логина ограничен, security headers на месте, негативные сценарии покрыты тестами.

### Спринт D — недели 7–8 плана: производительность и наблюдаемость (3–5 дней)
1. `status`/`priority` у задачи + фильтры `GET /tasks?status=&q=&projectId=&dueBefore=&sort=` (неделя 2 плана наконец закрывается по-настоящему).
2. Индексы под новые фильтры (`[userId, status]`), проверить `EXPLAIN ANALYZE`.
3. Cursor-пагинация для `GET /tasks` (неделя 11) — после того как offset-версия стабильна и покрыта тестами.
4. pino + correlationId во всех логах и в теле ошибки; `uptime`/версия в `/health`.
5. Redis-кэш на `GET /tasks` с TTL и инвалидацией по мутациям (опционально, но заметный «+» в портфолио).

### Спринт E — недели 9–11 плана (4–7 дней)
1. BullMQ + Redis: job «пересчитать просроченные задачи» (нужно поле `status`/`dueAt` из спринта D), admin-only trigger.
2. Роли: `User.role` (`user`/`admin`) + `RolesMiddleware`/policy-функции — тогда `GET /users` естественно становится admin-only.
3. CI (GitHub Actions): `npm ci` → `tsc --noEmit` → `eslint` → `jest` (с сервисом postgres) → опционально `docker build`.
4. Нагрузочный тест (k6/autocannon) на `GET /tasks` и `POST /tasks`, пара выводов с числами в README («до/после индекса», «до/после кэша»).
5. OpenAPI: примеры ошибок, `error.code` в схемах, финальная вычитка Swagger.

---

## 7. Чеклист «можно сделать за один вечер»

- [ ] Убрать `console.log` из `paginationMiddleware`.
- [ ] `MAX_LIMIT` → 50, `BASE_LIMIT` → 20.
- [ ] `res.clearCookie("refreshToken")` в `logout`.
- [ ] Ограничить `GET /projects` проектами пользователя.
- [ ] `GET /users/:id` — только self (или admin).
- [ ] Проверка прав при `projectId: null` в `updateTask`.
- [ ] CORS-origins в env, ошибка CORS → 403.
- [ ] `/docs` не роняет процесс, если JSON отсутствует.
- [ ] Удалить `@romatech/swagger` и `swagger-jsdoc` из зависимостей.
- [ ] `git rm --cached dist/index.js`.
- [ ] Переименовать `dockerfile` → `Dockerfile`.
- [ ] Добавить `.env.example` и починить кодировку в `.env`.
- [ ] Добавить скрипты `lint`/`test` (пусть даже заглушки) и `typecheck` (`tsc --noEmit`).

---

## 8. Вопросы, которые стоит решить до спринта B

1. **Формат ответа**: остановиться на `{ success, data }` (envelope) или на голых ресурсах? Рекомендую envelope: он уже частично используется, и его проще тестировать.
2. **Политика доступа к «не своему»**: 403 или 404? В плане недели 4 прямо предложено зафиксировать выбор. Сейчас в проекте смешаны оба варианта.
3. **Роли**: `User.role` (проще, соответствует плану) или развивать `ProjectMember.role` (гибче, но RBAC сложнее)? Рекомендация: `User.role` для admin-функций + `ProjectMember.role` для прав внутри проекта.
4. **Тестовый раннер**: Jest (как в плане) или Vitest (быстрее, TS из коробки)? Разницы для обучения почти нет, важно выбрать один и держаться.
5. **Документация API**: автогенерация (`swagger-autogen`) или ручные `@swagger`-аннотации? Для портфолио качественнее второе — у автогенерации «пустые» описания и она не знает mount-пути (что уже привело к п.3).

---

## 9. Итог одной фразой

Проект идёт по плану с опережением по архитектуре (слои, Prisma-модель, auth с ротацией refresh-токена, идемпотентный сид, `/health` + `/ready`, correlation-id) и с отставанием по «инженерной обвязке»: сейчас это **сломанный прод-билд, три проблемы доступа к чужим данным, ноль тестов, ноль линтера и ноль CI**.

Если в ближайшие дни закрыть раздел 7 и сразу перейти к неделе 5 плана (тесты), проект выйдет на уровень «крепкое портфолио-junior», а дальше можно спокойно наращивать функции (фильтры, кэш, очереди, CI) без страха что-то сломать.







