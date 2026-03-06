import mongoose from "mongoose"

const reelSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["upload", "youtube", "instagram"],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },
  // For uploaded videos — path relative to uploads/
  videoFile: { type: String, default: "" },
  // For youtube/instagram embeds — the embed URL or video ID
  embedUrl: { type: String, default: "" },
  // Thumbnail (auto-generated or provided)
  thumbnail: { type: String, default: "" },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true })

export default mongoose.model("Reel", reelSchema)
