import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  animeId: { type: String, required: true, index: true },
  animeTitle: { type: String, required: true },
  episodeNumber: { type: Number, default: null }, // null = general anime chat
  message: { type: String, required: true, maxlength: 1000 },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true })

messageSchema.index({ animeId: 1, episodeNumber: 1, createdAt: -1 })

export default mongoose.model("ChatMessage", messageSchema)
