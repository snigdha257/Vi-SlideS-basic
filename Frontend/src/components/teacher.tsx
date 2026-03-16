import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/teacher.css";

function generateSessionCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < length; index++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

type SessionItem = {
  code: string;
  name: string;
  createdBy: string;
  createdAt: string;
};

export default function Teacher() {
  const [sessionName, setSessionName] = useState("");
  const navigate = useNavigate();

  const handleCreateSession = () => {
    const trimmedName = sessionName.trim();

    if (!trimmedName) {
      alert("Please enter a session name");
      return;
    }

    const sessionCode = generateSessionCode();
    const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");

    const newSession: SessionItem = {
      code: sessionCode,
      name: trimmedName,
      createdBy: "teacher",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("sessions", JSON.stringify([...sessions, newSession]));

    navigate(`/session/${sessionCode}?role=teacher`);
  };

  return (
    <div className="teacher">
      <h1>Teacher Dashboard</h1>
      <p>Welcome, Teacher!</p>

      <div className="session-card">
        <h2>Create Session</h2>

        <input
          type="text"
          placeholder="Enter session name"
          value={sessionName}
          onChange={(event) => setSessionName(event.target.value)}
          className="session-input"
        />

        <button onClick={handleCreateSession} className="session-button">
          Create Session
        </button>
      </div>
    </div>
  );
}