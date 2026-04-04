import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Clock, Users, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import "../styles/teacher.css";
 
function generateSessionCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

type SessionItem = {
  _id?: string;
  code: string;
  name: string;
  createdBy: string;
  createdAt: string;
  status?: "active" | "ended";
  questions?: any[];
  students?: any[];
  duration?: string;
  startTime?: string;
  endTime?: string;
};
 
export default function Teacher() {
  const [sessionName, setSessionName] = useState("");
  const [filter, setFilter] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const navigate = useNavigate();

  // Check for valid token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      toast.error("Please log in first");
      navigate("/login");
      return;
    }
    fetchPreviousSessions();
  }, [navigate]);

  const fetchPreviousSessions = async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") return;

    try {
      const response = await fetch("http://localhost:5000/teacher-sessions", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Sort by createdAt descending (newest first)
        const sorted = (data.sessions || []).sort(
          (a: SessionItem, b: SessionItem) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPreviousSessions(sorted);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };
  const filteredHistory = previousSessions.filter((session) =>{
    const search = filter.toLowerCase();
    const sessionName = session.name.toLowerCase();
    const sessionCode = session.code.toLowerCase();
    // Create multiple date formats for better matching
    const date = new Date(session.createdAt);
    const dateFormats = [
      date.toLocaleDateString().toLowerCase(), // "12/25/2023"
      date.toLocaleDateString('en-US').toLowerCase(), // "12/25/2023"
      date.toISOString().split('T')[0], // "2023-12-25"
      date.toLocaleDateString('en-GB').toLowerCase(), //"25/12/2023"
    ];
    
    const dateMatches = dateFormats.some(format => format.includes(search));
    
    return sessionName.includes(search) || sessionCode.includes(search) || dateMatches;
  }
  );
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("sessions");
    localStorage.removeItem("studentInfo");
    navigate("/login");
  };
 
  const handleCreateSession = async () => {
    const trimmedName = sessionName.trim();
    if (!trimmedName) { 
      toast.error("Please enter a session name"); 
      return; 
    }

    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      toast.error("Please log in first");
      navigate("/login");
      return;
    }
 
    setIsCreating(true);
    const sessionCode = generateSessionCode();
    
    try {
      const response = await fetch("http://localhost:5000/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          code: sessionCode,
          name: trimmedName
        })
      });

      if (response.status === 401 || response.status === 403) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to create session");
        setIsCreating(false);
        return;
      }

      toast.success("Session created successfully");
      setSessionName("");
      navigate(`/session/${sessionCode}?role=teacher`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
      setIsCreating(false);
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
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const activeSessions = filteredHistory.filter(s => s.status === "active");
  const endedSessions = filteredHistory.filter(s => s.status === "ended");
 
  return (
    <div className="teacher-page">
      {/* NAV */}
      <nav className="t-nav">
        <div className="t-nav-brand">
          <div className="brand-icon">V</div>
          <span>Vi-SlideS</span>
        </div>
        <div className="t-nav-actions">
          <div className="t-nav-badge">Teacher Mode</div>
          <button className="t-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
 
      {/* HERO */}
      <div className="t-hero">
        <h1>Teacher Dashboard</h1>
        <p>Create and manage your interactive presentation sessions.</p>
      </div>
 
      {/* CONTENT GRID */}
      <div className="t-content">
        {/* Create Session */}
        <div className="t-card">
          <div className="t-card-header">
            <div>
              <h2>New Session</h2>
              <p>Start a live session for students</p>
            </div>
          </div>
          <div className="t-card-body">
            <input
              className="create-input"
              type="text"
              placeholder="e.g. Physics 101 – Thermodynamics"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isCreating && handleCreateSession()}
              disabled={isCreating}
            />
            <button 
              className="create-btn" 
              onClick={handleCreateSession}
              disabled={isCreating}
            >
              <Zap size={18} /> {isCreating ? "Creating..." : "Create & Start Session"}
            </button>
          </div>
        </div>

        {/* Previous Sessions */}
<div className="t-card">
  <div className="t-card-header">
    <div>
      <h2>Previous Sessions</h2>
      <h1></h1>
      <input 
        type="text" 
        placeholder="Filter by name, code, or date (e.g., 'physics', 'ABC123', '12/25/2023')" 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <p>
        {previousSessions.length} total session
        {previousSessions.length !== 1 ? "s" : ""}
      </p>
    </div>
  </div>

  <div className="t-card-body">
    {loadingSessions ? (
      <div className="t-empty">
        <div className="t-empty-icon">⏳</div>
        <p>Loading sessions...</p>
      </div>
    ) : previousSessions.length === 0 ? (
      <div className="t-empty">
        <div className="t-empty-icon">📋</div>
        <p>No sessions yet. Create your first one!</p>
      </div>
    ) : (
      <div className="session-list">
        
        {/* Active sessions first */}
        {activeSessions.map((session) => (
          <div
            key={session.code}
            className="session-list-item session-active"
          >
            <div className="s-item-left">
              <div className="s-item-dot active"></div>
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
              <div className="s-item-stats">
                <span className="s-stat" title="Students">
                  <Users size={13} /> {session.students?.length || 0}
                </span>
                <span className="s-stat" title="Questions">
                  <MessageSquare size={13} /> {session.questions?.length || 0}
                </span>
              </div>

              {/* DATE instead of Live */}
              <span className="s-item-badge">
                {new Date(session.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Ended sessions */}
        {endedSessions.map((session) => (
          <div
            key={session.code}
            className="session-list-item"
          >
            <div className="s-item-left">
              <div className="s-item-dot ended"></div>
              <div>
                <div className="s-item-name">{session.name}</div>
                <div className="s-item-meta">
                  <span className="s-item-code">{session.code}</span>
                  <span className="s-item-time">
                    <Clock size={12} /> {formatTimeAgo(session.createdAt)}
                  </span>
                  {session.duration && (
                    <span className="s-item-duration">
                      · {session.duration}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="s-item-right">
              <div className="s-item-stats">
                <span className="s-stat" title="Students">
                  <Users size={13} /> {session.students?.length || 0}
                </span>
                <span className="s-stat" title="Questions">
                  <MessageSquare size={13} /> {session.questions?.length || 0}
                </span>
              </div>

              {/* DATE instead of Ended */}
              <span className="s-item-badge">
                {new Date(session.createdAt).toLocaleDateString("en-IN", {
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
      </div>
    </div>
  );
}