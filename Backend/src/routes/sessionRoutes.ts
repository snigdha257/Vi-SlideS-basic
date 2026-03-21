
import express from "express";
import { getSessionSummary } from "../controllers/sessionController";
import { downloadSessionPDF } from "../controllers/sessionController";      

const router = express.Router();

router.get("/summary/:sessionId", getSessionSummary);
router.get("/summary/:sessionId/pdf", downloadSessionPDF); // ✅ FIXED: WAS CALLING WRONG CONTROLLER

export default router;