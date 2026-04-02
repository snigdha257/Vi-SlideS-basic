import express from "express";
import { Server as SocketIOServer } from 'socket.io';
import Session from "../models/sessionModels";
import { authenticateToken } from "../middleware/authMiddleware";
import { submitQRQuestion } from "../controllers/qrController";
import { askAIForQuestion } from "../controllers/aiController";
import { generateQuestionsummarY } from "../services/aiService";

export default function(io: SocketIOServer) {
  const router = express.Router();

  // Create a new session
  router.post("/create-session", authenticateToken, async (req: any, res: any) => {
    try {
      const { code, name } = req.body;

      if (!code || !name) {
        return res.status(400).json({ message: "Session code and name are required" });
      }

      // Check if session already exists
      const existing = await Session.findOne({ code });
      if (existing) {
        return res.status(400).json({ message: "Session code already exists" });
      }

      const newSession = new Session({
        code,
        name,
        createdBy: req.user.email,
        status: "active",
        startTime: new Date()// Set start time when session is created
      });

      await newSession.save();
      res.status(201).json({
        message: "Session created successfully",
        session: newSession
      });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Get session by code
  router.get("/session/:code", async (req: any, res: any) => {
    try {
      const { code } = req.params;
      console.log(`Fetching session ${code} from DB`);

      const session = await Session.findOne({ code });

      if (!session) {
        console.log(`Session ${code} not found in DB`);
        return res.status(404).json({ message: "Session not found" });
      }

      console.log(`Session ${code} found:`, {
        questions: session.questions?.length || 0,
        students: session.students?.length || 0,
        duration: session.duration,
        status: session.status
      });

      res.status(200).json({
        message: "Session found",
        session
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Get all sessions for a teacher
  router.get("/teacher-sessions", authenticateToken, async (req: any, res: any) => {
    try {
      const sessions = await Session.find({ createdBy: req.user.email });
      res.status(200).json({
        message: "Sessions retrieved",
        sessions
      });
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // End a session
  router.patch("/session/:code/end", authenticateToken, async (req: any, res: any) => {
    try {
      const { code } = req.params;

      const session = await Session.findOne({ code });
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      session.status = "ended";
      await session.save();

      res.status(200).json({
        message: "Session ended",
        session
      });
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  // QR-based question submission - GET (serve form page or redirect)
  router.get("/ask/:sessionCode", async (req: any, res: any) => {
    const { sessionCode } = req.params;
    
    // Check if session exists
    try {
      const session = await Session.findOne({ code: sessionCode });
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
    } catch (error) {
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
  });

  // QR-based question submission (public endpoint - no authentication required)
  router.post("/ask/:sessionCode", async (req: any, res: any) => {
    await submitQRQuestion(req, res, io);
  });

  // Ask AI for a question (teacher only)
  router.post("/session/:sessionCode/question/:questionId/ask-ai", authenticateToken, async (req: any, res: any) => {
    await askAIForQuestion(req, res, io);
  });

  // Get questions summary from AI
  router.get("/session/:code/questions-summary", async (req: any, res: any) => {
    try {
      const { code } = req.params;

      const session = await Session.findOne({ code });
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (!session.questions || session.questions.length === 0) {
        return res.status(200).json({
          message: "No questions in session",
          summary: "No questions were asked during this session."
        });
      }

      const summary = await generateQuestionsummarY(session.questions);

      res.status(200).json({
        message: "Questions summary generated",
        summary
      });
    } catch (error) {
      console.error("Error generating questions summary:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  return router;
}
