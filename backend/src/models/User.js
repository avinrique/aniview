import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  avatar: {
    type: String,
    default: "",
  },
  watchHistory: [{
    animeId: String,
    animeTitle: String,
    animeThumbnail: String,
    episodeNumber: Number,
    watchedAt: { type: Date, default: Date.now },
  }],
  favorites: [{
    animeId: String,
    animeTitle: String,
    animeThumbnail: String,
    addedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    watchHistory: this.watchHistory.slice(-50),
    favorites: this.favorites,
    createdAt: this.createdAt,
  }
}

export default mongoose.model("User", userSchema)
