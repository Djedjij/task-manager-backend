import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import correlator from "express-correlation-id";
import cors from "cors";
import { AppError } from "./errors/AppError";

// middlewares
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { loggingMiddleware } from "./middlewares/loggingMiddleware";

// swagger для документации
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

//routes
import usersRouter from "./routes/userRouter";
import taskRouter from "./routes/taskRouter";

import { corsOptions } from "./helpers/corsOptions";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT ?? 5000;

// Middlewares
app.use(express.json());
app.use(correlator());
app.use(loggingMiddleware);
app.use(cors(corsOptions));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/users", usersRouter);
app.use("/tasks", taskRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not ready" });
  }
});

// Обработка 404 для несуществующих маршрутов
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Глобальный middleware для ошибок — ВСЕГДА последним!
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
