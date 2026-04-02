import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getQuestionsSummary } from "../utils/questionSummary";
import '../styles/sessionsummary.css'

const SessionSummary = () => {
  const [data, setData] = useState<any>(null);
  const [questionsSummary, setQuestionsSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/session/${sessionId}`
        );

        console.log("API Response:", res.data);
        const session = res.data.session;
        console.log("Session data:", session);

        const totalQuestions = session.questions?.length || 0;
        const totalStudents = session.students?.length || 0;
        const moodSummary = session.moodSummary || {};

        setData({
          totalQuestions,
          totalStudents,
          duration: session.duration || "N/A",
          students: session.students || [],
          questions: session.questions || [],
          moodSummary
        });

        // Fetch questions summary if there are questions
        if (totalQuestions > 0) {
          setSummaryLoading(true);
          const summary = await getQuestionsSummary(sessionId);
          setQuestionsSummary(summary);
          setSummaryLoading(false);
        }
      } catch (err) {
        console.log("Error fetching session", err);
        // Fallback to localStorage
        const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
        const found = sessions.find((s: any) => s.code === sessionId);

        if (found) {
          const totalQuestions = found.questions?.length || 0;
          let duration = "0 min";
          if (found.startTime && found.endTime) {
            const start = new Date(found.startTime);
            const end = new Date(found.endTime);
            const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
            duration = `${diff} min`;
          }

          setData({
            totalQuestions,
            totalStudents: found.students?.length || 0,
            duration,
            students: found.students || [],
            questions: found.questions || [],
            moodSummary: found.moodSummary || {}
          });

          // Fetch questions summary if there are questions
          if (totalQuestions > 0) {
            setSummaryLoading(true);
            const summary = await getQuestionsSummary(sessionId);
            setQuestionsSummary(summary);
            setSummaryLoading(false);
          }
        } else {
          console.log("Session not found");
        }
      }
    };

    fetchData();
  }, [sessionId]);

  const getMajorityMoods = (moodSummary: any) => {
  const understood = moodSummary?.understood || 0;
  const okay = moodSummary?.okay || 0;
  const confused = moodSummary?.confused || 0;

  if (understood === 0 && okay === 0 && confused === 0) {
    return "";
  }

  if (understood >= okay && understood >= confused) return "understood";
  if (okay >= understood && okay >= confused) return "okay";
  return "confused";
};

  const downloadSummaryPDF = () => {
    const doc = new jsPDF();

    doc.text("Session Summary", 14, 15);
    doc.text(`Total Students: ${data.totalStudents}`, 14, 25);
    doc.text(`Total Questions: ${data.totalQuestions}`, 14, 32);
    doc.text(`Duration: ${data.duration}`, 14, 39);

    const tableData = data.students.map((s: any) => [
      s.name,
      s.joinedAt ? new Date(s.joinedAt).toLocaleString() : "N/A",
      s.leftAt ? new Date(s.leftAt).toLocaleString() : "Active"
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Name", "Join Time", "Leave Time"]],
      body: tableData,
    });

    doc.save(`session-${sessionId}.pdf`);
  };

  const downloadQuestionsPDF = () => {
    const doc = new jsPDF();

    doc.text("Questions Report", 14, 15);

    if (!data.questions || data.questions.length === 0) {
      doc.text("No questions asked", 14, 30);
      doc.save(`questions-${sessionId}.pdf`);
      return;
    }

    const tableData = data.questions.map((q: any) => [
      q.studentName || "Unknown",
      q.question,
      q.answer || "No answer yet",
      q.aiAnswer ? `AI: ${q.aiAnswer}` : "N/A",
     
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Student", "Question", "Teacher Answer", "AI Answer",]],
      body: tableData,
    });

    doc.save(`questions-${sessionId}.pdf`);
  };

  if (!data) {
    return <div style={{ padding: "20px" }}>⏳ Loading summary...</div>;
  }

return (
  <div className="summary-container">
    <h1 className="summary-title">Session Summary</h1>

    {/* CARDS */}
    <div className="summary-cards">
      <div className="summary-card">
        <div className="summary-card-title">Total Students</div>
        <div className="summary-card-value">{data.totalStudents}</div>
      </div>

      <div className="summary-card">
        <div className="summary-card-title">Total Questions</div>
        <div className="summary-card-value">{data.totalQuestions}</div>
      </div>

      <div className="summary-card">
        <div className="summary-card-title">Duration</div>
        <div className="summary-card-value">{data.duration}</div>
      </div>

     {/* CLASS MOOD (MAJORITY) */}
{data.moodSummary && data.moodSummary.totalResponses > 0 && (
  <div className="summary-card">
    <div className="summary-card-title">Class Mood</div>
    <div className="summary-card-value" >
       {getMajorityMoods(data.moodSummary) === "understood"
        ? "EXCELLENT 👌"
        : getMajorityMoods(data.moodSummary) === "okay"
        ? "GOOD 🙂"
        : getMajorityMoods(data.moodSummary) === "confused"
        ? "OKAY 👍"
        : "No responses yet"
      }
    </div>
  </div>
)}
    </div>

    {/* ATTENDANCE */}
    <h2>Attendance</h2>
    {data.students.length === 0 ? (
      <p>No students joined</p>
    ) : (
      <ul className="summary-list">
        {data.students.map((s: any, index: number) => (
          <li key={index}>{s.name}</li>
        ))}
      </ul>
    )}

    {/* MOOD SUMMARY - AT THE BOTTOM */}
    {data.moodSummary?.totalResponses >= 0 && (
      <div className="mood-summary-section">
        <h2>Class Mood Check Results</h2>
        <div className="mood-summary-grid">
          <div className={`mood-summary-item understood ${getMajorityMoods(data.moodSummary) === 'understood' ? 'highlighted' : ''}`}>
            <div className="mood-summary-emoji">👍</div>
            <div className="mood-summary-label">Understood</div>
            <div className="mood-summary-count">{data.moodSummary.understood}</div>
          </div>
          <div className={`mood-summary-item okay ${getMajorityMoods(data.moodSummary) === 'okay' ? 'highlighted' : ''}`}>
            <div className="mood-summary-emoji">😐</div>
            <div className="mood-summary-label">Okay</div>
            <div className="mood-summary-count">{data.moodSummary.okay}</div>
          </div>
          <div className={`mood-summary-item confused ${getMajorityMoods(data.moodSummary) === 'confused' ? 'highlighted' : ''}`}>
            <div className="mood-summary-emoji">👎</div>
            <div className="mood-summary-label">Confused</div>
            <div className="mood-summary-count">{data.moodSummary.confused}</div>
          </div>
        </div>
        <div className="mood-summary-total">Total Responses: {data.moodSummary.totalResponses}</div>
      </div>
    )}

    {/* QUESTIONS SUMMARY SECTION */}
    {data.totalQuestions > 0 && (
      <div className="questions-summary-section">
        <h2>📊 Session Topics Overview</h2>
        {summaryLoading ? (
          <div className="summary-loading">⏳ Analyzing questions...</div>
        ) : (
          <div className="summary-content">
            {questionsSummary}
          </div>
        )}
      </div>
    )}

    {/* BUTTONS */}
    <div className="summary-buttons">
      <button onClick={downloadSummaryPDF} className="summary-btn">
        Download PDF
      </button>

      <button onClick={downloadQuestionsPDF} className="summary-btn">
        Download Questions
      </button>

      <button
        onClick={() => navigate("/teacher")}
        className="summary-btn secondary"
      >
        Back to Teacher Dashboard
      </button>
    </div>
  </div>
);



};


export default SessionSummary;