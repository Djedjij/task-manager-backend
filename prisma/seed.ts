import "dotenv/config";
import { parseArgs } from "node:util";
import { Prisma } from "@prisma/client";
import { hashPassword } from "../src/helpers";
import { prisma } from "../src/lib/prisma";

/**
 * Сид для локальной разработки: 51 пользователь, 51 проект, 51 задача.
 *
 * Особенности:
 * - детерминированные UUID и e-mail: повторный запуск даёт тот же набор
 *   записей, а не новые дубли;
 * - базовый пароль одинаковый у всех тестовых аккаунтов (SEED_PASSWORD);
 * - по умолчанию сид пересобирает только «свои» записи (плюс аккаунты
 *   предыдущей версии сида), а с флагом --reset полностью очищает
 *   User / Task / Project / ProjectMember и создаёт ровно 51/51/51.
 *
 * Запуск:
 *   npx prisma db seed              (или npm run db:seed)
 *   npx prisma db seed -- --reset   (полная пересборка: ровно 51/51/51)
 *
 * ВНИМАНИЕ: пароль намеренно простой и годится только для локальной разработки.
 */

const SEED_PASSWORD = "P@ssw0rd";

const USER_COUNT = 51;
const PROJECT_COUNT = 51;
const TASK_COUNT = 51;
const MEMBERS_PER_PROJECT = 2;

/** Аккаунты предыдущей версии сида — удаляем, чтобы не копились. */
const LEGACY_SEED_EMAILS = [
  "alice@example.com",
  "bob@example.com",
  "carol@example.com",
];

const PROJECT_TOPICS = [
  "Планирование спринта",
  "Миграция на Prisma",
  "Рефакторинг API",
  "Покрытие тестами",
  "Мониторинг и логи",
  "Документация Swagger",
  "Оптимизация запросов",
  "CI/CD пайплайн",
];

const TASK_TOPICS = [
  "Описать модель данных",
  "Реализовать эндпоинт",
  "Написать интеграционный тест",
  "Обновить валидацию Zod",
  "Разобрать ошибки в логах",
  "Проверить права доступа",
  "Отрефакторить сервисный слой",
  "Актуализировать README",
];

/** Сдвиг даты относительно текущего момента (в днях). */
const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const pad = (value: number, length: number): string =>
  String(value).padStart(length, "0");

/** UUID формата v4: первая группа — тип сущности, последняя — порядковый номер. */
const seedUuid = (kind: number, index: number): string =>
  `${pad(kind, 8)}-0000-4000-8000-${pad(index, 12)}`;

const userUuid = (index: number): string => seedUuid(1, index);
const projectUuid = (index: number): string => seedUuid(2, index);
const memberUuid = (index: number): string => seedUuid(3, index);
const taskUuid = (index: number): string => seedUuid(4, index);

/** user01@example.com ... user51@example.com */
const seedEmail = (index: number): string => `user${pad(index, 2)}@example.com`;

/** Зацикливаем порядковый номер пользователя в диапазоне 1..USER_COUNT. */
const wrapUserIndex = (value: number): number => ((value - 1) % USER_COUNT) + 1;

const range = (count: number): number[] =>
  Array.from({ length: count }, (_, i) => i + 1);

const buildUsers = (hashedPassword: string): Prisma.UserCreateManyInput[] =>
  range(USER_COUNT).map((index) => ({
    id: userUuid(index),
    email: seedEmail(index),
    hashedPassword,
    lastLoginAt: index % 3 === 0 ? null : daysFromNow(-index),
    createdAt: daysFromNow(-USER_COUNT - 1 + index),
  }));

const buildProjects = (): Prisma.ProjectCreateManyInput[] =>
  range(PROJECT_COUNT).map((index) => {
    const topic = PROJECT_TOPICS[(index - 1) % PROJECT_TOPICS.length];

    return {
      id: projectUuid(index),
      name: `Проект ${pad(index, 2)}: ${topic}`,
      description: `${topic}. Владелец: ${seedEmail(index)}`,
      ownerId: userUuid(index),
      createdAt: daysFromNow(-PROJECT_COUNT - 1 + index),
    };
  });

const buildMembers = (): Prisma.ProjectMemberCreateManyInput[] => {
  const members: Prisma.ProjectMemberCreateManyInput[] = [];
  let counter = 0;

  const roles = [
    { offset: 1, role: "admin" },
    { offset: 2, role: "member" },
  ].slice(0, MEMBERS_PER_PROJECT);

  for (const projectIndex of range(PROJECT_COUNT)) {
    for (const { offset, role } of roles) {
      counter += 1;
      members.push({
        id: memberUuid(counter),
        projectId: projectUuid(projectIndex),
        userId: userUuid(wrapUserIndex(projectIndex + offset)),
        role,
        createdAt: daysFromNow(-PROJECT_COUNT + projectIndex),
      });
    }
  }

  return members;
};

