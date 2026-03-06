import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import path from "path"
import { fileURLToPath } from "url"
import config from "./config/index.js"
import animeRoutes from "./routes/animeRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import analyticsRoutes from "./routes/analyticsRoutes.js"
import reelRoutes from "./routes/reelRoutes.js"
import discussionRoutes from "./routes/discussionRoutes.js"
import ratingRoutes from "./routes/ratingRoutes.js"
import achievementRoutes from "./routes/achievementRoutes.js"
import gachaRoutes from "./routes/gachaRoutes.js"
import rateLimiter from "./middleware/rateLimiter.js"
import errorHandler from "./middleware/errorHandler.js"
import browserManager from "./services/browserManager.js"
import "dotenv/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// --- Middleware ---
app.use(
  cors({
    origin: config.frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
)
app.use(express.json())
app.use("/api", rateLimiter)

// Serve uploaded videos as static files
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")))

// --- Routes ---
app.use("/api", animeRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/reels", reelRoutes)
app.use("/api/chat", discussionRoutes)
app.use("/api/ratings", ratingRoutes)
app.use("/api/achievements", achievementRoutes)
app.use("/api/gacha", gachaRoutes)

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }))

// --- Error handling ---
app.use(errorHandler)

// --- Connect MongoDB & Start server ---
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("MongoDB connected")
    app.listen(config.port, () => {
      console.log(`Backend running on http://localhost:${config.port}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message)
    console.log("Starting without MongoDB — auth & analytics disabled")
    app.listen(config.port, () => {
      console.log(`Backend running on http://localhost:${config.port} (no DB)`)
    })
  })

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...")
  await browserManager.close()
  await mongoose.disconnect()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
