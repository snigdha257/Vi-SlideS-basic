import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import '../styles/sessionsummary.css'

const SessionSummary = () => {
  const [data, setData] = useState<any>(null);
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

        setData({
          totalQuestions,
          totalStudents,
          duration: session.duration || "N/A",
          students: session.students || [],
          questions: session.questions || []
        });
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
            questions: found.questions || []
          });
        } else {
          console.log("Session not found");
        }
      }
    };

    fetchData();
  }, [sessionId]);

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
      q.timestamp ? new Date(q.timestamp).toLocaleString() : "N/A"
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Student", "Question", "Answer", "Time"]],
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