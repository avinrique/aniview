import mongoose from "mongoose"

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  characterId: { type: String, required: true },
  obtainedAt: { type: Date, default: Date.now },
})

collectionSchema.index({ userId: 1, characterId: 1 })

export default mongoose.model("Collection", collectionSchema)
