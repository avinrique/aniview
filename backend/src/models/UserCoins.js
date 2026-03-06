import mongoose from "mongoose"

const userCoinsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  totalEarned: { type: Number, default: 0, min: 0 },
  lastDailyLogin: { type: Date, default: null },
  watchStreak: { type: Number, default: 0 },
  lastWatchDate: { type: Date, default: null },
})

export default mongoose.model("UserCoins", userCoinsSchema)
