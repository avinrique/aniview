import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import config from "./config/index.js"
import animeRoutes from "./routes/animeRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import analyticsRoutes from "./routes/analyticsRoutes.js"
import rateLimiter from "./middleware/rateLimiter.js"
import errorHandler from "./middleware/errorHandler.js"
import browserManager from "./services/browserManager.js"
import "dotenv/config"

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

// --- Routes ---
app.use("/api", animeRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/analytics", analyticsRoutes)

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
