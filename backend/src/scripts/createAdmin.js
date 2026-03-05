// Usage: node src/scripts/createAdmin.js <username> <email> <password>
import mongoose from "mongoose"
import config from "../config/index.js"
import User from "../models/User.js"
import "dotenv/config"

const [,, username, email, password] = process.argv

if (!username || !email || !password) {
  console.log("Usage: node src/scripts/createAdmin.js <username> <email> <password>")
  process.exit(1)
}

await mongoose.connect(config.mongoUri)

const existing = await User.findOne({ $or: [{ email }, { username }] })
if (existing) {
  console.log("User with that email or username already exists")
  if (existing.role !== "admin") {
    existing.role = "admin"
    await existing.save()
    console.log(`Updated ${existing.username} to admin role`)
  }
} else {
  await User.create({ username, email, password, role: "admin" })
  console.log(`Admin user "${username}" created successfully`)
}

await mongoose.disconnect()
