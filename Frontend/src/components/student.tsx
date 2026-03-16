import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/student.css";

export default function Student() {
  const [sessionCode, setSessionCode] = useState("");
  const navigate = useNavigate();

  const handleJoinSession = () => {
    const trimmedCode = sessionCode.trim().toUpperCase();

    if (!trimmedCode) {
      alert("Please enter a session code");
      return;
    }

    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    const matchedSession = sessions.find(
      (session: { code: string; name: string }) => session.code === trimmedCode
    );

    if (!matchedSession) {
      alert("Session not found");
      return;
    }

    navigate(`/session/${trimmedCode}?role=student`);
  };

  return (
    <div className="student">
      <h1>Student Dashboard</h1>
      <p>Welcome, Student!</p>

      <div className="join-session-card">
        <h2>Join Session</h2>

        <input
          type="text"
          placeholder="Paste session code"
          value={sessionCode}
          onChange={(event) => setSessionCode(event.target.value)}
          className="session-input"
        />

        <button onClick={handleJoinSession} className="join-button">
          Join Session
        </button>
      </div>
    </div>
  );
}