"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAIForQuestion = void 0;
const sessionModels_1 = __importDefault(require("../models/sessionModels"));
const aiService_1 = require("../services/aiService");
const askAIForQuestion = (req, res, io) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { sessionCode, questionId } = req.params;
        // Validate required fields
        if (!sessionCode || !questionId) {
            return res.status(400).json({
                message: "Session code and question ID are required"
            });
        }
        // Check if session exists
        const session = yield sessionModels_1.default.findOne({ code: sessionCode });
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
        const question = (_a = session.questions) === null || _a === void 0 ? void 0 : _a.find((q) => q.id === questionId);
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
        const aiAnswer = yield (0, aiService_1.askAI)(question.question);
        // Update the question with AI answer
        question.aiAnswer = aiAnswer;
        question.aiAnsweredAt = new Date();
        // Mark the questions array as modified before saving
        session.markModified('questions');
        yield session.save();
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
    }
    catch (error) {
        console.error("Error generating AI answer:", error);
        res.status(500).json({
            message: "Failed to generate AI answer"
        });
    }
});
exports.askAIForQuestion = askAIForQuestion;
