import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable  from "jspdf-autotable";

const SessionSummary = () => {
  const [data, setData] = useState<any>(null);
  const { sessionId } = useParams();
  const navigate = useNavigate();
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
    q.timestamp
      ? new Date(q.timestamp).toLocaleString()
      : "N/A"
  ]);

  autoTable(doc, {
    startY: 30,
    head: [["Student", "Question", "Time"]],
    body: tableData,
  });

  doc.save(`questions-${sessionId}.pdf`);
};
    
useEffect(() => {
  if (!sessionId) return;

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/session/${sessionId}`
      );

      const session = res.data;

      const totalQuestions = session.questions?.length || 0;
      const totalStudents = session.students?.length || 0;

      setData({
        totalQuestions,
        totalStudents,
        duration: session.duration || "N/A",
        students: session.students || [],
        questions:session.questions || []
      });
    console.log("Questions:", session.questions);
    } catch (err) {
      console.log("Error fetching session", err);
    }
  };

  fetchData();
}, [sessionId]);
  if (!data) {
    return <div style={{ padding: "20px" }}>⏳ Loading summary...</div>;
  }

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "auto" }}>
      <h1 style={{ textAlign: "center" }}>📊 Session Summary</h1>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "30px",
        gap: "20px"
      }}>
        <div style={cardStyle}>
          <p>Total Questions</p>
          <h2>{data.totalQuestions}</h2>
        </div>

        <div style={cardStyle}>
          <p>Total Students</p>
          <h2>{data.totalStudents}</h2>
        </div>

        <div style={cardStyle}>
          <p>Duration</p>
          <h2>{data.duration}</h2>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h3>📋 Attendance</h3>

        {data.students?.length === 0 ? (
          <p>No students joined</p>
        ) : (
          <ul>
            {data.students.map((s: any, index: number) => (
             <li key={index}>
                 {s.name}
                      </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "40px", display: "flex", gap: "20px" }}>
        <button
          onClick={() => {
  const doc = new jsPDF();

  doc.text("Session Summary", 14, 15);

  doc.text(`Total Students: ${data.totalStudents}`, 14, 25);
  doc.text(`Total Questions: ${data.totalQuestions}`, 14, 32);
  doc.text(`Duration: ${data.duration}`, 14, 39);

  // 👉 Create table data
  const tableData = data.students.map((s: any) => [
    s.name,
    s.joinedAt
      ? new Date(s.joinedAt).toLocaleString()
      : "N/A",
    s.leftAt
      ? new Date(s.leftAt).toLocaleString()
      : "Active"
  ]);

  // 👉 Table
  autoTable(doc, {
    startY: 50,
    head: [["Name", "Join Time", "Leave Time"]],
    body: tableData,
  });

  doc.save(`session-${sessionId}.pdf`);
}}>
          Download PDF
        </button>
         <button onClick={downloadQuestionsPDF} style={btnStyle}>
                      Download Questions
         </button>
        <button
          onClick={() => navigate("/teacher")}
          style={{ ...btnStyle, backgroundColor: "gray" }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
// CSS
const cardStyle = {
  flex: 1,
  padding: "20px",
  background: "#02020a",
  borderRadius: "10px",
  textAlign: "center" as const
};

const btnStyle = {
  padding: "10px 20px",
  border: "none",
  backgroundColor: "#007bff",
  color: "white",
  borderRadius: "5px",
  cursor: "pointer"
};

export default SessionSummary;