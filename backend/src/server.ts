import "dotenv/config";
import campaignRouter from "./routes/campaign.routes.js";
import express from "express";
import cors from "cors";
import { logInfo } from "./lib/logger.js";
import { senderRouter } from "./routes/sender.routes.js";
import emailcampaignRouter from "./routes/email-campaign.routes.js";
import passport from "./config/passport.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(passport.initialize());
app.use(cookieParser());
// campaign routes
app.use("/api/v1/campaigns", campaignRouter);
app.use("/api/v1/sender",senderRouter);
app.use("/api/v1/email-campaign",emailcampaignRouter);
app.use("/api/v1/auth", authRouter);

const PORT = process.env.PORT != null ? Number(process.env.PORT) : 3000;

app.listen(PORT, "0.0.0.0", () => {
  logInfo("server.booted", {
    port: PORT,
  });
});

export default app;