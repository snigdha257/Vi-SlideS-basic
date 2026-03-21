import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import "../styles/student.css";

type SessionItem = {
  code: string;
  name: string;
  createdBy: string;
  createdAt: string;
  status?: "active" | "ended";
};

export default function Student() {
  const [sessionCode, setSessionCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  //Helper: get session from localStorage
  const getSessionFromLocal = (code: string): SessionItem | undefined => {
    const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
    return sessions.find(s => s.code === code);
  };

  // Helper: handle ended session
  const handleEndedSession = () => {
    toast.error("This session has ended. Please contact your teacher.");
  };

  // Helper: navigate to session
  const goToSession = (code: string) => {
    setSessionCode("");
    navigate(`/session/${code}?role=student`);
  };

  const handleJoinSession = async () => {
    const trimmedCode = sessionCode.trim().toUpperCase();

    if (!trimmedCode) {
      toast.error("Please enter a session code");
      return;
    }

    setIsJoining(true);

    try {
      // Try backend first
      const response = await fetch(`http://localhost:5000/session/${trimmedCode}`);

      if (response.ok) {
        const { session }: { session: SessionItem } = await response.json();

        if (session.status === "ended") {
          handleEndedSession();
          return;
        }

        // Save to localStorage (fallback support)
        const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
        if (!sessions.find(s => s.code === trimmedCode)) {
          localStorage.setItem("sessions", JSON.stringify([...sessions, session]));
        }

        toast.success("Session found! Joining...");
        goToSession(trimmedCode);
        return;
      }

      // 2. Fallback to localStorage
      const localSession = getSessionFromLocal(trimmedCode);

      if (!localSession) {
        toast.error("Session not found. Check your code and try again.");
        return;
      }

      if (localSession.status === "ended") {
        handleEndedSession();
        return;
      }

      goToSession(trimmedCode);

    } catch (error) {
      console.error("Error joining session:", error);

      // Fallback on error
      const localSession = getSessionFromLocal(trimmedCode);

      if (!localSession) {
        toast.error("Session not found. Check your code and try again.");
        return;
      }

      if (localSession.status === "ended") {
        handleEndedSession();
        return;
      }

      goToSession(trimmedCode);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="student-page">
      <nav className="s-nav">
        <div className="s-nav-brand">
          <div className="brand-icon">V</div>
          <span>Vi-SlideS</span>
        </div>
        <div className="s-nav-badge">Student Mode</div>
      </nav>

      <main className="s-main">
        <div className="s-join-card">
          <div className="s-card-top">
            <h1>Join a Session</h1>
            <p>Enter the 6-character code your teacher shared to join the live session.</p>
          </div>

          <div className="s-form">
            <div className="s-input-label">Session Code</div>
            <input
              className="s-code-input"
              type="text"
              placeholder="● ● ● ● ● ●"
              value={sessionCode}
              maxLength={6}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && !isJoining && handleJoinSession()}
              disabled={isJoining}
            />

            <button
              className="s-join-btn"
              onClick={handleJoinSession}
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join Session"} <ArrowRight size={20} />
            </button>

            <p className="s-hint">
              Ask your teacher for the 6-character session code.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

