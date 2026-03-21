import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

const SessionSummary = () => {
  const [data, setData] = useState<any>(null);
  const { sessionId } = useParams();
  const navigate = useNavigate();


useEffect(() => {
  if (!sessionId) return;

  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

  const found = sessions.find((s: any) => s.code === sessionId);

  if (found) {
    // 🔥 CALCULATE QUESTIONS
    const totalQuestions = found.questions?.length || 0;

    // 🔥 CALCULATE DURATION
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
      students: found.students || []
    });
  } else {
    console.log("Session not found in localStorage");
  }
}, [sessionId]);
  // ✅ FIX HERE
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
              <li key={index}>{s.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "40px", display: "flex", gap: "20px" }}>
        <button
          onClick={() => {
  const doc = new jsPDF();

  doc.text("Session Summary", 20, 20);
  doc.text(`Total Students: ${data.totalStudents}`, 20, 40);
  doc.text(`Total Questions: ${data.totalQuestions}`, 20, 50);
  doc.text(`Duration: ${data.duration}`, 20, 60);

  let y = 80;
  doc.text("Attendance:", 20, y);

  data.students.forEach((s: any, i: number) => {
    y += 10;
    doc.text(`${i + 1}. ${s.name}`, 20, y);
  });

  doc.save(`session-${sessionId}.pdf`);
}}
          style={btnStyle}
        >
          Download PDF
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