const buildTasks = (): Prisma.TaskCreateManyInput[] =>
  range(TASK_COUNT).map((index) => {
    // Каждая десятая задача — личная, без проекта.
    const isPersonal = index % 10 === 0;
    const topic = TASK_TOPICS[(index - 1) % TASK_TOPICS.length];

    return {
      id: taskUuid(index),
      title: `Задача ${pad(index, 2)}: ${topic}`,
      description: isPersonal
        ? "Личная задача без проекта."
        : `${topic}. Проект ${pad(index, 2)}, исполнитель ${seedEmail(index)}`,
      // Каждая четвёртая задача — без срока, дальше чередуем просрочку и будущее.
      dueAt: index % 4 === 1 ? null : daysFromNow(index % 2 === 0 ? index : -index),
      // Задача N принадлежит пользователю N: у каждого аккаунта ровно одна задача.
      userId: userUuid(index),
      projectId: isPersonal ? null : projectUuid(index),
      createdAt: daysFromNow(-TASK_COUNT - 1 + index),
    };
  });

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { reset: { type: "boolean", default: false } },
  });
  const shouldReset = values.reset === true;

  const hashedPassword = await hashPassword(SEED_PASSWORD);

  const userIds = range(USER_COUNT).map(userUuid);
  const projectIds = range(PROJECT_COUNT).map(projectUuid);

  const legacyUsers = await prisma.user.findMany({
    where: { email: { in: LEGACY_SEED_EMAILS } },
    select: { id: true },
  });
  const knownUserIds = [...userIds, ...legacyUsers.map((user) => user.id)];

  const users = buildUsers(hashedPassword);
  const projects = buildProjects();
  const members = buildMembers();
  const tasks = buildTasks();

  await prisma.$transaction(async (tx) => {
    if (shouldReset) {
      // Полная пересборка тестовых данных: ровно 51/51/51.
      await tx.task.deleteMany();
      await tx.projectMember.deleteMany();
      await tx.project.deleteMany();
      await tx.user.deleteMany();
    } else {
      // Удаляем прежние данные сида в порядке, безопасном для FK.
      await tx.task.deleteMany({
        where: {
          OR: [{ userId: { in: knownUserIds } }, { projectId: { in: projectIds } }],
        },
      });
      await tx.projectMember.deleteMany({
        where: {
          OR: [{ userId: { in: knownUserIds } }, { projectId: { in: projectIds } }],
        },
      });
      await tx.project.deleteMany({
        where: {
          OR: [{ ownerId: { in: knownUserIds } }, { id: { in: projectIds } }],
        },
      });
      await tx.user.deleteMany({
        where: {
          OR: [{ id: { in: userIds } }, { email: { in: LEGACY_SEED_EMAILS } }],
        },
      });
    }

    await tx.user.createMany({ data: users });
    await tx.project.createMany({ data: projects });
    await tx.projectMember.createMany({ data: members });
    await tx.task.createMany({ data: tasks });
  });

  const [totalUsers, totalProjects, totalMembers, totalTasks] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.projectMember.count(),
    prisma.task.count(),
  ]);

  console.log(
    shouldReset
      ? "Сид выполнен с флагом --reset: таблицы пересобраны с нуля."
      : "Сид выполнен: данные сида пересобраны.",
  );
  console.log(
    `Создано сидом: users=${users.length}, projects=${projects.length}, ` +
      `projectMembers=${members.length}, tasks=${tasks.length}`,
  );
  console.log(
    `Всего в БД: users=${totalUsers}, projects=${totalProjects}, ` +
      `projectMembers=${totalMembers}, tasks=${totalTasks}`,
  );
  console.log("");
  console.log(`Базовый пароль всех тестовых аккаунтов: ${SEED_PASSWORD}`);
  console.log(`Аккаунты: ${seedEmail(1)} ... ${seedEmail(USER_COUNT)}`);

  const isExact =
    totalUsers === USER_COUNT &&
    totalProjects === PROJECT_COUNT &&
    totalTasks === TASK_COUNT;

  if (!isExact) {
    console.log("");
    console.log(
      "В таблицах есть и другие записи (созданные через API). " +
        "Для ровно 51/51/51 выполните: npx prisma db seed -- --reset",
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Ошибка при выполнении сида:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
