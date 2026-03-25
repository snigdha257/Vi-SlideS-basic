import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  code: { type: String, required: true }, // ✅ ADD THIS

  students: [
    {
      name: String,
      email: String,
     joinedAt: { type: Date, default: Date.now },
leftAt: { type: Date, default: null }      
    }
  ],
  questions: [{ question: String,studentName: String, timestamp: Date }],
  duration: String
});

export default mongoose.model("Session", sessionSchema);