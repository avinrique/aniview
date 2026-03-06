import { Router } from "express"
import {
  register, login, getProfile, updateProfile,
  addFavorite, removeFavorite, addWatchHistory, updateWatchProgress,
} from "../controllers/authController.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.get("/profile", authenticate, getProfile)
router.put("/profile", authenticate, updateProfile)
router.post("/favorites", authenticate, addFavorite)
router.delete("/favorites/:animeId", authenticate, removeFavorite)
router.post("/watch-history", authenticate, addWatchHistory)
router.put("/watch-progress", authenticate, updateWatchProgress)

export default router
