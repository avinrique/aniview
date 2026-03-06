import { Router } from "express"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import { authenticate, adminOnly } from "../middleware/auth.js"
import {
  listReels, createReel, toggleLike,
  listPending, approveReel, rejectReel, deleteReel,
} from "../controllers/reelController.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, "../../uploads"),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp4|webm|mov|avi|mkv)$/i
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true)
    } else {
      cb(new Error("Only video files are allowed"))
    }
  },
})

const router = Router()

// Public
router.get("/", listReels)

// Authenticated
router.post("/", authenticate, upload.single("video"), createReel)
router.post("/:id/like", authenticate, toggleLike)
router.delete("/:id", authenticate, deleteReel)

// Admin
router.get("/pending", authenticate, adminOnly, listPending)
router.put("/:id/approve", authenticate, adminOnly, approveReel)
router.put("/:id/reject", authenticate, adminOnly, rejectReel)

export default router
