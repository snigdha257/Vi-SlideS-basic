import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  code: { type: String, required: true }, // ✅ ADD THIS

  students: [
    {
      name: String,
      email: String,
      joinedAt: String,
      leftAt: String
    }
  ],

  questions: [{ question: String }],

  duration: String
});

export default mongoose.model("Session", sessionSchema);