import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { mealDbRouter } from "./routes/mealdb.js";

dotenv.config();

export function createApp() {
  const app = express();
  const clientOrigin =
    process.env.CLIENT_ORIGIN ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173");

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: clientOrigin,
      methods: ["GET"],
    }),
  );

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", mealDbRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      error: "Unexpected server error",
    });
  };

  app.use(errorHandler);

  return app;
}
