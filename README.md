Запуск миграций prisma:

npx prisma migrate dev --name <название миграции>

Просмотр БД:

prisma studio

Наполнение БД тестовыми данными (идемпотентный сид):

npx prisma db seed

Скрипт сида: `prisma/seed.ts` — создаёт 51 пользователя, 51 проект и 51 задачу
(`user01@example.com` ... `user51@example.com`, у всех базовый пароль `P@ssw0rd`).
Повторный запуск пересобирает те же записи, новые не плодятся.

Полная пересборка (ровно 51/51/51, таблицы User/Task/Project/ProjectMember
предварительно очищаются):

npm run db:seed:reset

Изнутри Docker-контейнера:

docker exec myapp-node npx prisma db seed

Важно (Prisma 7): сид больше не запускается автоматически после
`prisma migrate dev` / `prisma migrate reset` — вызывайте `prisma db seed` вручную.

Генерация документации:

npm run swagger
