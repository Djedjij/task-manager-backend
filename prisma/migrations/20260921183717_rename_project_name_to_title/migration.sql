/*
  Переименование столбца `name` -> `title` в таблице `Project`.

  Внимание: `prisma migrate dev` для такого изменения генерирует
  DROP COLUMN "name" + ADD COLUMN "title", то есть удаляет данные.
  Здесь использован RENAME COLUMN, поэтому значения существующих
  проектов сохраняются.
*/

-- AlterTable
ALTER TABLE "Project" RENAME COLUMN "name" TO "title";
