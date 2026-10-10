import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  next();
});

const allowedOrigins = new Set([
  process.env.APP_ORIGIN,
  ...(process.env.ALLOWED_ORIGINS ?? "").split(","),
].map((origin) => origin?.trim().replace(/\/+$/, "")).filter((origin): origin is string => Boolean(origin)));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, false);
    callback(null, allowedOrigins.has(origin.replace(/\/+$/, "")) ? origin : false);
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
}));
app.use(express.json({ limit: "24kb", strict: true }));

app.use("/api", router);
app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found." }));

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const statusCode = error && typeof error === "object" && "status" in error
    ? Number(error.status)
    : 500;
  if (statusCode === 400) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }
  if (statusCode === 413) {
    res.status(413).json({ error: "Request body is too large." });
    return;
  }
  logger.error({ statusCode }, "Unhandled API error");
  res.status(500).json({ error: "An unexpected server error occurred." });
};
app.use(errorHandler);

export default app;
