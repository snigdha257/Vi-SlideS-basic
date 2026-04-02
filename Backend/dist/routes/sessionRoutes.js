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
exports.default = default_1;
const express_1 = __importDefault(require("express"));
const sessionModels_1 = __importDefault(require("../models/sessionModels"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const qrController_1 = require("../controllers/qrController");
const aiController_1 = require("../controllers/aiController");
function default_1(io) {
    const router = express_1.default.Router();
    // Create a new session
    router.post("/create-session", authMiddleware_1.authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { code, name } = req.body;
            if (!code || !name) {
                return res.status(400).json({ message: "Session code and name are required" });
            }
            // Check if session already exists
            const existing = yield sessionModels_1.default.findOne({ code });
            if (existing) {
                return res.status(400).json({ message: "Session code already exists" });
            }
            const newSession = new sessionModels_1.default({
                code,
                name,
                createdBy: req.user.email,
                status: "active",
                startTime: new Date() // Set start time when session is created
            });
            yield newSession.save();
            res.status(201).json({
                message: "Session created successfully",
                session: newSession
            });
        }
        catch (error) {
            console.error("Error creating session:", error);
            res.status(500).json({ message: "Failed to create session" });
        }
    }));
    // Get session by code
    router.get("/session/:code", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const { code } = req.params;
            console.log(`Fetching session ${code} from DB`);
            const session = yield sessionModels_1.default.findOne({ code });
            if (!session) {
                console.log(`Session ${code} not found in DB`);
                return res.status(404).json({ message: "Session not found" });
            }
            console.log(`Session ${code} found:`, {
                questions: ((_a = session.questions) === null || _a === void 0 ? void 0 : _a.length) || 0,
                students: ((_b = session.students) === null || _b === void 0 ? void 0 : _b.length) || 0,
                duration: session.duration,
                status: session.status
            });
            res.status(200).json({
                message: "Session found",
                session
            });
        }
        catch (error) {
            console.error("Error fetching session:", error);
            res.status(500).json({ message: "Failed to fetch session" });
        }
    }));
    // Get all sessions for a teacher
    router.get("/teacher-sessions", authMiddleware_1.authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const sessions = yield sessionModels_1.default.find({ createdBy: req.user.email });
            res.status(200).json({
                message: "Sessions retrieved",
                sessions
            });
        }
        catch (error) {
            console.error("Error fetching sessions:", error);
            res.status(500).json({ message: "Failed to fetch sessions" });
        }
    }));
    // End a session
    router.patch("/session/:code/end", authMiddleware_1.authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { code } = req.params;
            const session = yield sessionModels_1.default.findOne({ code });
            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }
            session.status = "ended";
            yield session.save();
            res.status(200).json({
                message: "Session ended",
                session
            });
        }
        catch (error) {
            console.error("Error ending session:", error);
            res.status(500).json({ message: "Failed to end session" });
        }
    }));
    // QR-based question submission - GET (serve form page or redirect)
    router.get("/ask/:sessionCode", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { sessionCode } = req.params;
        // Check if session exists
        try {
            const session = yield sessionModels_1.default.findOne({ code: sessionCode });
            if (!session) {
                return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Session Not Found</title>
              <style>
                body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; }
                .container { text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>❌ Session Not Found</h1>
                <p>The session code you're trying to access doesn't exist or has ended.</p>
                <p>Please check the QR code and try again.</p>
              </div>
            </body>
          </html>
        `);
            }
            if (session.status === 'ended') {
                return res.status(410).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Session Ended</title>
              <style>
                body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; }
                .container { text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>⏱️ Session Ended</h1>
                <p>This session has ended and is no longer accepting questions.</p>
              </div>
            </body>
          </html>
        `);
            }
        }
        catch (error) {
            console.error("Error checking session:", error);
        }
        // Get the current host and port
        const host = req.get('host') || 'localhost:5000';
        const isLocalhost = host.includes('localhost');
        // For localhost (development), redirect to frontend dev server
        if (isLocalhost) {
            return res.redirect(302, `http://localhost:5173/ask/${sessionCode}`);
        }
        // For network IPs (mobile/production), also try port 5173 first, fallback to current port
        const protocol = req.protocol || 'http';
        res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loading...</title>
          <script>
            // Extract host without the port
            const currentHost = window.location.hostname;
            // Try frontend dev server first (port 5173)
            const devUrl = 'http://' + currentHost + ':5173/ask/${sessionCode}';
            window.location.href = devUrl;
          </script>
        </head>
        <body>
          <p>Redirecting...</p>
        </body>
      </html>
    `);
    }));
    // QR-based question submission (public endpoint - no authentication required)
    router.post("/ask/:sessionCode", (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield (0, qrController_1.submitQRQuestion)(req, res, io);
    }));
    // Ask AI for a question (teacher only)
    router.post("/session/:sessionCode/question/:questionId/ask-ai", authMiddleware_1.authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield (0, aiController_1.askAIForQuestion)(req, res, io);
    }));
    return router;
}
