import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGetIP, handleCheckVPN } from "./routes/ip-detection";
import { handleActivateLicense } from "./routes/license";
import { handleDailyReset } from "./routes/daily-reset";
import { handleAIChat } from "./routes/ai";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // IP detection routes
  app.get("/api/get-ip", handleGetIP);
  app.post("/api/check-vpn", handleCheckVPN);

  // License activation route
  app.post("/api/activate-license", handleActivateLicense);

  // Daily reset route
  app.post("/api/daily-reset", handleDailyReset);

  // AI chat route
  app.post("/api/ai/chat", handleAIChat);

  return app;
}
