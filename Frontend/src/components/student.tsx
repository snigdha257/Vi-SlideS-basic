import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, User, Zap } from "lucide-react";
import toast from "react-hot-toast";
import "../styles/student.css";

type SessionItem = {
  _id?: string;
  code: string;
  name: string;
  createdBy: string;
  createdAt: string;
  status?: "active" | "ended";
};

export default function Student() {
  const [sessionCode, setSessionCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load history from localStorage on mount
    const savedHistory = JSON.parse(localStorage.getItem("sessions") || "[]");
    // Sort by createdAt descending (newest first)
    const sorted = savedHistory.sort(
      (a: SessionItem, b: SessionItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setSessionHistory(sorted);
    setLoadingHistory(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleJoinSession = async () => {
    const trimmedCode = sessionCode.trim().toUpperCase();

    if (!trimmedCode) {
      toast.error("Please enter a session code");
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch(`http://localhost:5000/session/${trimmedCode}`);

      if (response.ok) {
        const { session }: { session: SessionItem } = await response.json();

        if (session.status === "ended") {
          toast.error("This session has ended.");
          return;
        }

        // Save to session history (localStorage)
        const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
        if (!sessions.find(s => s.code === trimmedCode)) {
          const updatedHistory = [...sessions, session];
          localStorage.setItem("sessions", JSON.stringify(updatedHistory));
          setSessionHistory(updatedHistory.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        }

        toast.success("Joining session...");
        setSessionCode("");
        navigate(`/session/${trimmedCode}?role=student`);
        return;
      } else {
        toast.error("Session not found. Please check the code.");
      }
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session. System error.");
    } finally {
      setIsJoining(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="student-page">
      <nav className="s-nav">
        <div className="s-nav-brand">
          <div className="brand-icon">V</div>
          <span>Vi-SlideS</span>
        </div>
        <div className="s-nav-actions">
          <div className="s-nav-badge">Student Mode</div>
          <button className="s-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="s-content">
        <div className="s-join-card">
          <div className="s-card-header">
            <div>
              <h2>Join a Session</h2>
              <p>Enter the 6-character code your teacher shared.</p>
            </div>
          </div>
          <div className="s-card-body">
            <div className="s-input-group">
              <input
                className="s-code-input"
                type="text"
                placeholder="ABCDEF"
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
                {isJoining ? "Joining..." : "Join"} <Zap size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="s-history-card">
          <div className="s-card-header">
            <div>
              <h2>Recent Sessions</h2>
              <p>Sessions you've recently joined</p>
            </div>
          </div>
          <div className="s-card-body">
            {loadingHistory ? (
              <div className="s-empty">
                <p>Loading history...</p>
              </div>
            ) : sessionHistory.length === 0 ? (
              <div className="s-empty">
                <Clock size={32} className="s-empty-icon" />
                <p>No recently joined sessions.</p>
              </div>
            ) : (
              <div className="session-list">
                {sessionHistory.map((session) => (
                  <div key={session.code} className="session-list-item">
                    <div className="s-item-left">
                      <div className={`s-item-dot ${session.status === 'active' ? 'active' : 'ended'}`}></div>
                      <div>
                        <div className="s-item-name">{session.name}</div>
                        <div className="s-item-meta">
                          <span className="s-item-code">{session.code}</span>
                          <span className="s-item-time">
                            <Clock size={12} /> {formatTimeAgo(session.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="s-item-right">
                       <span className={`s-item-badge ${session.status === 'active' ? 'active' : 'ended'}`}>
                        {session.status === 'active' ? 'Live' : 'Ended'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
