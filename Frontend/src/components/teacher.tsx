import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
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
  code: string;
  name: string;
  createdBy: string;
  createdAt: string;
  status?: "active" | "ended";
};
 
export default function Teacher() {
  const [sessionName, setSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
 
  const handleCreateSession = async () => {
    const trimmedName = sessionName.trim();
    if (!trimmedName) { 
      toast.error("Please enter a session name"); 
      return; 
    }
 
    setIsCreating(true);
    const sessionCode = generateSessionCode();
    
    try {
      // Create session in backend database
      const response = await fetch("http://localhost:5000/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          code: sessionCode,
          name: trimmedName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to create session");
        setIsCreating(false);
        return;
      }

      // Also save to localStorage for fallback compatibility
      const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
      const newSession: SessionItem = {
        code: sessionCode,
        name: trimmedName,
        createdBy: "teacher",
        createdAt: new Date().toISOString(),
        status: "active",
      };
      localStorage.setItem("sessions", JSON.stringify([...sessions, newSession]));
      
      toast.success("Session created successfully");
      setSessionName("");
      navigate(`/session/${sessionCode}?role=teacher`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
      setIsCreating(false);
    }
  };
 
  return (
    <div className="teacher-page">
      {/* NAV */}
      <nav className="t-nav">
        <div className="t-nav-brand">
          <div className="brand-icon">V</div>
          <span>Vi-SlideS</span>
        </div>
        <div className="t-nav-badge">Teacher Mode</div>
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
              {/*this loading state has been added*/}
              <Zap size={18} /> {isCreating ? "Creating..." : "Create & Start Session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}