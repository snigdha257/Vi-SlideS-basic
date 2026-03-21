import express from "express";
import Session from "../models/sessionModels";
import { authenticateToken } from "../middleware/authMiddleware";

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
      status: "active"
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

    const session = await Session.findOne({ code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

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

export default router;
