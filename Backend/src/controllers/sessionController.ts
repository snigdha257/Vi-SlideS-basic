import mongoose from "mongoose";
import Session from "../models/Session";
import PDFDocument from "pdfkit";

export const getSessionSummary = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    // ❌ REMOVE ObjectId validation (IMPORTANT)
    // if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    //   return res.status(400).json({ message: "Invalid session ID" });
    // }

    // ✅ FIND BY session CODE instead of _id
   const session = await Session.findOne({ code: sessionId })
  .populate("students")
  .populate("questions");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    console.log("SESSION FOUND:", session);

    res.json({
      sessionId: session._id,
      totalQuestions: session.questions?.length || 0,
      totalStudents: session.students?.length || 0,
      duration: session.duration || "N/A",
      students: (session.students || []).map((s: any) => ({
  name: s?.name,
  joinedAt: s?.joinedAt,
  leftAt: s?.leftAt
}))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const downloadSessionPDF = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    // 🔥 Get session from DB
  const session = await Session.findOne({ code: sessionId })
  .populate("students");

if (!session) {
  return res.status(404).json({ message: "Session not found" });
}

const doc = new PDFDocument();

res.setHeader("Content-Type", "application/pdf");
res.setHeader(
  "Content-Disposition",
  `attachment; filename=session-${sessionId}.pdf`
);

doc.pipe(res);

// TITLE
doc.fontSize(20).text("Session Summary", { align: "center" });
doc.moveDown();

// BASIC INFO
doc.fontSize(14).text(`Session Code: ${session.code}`);
doc.text(`Total Students: ${session.students?.length || 0}`);
doc.moveDown();

// ATTENDANCE
doc.fontSize(16).text("Attendance List:");
doc.moveDown();

(session.students || []).forEach((s: any, index: number) => {
  const joinTime = s?.joinedAt
    ? new Date(s.joinedAt).toLocaleTimeString()
    : "N/A";

  const leaveTime = s?.leftAt
    ? new Date(s.leftAt).toLocaleTimeString()
    : "Still Active";

  doc.fontSize(12).text(
    `${index + 1}. ${s?.name || "Unknown"} | Joined: ${joinTime} | Left: ${leaveTime}`
  );
});

doc.end();
  } catch (error: any) {
  console.error("PDF ERROR 👉", error);

  res.status(500).json({
    message: "PDF generation failed",
    error: error.message
  });
}
};