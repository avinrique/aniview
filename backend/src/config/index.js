import "dotenv/config"

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3007",
  cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 300,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 30,
  },
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS !== "false",
  },
  baseUrl: "https://animepahe.si",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/aniview",
  jwtSecret: process.env.JWT_SECRET || "aniview-dev-secret-change-in-production",
  jwtExpiry: process.env.JWT_EXPIRY || "7d",
}

export default config
