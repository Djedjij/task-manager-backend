import cors from "cors";

// Список сайтов, которым разрешено делать запросы к вашему API
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://my-production-app.com",
];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // !origin нужен для инструментов вроде Postman или Server-to-Server запросов
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS policy"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Correlation-ID"], // Разрешаем наш correlation id!
  credentials: true, // Разрешает отправку кук (cookies) и заголовков авторизации
  optionsSuccessStatus: 200, // Для старых браузеров (SmartTV, IE11)
};

// Применяем настроенный CORS
