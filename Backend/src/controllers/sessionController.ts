import mongoose from "mongoose";
import Session from "../models/sessionModels";
import PDFDocument from "pdfkit";
import { Request, Response } from "express";

export const submitMood = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { moodType } = req.body; // understood | okay | confused

    const session = await Session.findOne({ code: sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // ✅ ENSURE moodSummary EXISTS
    if (!session.moodSummary) {
      session.moodSummary = {
        totalResponses: 0,
        understood: 0,
        okay: 0,
        confused: 0,
        finalMood: "understood"
      };
    }

    // ✅ UPDATE COUNTS
    session.moodSummary.totalResponses += 1;
    (session.moodSummary as any)[moodType] += 1;

    // ✅ STORE LATEST RESPONSE
    session.moodSummary.lastMood = moodType;

    // ✅ CALCULATE MAJORITY
    const { understood = 0, okay = 0, confused = 0 } = session.moodSummary;

    let finalMood = "understood";

    if (okay >= understood && okay >= confused) finalMood = "okay";
    if (confused >= understood && confused >= okay) finalMood = "confused";

    session.moodSummary.finalMood = finalMood;

    await session.save();

    res.json({
      sessionId: session._id,
      totalQuestions: session.questions?.length || 0,
      totalStudents: session.students?.length || 0,
      duration: session.duration || "N/A",
      moodSummary: session.moodSummary,
      students: (session.students || []).map((s: any) => ({
        name: s?.name,
        joinedAt: s?.joinedAt,
        leftAt: s?.leftAt
      }))
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getSessionSummary = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ code: sessionId })
      .populate("students")
      .populate("questions");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const ms = (session.moodSummary || {}) as any;

    const understood = ms.understood || 0;
    const okay = ms.okay || 0;
    const confused = ms.confused || 0;

    // ✅ CALCULATE FINAL MOOD ALWAYS
    let finalMood = "";

    if (understood === 0 && okay === 0 && confused === 0) {
      finalMood = "";
    } else if (understood >= okay && understood >= confused) {
      finalMood = "understood";
    } else if (okay >= understood && okay >= confused) {
      finalMood = "okay";
    } else {
      finalMood = "confused";
    }

    res.json({
      session: {
        totalQuestions: session.questions?.length || 0,
        totalStudents: session.students?.length || 0,
        duration: session.duration || "N/A",
        students: session.students || [],
        questions: session.questions || [],
        moodSummary: {
          totalResponses: ms.totalResponses || 0,
          understood,
          okay,
          confused,
          lastMood: ms.lastMood || "",
          finalMood   // ✅ ALWAYS SENT CORRECTLY
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const downloadSessionPDF = async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;
    //get session from db
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
doc.fontSize(20).text("Session Summary", { align: "center" });
doc.moveDown();
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
export const joinSession = async (req: any, res: any) => {
  try {
    const { code, name, email } = req.body;

    const session = await Session.findOne({ code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // push student
    session.students.push({
      name,
      email,
      joinedAt: new Date()
    });

    await session.save();

    res.json({ message: "Joined session successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const leaveSession = async (req: any, res: any) => {
  try {
    const { code, email } = req.body;

    const session = await Session.findOne({ code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // find student by email
    const student = session.students.find((s: any) => s.email === email);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // set leave time
    student.leftAt = new Date();

    await session.save();

    res.json({ message: "Session ended for student" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
  
};