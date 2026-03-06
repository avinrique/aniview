import { Router } from "express"
import { authenticate, optionalAuth } from "../middleware/auth.js"
import { rateAnime, getAnimeRating } from "../controllers/ratingController.js"

const router = Router()

router.post("/", authenticate, rateAnime)
router.get("/:animeId", optionalAuth, getAnimeRating)

export default router
