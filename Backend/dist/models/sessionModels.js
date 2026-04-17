"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const questionSchema = new mongoose_1.default.Schema({
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
const studentSchema = new mongoose_1.default.Schema({
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
const moodResponsesSchema = new mongoose_1.default.Schema({
    understood: {
        type: Number,
        default: 0
    },
    okay: {
        type: Number,
        default: 0
    },
    confused: {
        type: Number,
        default: 0
    }
}, { _id: false });
const moodSchema = new mongoose_1.default.Schema({
    active: {
        type: Boolean,
        default: false
    },
    responses: {
        type: moodResponsesSchema,
        default: () => ({
            understood: 0,
            okay: 0,
            confused: 0
        })
    },
    respondedStudents: {
        type: [String],
        default: []
    }
}, { _id: false });
const moodSummarySchema = new mongoose_1.default.Schema({
    totalResponses: {
        type: Number,
        default: 0
    },
    understood: {
        type: Number,
        default: 0
    },
    okay: {
        type: Number,
        default: 0
    },
    confused: {
        type: Number,
        default: 0
    },
    finalMood: {
        type: String,
        default: "Neutral 😐"
    }
}, { _id: false });
const sessionSchema = new mongoose_1.default.Schema({
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
    questions: {
        type: [questionSchema],
        default: []
    },
    students: {
        type: [studentSchema],
        default: []
    },
    mood: {
        type: moodSchema,
        default: () => ({
            active: false,
            responses: {
                understood: 0,
                okay: 0,
                confused: 0
            },
            respondedStudents: []
        })
    },
    moodSummary: {
        type: moodSummarySchema,
        default: null
    },
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
const Session = mongoose_1.default.model("Session", sessionSchema);
exports.default = Session;
