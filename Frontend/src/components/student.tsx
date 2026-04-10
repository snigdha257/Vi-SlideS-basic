import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Zap } from "lucide-react";
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
  const [filter, setFilter] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const navigate = useNavigate();

  const getStudentInfo = () => {
    try {
      const stored = localStorage.getItem("studentInfo");
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn("Invalid studentInfo in localStorage", error);
      return {};
    }
  };

  // ✅ Fetch sessions from DB (NO localStorage)
  const fetchSessions = async () => {
    try {
      const userInfo = getStudentInfo();

      const name =
        userInfo.name ||
        userInfo.email?.split("@")[0] ||
        localStorage.getItem("name") ||
        "Student";
      const response = await fetch(`http://localhost:5000/student-sessions/name/${encodeURIComponent(name)}`);

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();

      const sorted = (data.sessions || []).sort(
        (a: SessionItem, b: SessionItem) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setSessionHistory(sorted);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // ✅ Filter logic (same as teacher)
  const filteredHistory = sessionHistory.filter((session) => {
    if (!session) return false;

    const search = String(filter || "").toLowerCase();
    const sessionName = String(session?.name || "").toLowerCase();
    const sessionCode = String(session?.code || "").toLowerCase();

    const date = session.createdAt ? new Date(session.createdAt) : null;
    if (!date || isNaN(date.getTime())) return false;

    const dateFormats = [
      date.toLocaleDateString().toLowerCase(),
      date.toLocaleDateString("en-US").toLowerCase(),
      date.toISOString().split("T")[0],
      date.toLocaleDateString("en-GB").toLowerCase(),
    ];

    const dateMatches = dateFormats.some((format) =>
      format.includes(search)
    );

    return (
      sessionName.includes(search) ||
      sessionCode.includes(search) ||
      dateMatches
    );
  });

  // ✅ Split active / ended
  const activeSessions = filteredHistory.filter(
    (s) => s.status === "active"
  );
  const endedSessions = filteredHistory.filter(
    (s) => s.status === "ended"
  );

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
      const response = await fetch(
        `http://localhost:5000/session/${trimmedCode}`
      );

      const data = await response.json();

      if (response.ok) {
        const session: SessionItem = data.session;

        if (session.status === "ended") {
          toast.error("This session has ended.");
          return;
        }

        toast.success("Joining session...");
        setSessionCode("");
        navigate(`/session/${trimmedCode}?role=student`);
      } else {
        toast.error("Session not found. Please check the code.");
      }
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session.");
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
      {/* NAV */}
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

      <div className="s-hero">
        <h1 style={{ textAlign: "center" }}>Student Dashboard</h1>
        <p style={{ textAlign: "center" }}>
          Join your teacher's session and start interacting with the presentation.
        </p>
      </div>

      <main className="s-content">
        {/* JOIN */}
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
                onChange={(e) =>
                  setSessionCode(e.target.value.toUpperCase())
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && !isJoining && handleJoinSession()
                }
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
<div>
   
    {/* existing UI */}
  </div>
        {/* HISTORY */}
        <div className="s-history-card">
          <div className="s-card-header">
            <div>
              <h2>Recent Sessions</h2>
              <input
                type="text"
                placeholder="Filter by name, code, or date"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <p>{sessionHistory.length} sessions</p>
            </div>
          </div>

          <div className="s-card-body">
            {loadingHistory ? (
              <div className="s-empty">
                <p>Loading sessions...</p>
              </div>
            ) : sessionHistory.length === 0 ? (
              <div className="s-empty">
                <Clock size={32} />
                <p>No sessions yet.</p>
              </div>
            ) : (
              <div className="session-list">
                
                {/* ACTIVE */}
                {activeSessions.map((session) => (
                  <div
                    key={session.code}
                    className="session-list-item session-active"
                  >
                    <div className="s-item-left">
                      <div className="s-item-dot active"></div>
                      <div>
                        <div className="s-item-name">
                          {session.name}
                        </div>
                        <div className="s-item-meta">
                          <span className="s-item-code">
                            {session.code}
                          </span>
                          <span className="s-item-time">
                            <Clock size={12} />{" "}
                            {formatTimeAgo(session.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="s-item-right">
                      <span className="s-item-badge">
                        {new Date(
                          session.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* ENDED */}
                {endedSessions.map((session) => (
                  <div
                    key={session.code}
                    className="session-list-item"
                  >
                    <div className="s-item-left">
                      <div className="s-item-dot ended"></div>
                      <div>
                        <div className="s-item-name">
                          {session.name}
                        </div>
                        <div className="s-item-meta">
                          <span className="s-item-code">
                            {session.code}
                          </span>
                          <span className="s-item-time">
                            <Clock size={12} />{" "}
                            {formatTimeAgo(session.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="s-item-right">
                      <span className="s-item-badge">
                        {new Date(
                          session.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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