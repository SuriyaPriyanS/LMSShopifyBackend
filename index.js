import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dbConnect from "./Database/db.js";
import { verifyRequest } from "./middleware/verifyRequest.js";
import authRouters from "./Routers/auth.js";
import webhookRoutes from "./Routers/webhooks.js";
import dashboardRoutes from "./Routers/dashboard.js";
import courseRoutes from "./Routers/courses.js";
import studentRoutes from "./Routers/students.js";
import enrollmentRoutes from "./Routers/enrollments.js";
import shopRoutes from "./Routers/shop.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 4000;

async function main() {
  await dbConnect();

  const app = express();

  app.use(cors());
  app.use(cookieParser());

  app.use(
    "/api/webhooks",
    express.raw({ type: "application/json" }),
    (req, _res, next) => {
      req.rawBody = req.body;
      next();
    }
  );

  app.use("/api/webhooks", webhookRoutes);
  app.use(express.json());

  app.use("/api/auth", authRouters);
  app.use("/api/dashboard", verifyRequest, dashboardRoutes);
  app.use("/api/courses", verifyRequest, courseRoutes);
  app.use("/api/students", verifyRequest, studentRoutes);
  app.use("/api/enrollments", verifyRequest, enrollmentRoutes);
  app.use("/api", verifyRequest, shopRoutes);

  const webDist = path.join(__dirname, "..", "web", "dist");
  app.use(express.static(webDist));

  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();

    res.set(
      "Content-Security-Policy",
      "frame-ancestors https://*.myshopify.com https://admin.shopify.com"
    );

    res.sendFile(path.join(webDist, "index.html"));
  });

  app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});