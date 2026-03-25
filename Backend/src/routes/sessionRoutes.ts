
import express from "express";
import Session from "../models/Session";
import { getSessionSummary } from "../controllers/sessionController";
import { downloadSessionPDF } from "../controllers/sessionController";      
import { leaveSession,joinSession } from "../controllers/sessionController";
const router = express.Router();

router.get("/summary/:sessionId", getSessionSummary);
router.get("/summary/:sessionId/pdf", downloadSessionPDF); // ✅ FIXED: WAS CALLING WRONG CONTROLLER
router.post("/join", joinSession);
router.post("/leave", leaveSession);


router.get("/:code", async (req, res) => {
  try {
    const session = await Session.findOne({ code: req.params.code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Error fetching session" });
  }
});
router.get("/session/:sessionId", async (req, res) => {
  try {
    const session = await Session.findOne({
      code: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({
      students: session.students,
      questions: session.questions, 
      duration: session.duration || "N/A"
    });

  } catch (err) {
    res.status(500).json({ error: err });
  }
});
export default router;
