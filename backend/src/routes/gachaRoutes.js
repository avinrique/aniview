import { Router } from "express"
import {
  getCoins, claimDailyLogin, singlePull, multiPull, getCollection, awardCoins,
} from "../controllers/gachaController.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

router.get("/coins", authenticate, getCoins)
router.post("/coins/daily", authenticate, claimDailyLogin)
router.post("/coins/award", authenticate, awardCoins)
router.post("/pull", authenticate, singlePull)
router.post("/pull-multi", authenticate, multiPull)
router.get("/collection", authenticate, getCollection)

export default router
