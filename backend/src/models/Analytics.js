import mongoose from "mongoose"

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["page_view", "anime_view", "episode_watch", "search"],
    index: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  sessionId: { type: String, required: true },
  animeId: String,
  animeTitle: String,
  episodeNumber: Number,
  searchQuery: String,
  ip: String,
  country: String,
  city: String,
  userAgent: String,
  referrer: String,
  path: String,
}, { timestamps: true })

eventSchema.index({ createdAt: -1 })
eventSchema.index({ type: 1, createdAt: -1 })
eventSchema.index({ animeTitle: 1, type: 1 })

export default mongoose.model("AnalyticsEvent", eventSchema)
