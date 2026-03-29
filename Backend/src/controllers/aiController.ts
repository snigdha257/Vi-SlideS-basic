import Session from "../models/sessionModels";
import { Server as SocketIOServer } from 'socket.io';
import { askAI } from "../services/aiService";

export const askAIForQuestion = async (
  req: any,
  res: any,
  io: SocketIOServer
) => {
  try {
    const { sessionCode, questionId } = req.params;

    // Validate required fields
    if (!sessionCode || !questionId) {
      return res.status(400).json({
        message: "Session code and question ID are required"
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

    // Find the question
    const question = session.questions?.find((q: any) => q.id === questionId);
    if (!question) {
      return res.status(404).json({
        message: "Question not found"
      });
    }

    // Check if question already has an AI answer
    if (question.aiAnswer) {
      return res.status(400).json({
        message: "AI answer already exists for this question"
      });
    }

    // Get AI response
    const aiAnswer = await askAI(question.question);

    // Update the question with AI answer
    question.aiAnswer = aiAnswer;
    question.aiAnsweredAt = new Date();

    // Mark the questions array as modified before saving
    session.markModified('questions');
    await session.save();

    console.log(`AI answered question ${questionId} in session ${sessionCode}`);

    // Emit AI response to all connected clients in the session room
    io.to(sessionCode).emit('ai-answer', {
      questionId: questionId,
      question: question.question,
      answer: aiAnswer,
      source: "AI"
    });

    res.status(200).json({
      message: "AI answer generated successfully",
      aiAnswer
    });
  } catch (error) {
    console.error("Error generating AI answer:", error);
    res.status(500).json({
      message: "Failed to generate AI answer"
    });
  }
};