import { Router } from "express"
import { authenticate } from "../middleware/auth.js"
import { getAchievements, checkAndUnlock } from "../controllers/achievementController.js"

const router = Router()

// Get current user's achievements
router.get("/", authenticate, async (req, res) => {
  try {
    // Also check for new unlocks
    await checkAndUnlock(req.userId)
    const achievements = await getAchievements(req.userId)
    res.json({ achievements })
  } catch (err) {
    res.status(500).json({ error: "Failed to load achievements" })
  }
})

// Get any user's public achievements
router.get("/:userId", async (req, res) => {
  try {
    const achievements = await getAchievements(req.params.userId)
    res.json({ achievements })
  } catch (err) {
    res.status(500).json({ error: "Failed to load achievements" })
  }
})

export default router
