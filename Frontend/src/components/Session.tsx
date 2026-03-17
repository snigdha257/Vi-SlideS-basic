import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MonitorPlay, ArrowLeft, XCircle, Users } from "lucide-react";
import toast from "react-hot-toast";
import "../styles/session.css";

type Student={
  id:string;
  name:string;
  joinedAt:string;
}
type SessionItem = {
  code: string;
  name: string;
  createdBy: string;
  createdAt: string;
  status?: "active" | "ended";
  students?: Student[];
};

export default function Session() {
  const { sessionCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role");
  const [students, setStudents] = useState<Student[]>([]);
  const [session, setSession] = useState<SessionItem | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
    const found = sessions.find((s) => s.code === sessionCode);
    if (!found) { setSession(null); return; }
    if (found.status === "ended") { setEnded(true); }
    setSession(found);
    setStudents(found.students || []);
  }, [sessionCode]);

  // Poll for session-ended signal (for student)
  useEffect(() => {
    if (role !== "student") return;
    const interval = setInterval(() => {
      const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
      const found = sessions.find((s) => s.code === sessionCode);
      if (found?.status === "ended") {
        setEnded(true);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionCode, role]);

  const handleStudentJoin = () => {
    // TODO: Implement student join logic
    if(role!=="student"){
      return;
    }
    const studentInfo=JSON.parse(localStorage.getItem("studentInfo") || "{}");
    if(!studentInfo.name){
      return;
    }
    const studentname=studentInfo.name || studentInfo.email?.split("@")[0] || "unknown";
    console.log("Student joining session:", studentname);

    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentname,
      joinedAt: new Date().toISOString(),
    };

    const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
    const updatedSessions = sessions.map((s) => {
     if(s.code===sessionCode){
      return {
        ...s,
        students: [...(s.students || []), newStudent]
      };
     }
     return s;
    });
    localStorage.setItem("sessions", JSON.stringify(updatedSessions));
    setStudents(prev=>[...prev, newStudent]);
    toast.success("Student joined session");
    
  };
  useEffect(()=>{
    if(role==="student" && session){
      setStudents(session.students || []);
      const studentInfo=JSON.parse(localStorage.getItem("studentInfo") || "{}");
      const studentname=studentInfo.name || studentInfo.email?.split("@")[0] || "unknown";
      const alreadyJoined=session.students?.some((s)=>s.name===studentname);
      if(alreadyJoined){
        return;
      }
      handleStudentJoin();
    }
  },[role, session]);
  useEffect(()=>{
    if(role!=="teacher"){
      return;
    }
    const interval= setInterval(() => {
      const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
      const currentSession= sessions.find(s=>s.code===sessionCode);
      if(currentSession){
        console.log("Current session:", currentSession.students);
        setStudents(currentSession.students || []);
      }
    }, 1000);
    return () => clearInterval(interval);
  },[sessionCode,role]);

  const handleStudentLeave=()=>{
    if(role!=="student"){
      return;
    }
    const studentInfo=JSON.parse(localStorage.getItem("studentInfo") || "{}");
    const studentname=studentInfo.name || studentInfo.email?.split("@")[0] || "unknown";
    const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
    const updatedSessions = sessions.map((s) => {
      if(s.code===sessionCode){
        return {
          ...s,
          students: s.students?.filter((student)=>student.name!==studentname) || []
        };
      }
      return s;
    });
    localStorage.setItem("sessions", JSON.stringify(updatedSessions));
    setStudents(prev=>prev.filter((student)=>student.name!==studentname));
    toast.success("Student left session");
    navigate("/student");
  }
  const handleEndSession = () => {
    toast((t) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontWeight: 600, color: "#1e293b" }}>End session for everyone?</span>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
          Students will be redirected. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
              const updated = sessions.map((s) =>
                s.code === sessionCode ? { ...s, status: "ended" as const } : s
              );
              localStorage.setItem("sessions", JSON.stringify(updated));
              setEnded(true);
              toast.success("Session ended!");
              navigate("/teacher");
            }}
            style={{
              background: "#ef4444", color: "#fff", border: "none",
              padding: "8px 16px", borderRadius: "8px", fontWeight: 700,
              cursor: "pointer", fontSize: "0.85rem", flex: 1,
            }}
          >
            End Session
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: "#f1f5f9", color: "#475569", border: "none",
              padding: "8px 16px", borderRadius: "8px", fontWeight: 600,
              cursor: "pointer", fontSize: "0.85rem", flex: 1,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: { maxWidth: "320px", padding: "16px", borderRadius: "16px" },
    });
  };

  // Session not found
  if (!session) {
    return (
      <div className="session-ended-page">
        <div className="session-ended-card">
          <div className="ended-icon"><XCircle size={40} color="#ef4444" /></div>
          <h2>Session Not Found</h2>
          <p>The session code is invalid or the session no longer exists.</p>
          <button className="btn-go-home" onClick={() => navigate(role === "teacher" ? "/teacher" : "/student")}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Session ended
  if (ended) {
    return (
      <div className="session-ended-page">
        <div className="session-ended-card">
          <div className="ended-icon"><XCircle size={40} color="#ef4444" /></div>
          <h2>Session Ended</h2>
          <p>
            {role === "teacher"
              ? "You have ended this session."
              : "The teacher has ended this session. Thanks for joining!"}
          </p>
          <button className="btn-go-home" onClick={() => navigate(role === "teacher" ? "/teacher" : "/student")}>
            {role === "teacher" ? "Back to Dashboard" : "Back to Home"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-page">
      {/* TOP BAR */}
      <header className="session-topbar">
        <div className="session-topbar-left">
          <div className="session-brand">
            Vi-SlideS
          </div>
          <div className="session-divider" />
          <span className="session-name">{session.name}</span>
        </div>

        <div className="session-topbar-right">
          <div className="live-pill">
            <span className="live-dot" /> Live
          </div>
          <div className="code-chip">
            Code: <strong>{session.code}</strong>
          </div>

          {role === "teacher" && (
            <button className="btn-end-session" onClick={handleEndSession}>
              <XCircle size={16} /> End Session
            </button>
          )}
          {role==="teacher" && (
            <button className="btn-back" onClick={() => navigate("/teacher")}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          )}
          {role==="student" && (
            <button className="btn-end-session" onClick={handleStudentLeave}>
              <XCircle size={16} /> Leave Session
            </button>
          )}
          
        </div>
      </header>

      {/* STAGE */}
      <div className="session-body">
        <div className="session-stage">
          <div className="session-stage-icon">
            <MonitorPlay size={48} color="#818cf8" />
          </div>
          <h2>{role === "teacher" ? "Your session is live!" : "You've joined the session!"}</h2>
          <p>
            {role === "teacher"
              ? "Students can join using the code below. Your slides will appear here when you start presenting."
              : "Waiting for the teacher to start presenting..."}
          </p>

          <div className="session-info-grid">
            {role === "teacher" && (
              <div style={{ width: "100%", marginTop: "20px" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  marginBottom: "12px",
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  fontWeight: 600
                }}>
                  <Users size={18} />
                  Active Students ({students.length})
                </div>
                
                <div style={{ 
                  display: "grid", 
                  gap: "8px", 
                  maxHeight: "200px", 
                  overflowY: "auto",
                  padding: "4px"
                }}>
                  {students.length === 0 ? (
                    <div style={{
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "0.85rem",
                      padding: "20px",
                      background: "#0f172a",
                      border: "1px solid #1f2937",
                      borderRadius: "8px"
                    }}>
                      No students have joined yet
                    </div>
                  ) : (
                    students.map(student => (
                      <div key={student.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "#0f172a",
                        border: "1px solid #1f2937",
                        borderRadius: "8px",
                        fontSize: "0.9rem"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#22c55e"
                          }} />
                          <span style={{ color: "#f1f5f9", fontWeight: 500 }}>
                            {student.name}
                          </span>
                        </div>
                        <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                          {new Date(student.joinedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <div className="session-info-chip">
              <span className="chip-label">Session Code</span>
              <span className="chip-value">{session.code}</span>
            </div>
            <div className="session-info-chip">
              <span className="chip-label">Session Name</span>
              <span className="chip-value" style={{ fontFamily: "inherit", fontSize: "0.95rem" }}>{session.name}</span>
            </div>
            <div className="session-info-chip">
              <span className="chip-label">Your Role</span>
              <span className="chip-value" style={{ fontFamily: "inherit", fontSize: "0.95rem", textTransform: "capitalize" }}>{role}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}