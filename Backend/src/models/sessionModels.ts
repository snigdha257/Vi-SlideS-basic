import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  answer: {
    type: String
  },
  email: {
    type: String,
    default: null
  },
  source: {
    type: String,
    enum: ["session", "qr"],
    default: "session"
  },
  aiAnswer: {
    type: String
  },
  aiAnsweredAt: {
    type: Date
  }
});

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  }
});

const sessionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["active", "ended"],
    default: "active"
  },
  questions: [questionSchema],
  students: [studentSchema],
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: String
  }
});

const Session = mongoose.model("Session", sessionSchema);
export default Session;
