import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT ?? 5000;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ДокументацияAPI",
      version: "1.0.0",
      description: "Интерактивная документация для существующих эндпоиснтов",
    },
    servers: [
      {
        url: `http://localhost${5000}`,
        description: "Локальный сервер разработки",
      },
    ],
  },
  // Укажите пути к файлам, где вы будете писать комментарии.
  // Например, ко всем файлам в папке routes или контроллерам
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
