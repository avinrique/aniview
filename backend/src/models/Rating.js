import mongoose from "mongoose"

const ratingSchema = new mongoose.Schema({
  animeId: { type: String, required: true },
  animeTitle: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
}, { timestamps: true })

ratingSchema.index({ animeId: 1, userId: 1 }, { unique: true })

export default mongoose.model("Rating", ratingSchema)
