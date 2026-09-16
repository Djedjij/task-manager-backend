const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Мой API",
    description: "Документация сгенерирована автоматически",
  },
  host: "localhost:5000",
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/taskRouter.ts", "./routes/userRouter.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);
