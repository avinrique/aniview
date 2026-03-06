import { Router } from "express"
import { authenticate } from "../middleware/auth.js"
import {
  getMessages, sendMessage, deleteMessage, getActiveChats,
} from "../controllers/discussionController.js"

const router = Router()

router.get("/active", getActiveChats)
router.get("/:animeId", getMessages)
router.post("/:animeId", authenticate, sendMessage)
router.delete("/message/:id", authenticate, deleteMessage)

export default router
