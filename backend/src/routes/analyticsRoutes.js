import { Router } from "express"
import { trackEvent, getDashboard } from "../controllers/analyticsController.js"
import { authenticate, adminOnly, optionalAuth } from "../middleware/auth.js"

const router = Router()

router.post("/track", optionalAuth, trackEvent)
router.get("/dashboard", authenticate, adminOnly, getDashboard)

export default router
