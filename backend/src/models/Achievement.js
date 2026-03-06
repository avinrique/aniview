import mongoose from "mongoose"

const BADGES = [
  "first_watch",
  "binge_watcher",
  "night_owl",
  "genre_explorer_action",
  "genre_explorer_romance",
  "episodes_10",
  "episodes_50",
  "episodes_100",
  "episodes_500",
  "completionist",
  "social_butterfly",
  "critic_10",
]

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  badge: { type: String, enum: BADGES, required: true },
  unlockedAt: { type: Date, default: Date.now },
})

achievementSchema.index({ userId: 1, badge: 1 }, { unique: true })

export { BADGES }
export default mongoose.model("Achievement", achievementSchema)
