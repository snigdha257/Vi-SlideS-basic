import Session from "../models/sessionModels";
import { Server as SocketIOServer } from 'socket.io';

interface Question {
  id: string;
  studentName: string;
  question: string;
  timestamp: string;
  answer?: string;
  email?: string;
  source: string;
  aiAnswer?: string;
  aiAnsweredAt?: string;
}

export const submitQRQuestion = async (
  req: any,
  res: any,
  io: SocketIOServer
) => {
  try {
    const { sessionCode } = req.params;
    const { name, email, question } = req.body;

    // Validate required fields
    if (!name || !question) {
      return res.status(400).json({
        message: "Name and question are required"
      });
    }

    if (!sessionCode) {
      return res.status(400).json({
        message: "Session code is required"
      });
    }

    // Check if session exists
    const session = await Session.findOne({ code: sessionCode });
    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    // Check if session is still active
    if (session.status === "ended") {
      return res.status(410).json({
        message: "Session has ended"
      });
    }

    // Create new question with source field
    const newQuestion: Question = {
      id: Date.now().toString(),
      studentName: name,
      question: question.trim(),
      timestamp: new Date().toISOString(),
      email: email || undefined,
      source: "qr"
    };

    // Save question to database
    if (!session.questions) {
      session.questions = [] as any;
    }
    
    // Push the question to the array
    session.questions.push(newQuestion as any);
    
    // Mark the questions array as modified before saving
    session.markModified('questions');
    await session.save();

    console.log(`QR Question submitted to session ${sessionCode}:`, newQuestion);
    console.log(`Total questions in session now:`, session.questions.length);

    // Emit to all connected clients in the session room via Socket.IO
    io.to(sessionCode).emit('new-question', newQuestion);

    res.status(201).json({
      message: "Question submitted successfully",
      question: newQuestion
    });
  } catch (error) {
    console.error("Error submitting QR question:", error);
    res.status(500).json({
      message: "Failed to submit question"
    });
  }
};