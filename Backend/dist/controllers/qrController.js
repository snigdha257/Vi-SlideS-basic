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
exports.submitQRQuestion = void 0;
const sessionModels_1 = __importDefault(require("../models/sessionModels"));
const submitQRQuestion = (req, res, io) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Create new question with source field
        const newQuestion = {
            id: Date.now().toString(),
            studentName: name,
            question: question.trim(),
            timestamp: new Date().toISOString(),
            email: email || undefined,
            source: "qr"
        };
        // Save question to database
        if (!session.questions) {
            session.questions = [];
        }
        // Push the question to the array
        session.questions.push(newQuestion);
        // Mark the questions array as modified before saving
        session.markModified('questions');
        yield session.save();
        console.log(`QR Question submitted to session ${sessionCode}:`, newQuestion);
        console.log(`Total questions in session now:`, session.questions.length);
        // Emit to all connected clients in the session room via Socket.IO
        io.to(sessionCode).emit('new-question', newQuestion);
        res.status(201).json({
            message: "Question submitted successfully",
            question: newQuestion
        });
    }
    catch (error) {
        console.error("Error submitting QR question:", error);
        res.status(500).json({
            message: "Failed to submit question"
        });
    }
});
exports.submitQRQuestion = submitQRQuestion;
