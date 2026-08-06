import { RequestHandler } from "express";
import correlator from "express-correlation-id";

export const loggingMiddleware: RequestHandler = (req, res, next) => {
  const correlationId = correlator.getId();

  const startTime = Date.now();

  (res as any).on("finish", () => {
    const duration = Date.now() - startTime;
    const logInfo = {
      timestamp: new Date().toISOString(),
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };
    console.log(logInfo);
  });

  next();
};
