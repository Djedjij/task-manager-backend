const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Мой API",
    description: "Документация сгенерирована автоматически",
  },
  host: "localhost:5000",
};

const outputFile = "./swagger-output.json";
const endpointsFiles = [
  "./src/routes/taskRouter.ts",
  "./src/routes/userRouter.ts",
  "./src/routes/projectRouter.ts",
  "./src/routes/authRouter.ts",
];

swaggerAutogen(outputFile, endpointsFiles, doc);
