import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MonitorPlay, ArrowLeft, XCircle, Users, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from '../hooks/useSocket';
import "../styles/session.css";

type Student={
  id:string;
  name:string;
  joinedAt:string;
}

type Question = {
  id: string;
  studentName: string;
  question: string;
  timestamp: string;
  answer?: string;
};
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

  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Get user info
  const userInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}");
    
  // Initialize socket
  const { socket, connected } = useSocket(sessionCode || '', role || '', userInfo.name || '');
    
  // Socket event handlers
  useEffect(() => {
      if (!socket) return;
    
      socket.on('load-questions', (loadedQuestions: Question[]) => {
        setQuestions(loadedQuestions);
      });
    
      socket.on('new-question', (question: Question) => {
        setQuestions(prev => [...prev, question]);
      });
    
      socket.on('new-answer', (answeredQuestion: Question) => {
        setQuestions(prev => prev.map(q => 
          q.id === answeredQuestion.id ? answeredQuestion : q
        ));
      });
    }, [socket]);
    
  const handleSendQuestion = () => {
      if (!newQuestion.trim() || !socket) return;
      
      socket.emit('send-question', {
        sessionCode,
        question: newQuestion.trim()
      });
      setNewQuestion('');
  };
    
  const handleSendAnswer = (questionId: string) => {
      if (!answerText.trim() || !socket) return;
      
      socket.emit('send-answer', {
        sessionCode,
        questionId,
        answer: answerText.trim()
      });
      setAnswerText('');
  };

  // Slide navigation
  const nextSlide = () => {
    if (currentSlideIndex < questions.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  useEffect(() => {
    const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
    const found = sessions.find((s) => s.code === sessionCode);
    if (!found) { setSession(null); return; }
    if (found.status === "ended") { setEnded(true); }
    setSession(found);
    setStudents(found.students || []);
  }, [sessionCode]);

  // session-ended signal (for student)
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
    if(role==="student" && sessionCode){
      const studentInfo=JSON.parse(localStorage.getItem("studentInfo") || "{}");
      const studentname=studentInfo.name || studentInfo.email?.split("@")[0] || "unknown";
      
      const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
      const currentSession = sessions.find(s => s.code === sessionCode);
      
      if(currentSession){
        setStudents(currentSession.students || []);
        const alreadyJoined=currentSession?.students?.some((s)=>s.name===studentname);
        if(!alreadyJoined){
          handleStudentJoin();
        }
      }
    }
  },[role, sessionCode]);
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

  const currentQuestion = questions[currentSlideIndex];

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
          {/* LIVE Q&A SLIDES */}
          <div style={{ width: "100%", background: "#111827", border: "1px solid #1f2937", borderRadius: "14px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              marginBottom: "16px",
              color: "#94a3b8",
              fontSize: "1rem",
              fontWeight: 600
            }}>
              <div style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: connected ? "#22c55e" : "#64748b"
              }} />
              Live Q&A {connected ? "(Connected)" : "(Connecting...)"}
              {questions.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: "0.9rem" }}>
                  {currentSlideIndex + 1} / {questions.length}
                </span>
              )}
            </div>

            {/* STUDENT QUESTION INPUT */}
            {role === "student" && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: "#0f172a",
                    border: "1px solid #1f2937",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    fontSize: "0.9rem"
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendQuestion()}
                />
                <button
                  onClick={handleSendQuestion}
                  style={{
                    padding: "10px 16px",
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Send Question
                </button>
              </div>
            )}

            {/* SLIDE VIEW */}
            {questions.length === 0 ? (
              <div style={{
                textAlign: "center",
                color: "#64748b",
                padding: "40px 20px",
                fontSize: "0.95rem"
              }}>
                <MonitorPlay size={48} color="#818cf8" style={{ marginBottom: "16px" }} />
                <div>No questions yet. Be the first to ask!</div>
              </div>
            ) : (
              <div>
                {/* SLIDE CONTENT */}
                <div style={{
                  background: "#0f172a",
                  border: "1px solid #1f2937",
                  borderRadius: "12px",
                  padding: "24px",
                  minHeight: "200px",
                  position: "relative"
                }}>
                  <div style={{ 
                    color: "#64748b", 
                    fontSize: "0.75rem", 
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span>{currentQuestion.studentName} • {new Date(currentQuestion.timestamp).toLocaleTimeString()}</span>
                    <span>Question {currentSlideIndex + 1}</span>
                  </div>
                  
                  <div style={{ 
                    color: "#f1f5f9", 
                    fontSize: "1.1rem", 
                    fontWeight: 500,
                    marginBottom: "20px",
                    lineHeight: "1.5"
                  }}>
                    {currentQuestion.question}
                  </div>

                  {/* ANSWER SECTION */}
                  {currentQuestion.answer ? (
                    <div style={{
                      background: "#1e2e1e",
                      border: "1px solid #2e3e2e",
                      borderRadius: "8px",
                      padding: "16px",
                      marginTop: "16px"
                    }}>
                      <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "8px" }}>
                        Teacher • {new Date(currentQuestion.timestamp).toLocaleTimeString()}
                      </div>
                      <div style={{ color: "#6ee7b7", fontSize: "1rem", lineHeight: "1.5" }}>
                        {currentQuestion.answer}
                      </div>
                    </div>
                  ) : role === "teacher" && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                      <input
                        type="text"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type your answer..."
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          background: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "#f1f5f9",
                          fontSize: "0.9rem"
                        }}
                      />
                      <button
                        onClick={() => handleSendAnswer(currentQuestion.id)}
                        style={{
                          padding: "10px 16px",
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>

                {/* SLIDE NAVIGATION */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginTop: "16px"
                }}>
                  <button
                    onClick={prevSlide}
                    disabled={currentSlideIndex === 0}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      background: currentSlideIndex === 0 ? "#1f2937" : "#3730a3",
                      color: currentSlideIndex === 0 ? "#64748b" : "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: currentSlideIndex === 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <div style={{ display: "flex", gap: "4px" }}>
                    {questions.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: index === currentSlideIndex ? "#6366f1" : "#1f2937",
                          cursor: "pointer"
                        }}
                        onClick={() => setCurrentSlideIndex(index)}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextSlide}
                    disabled={currentSlideIndex === questions.length - 1}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      background: currentSlideIndex === questions.length - 1 ? "#1f2937" : "#3730a3",
                      color: currentSlideIndex === questions.length - 1 ? "#64748b" : "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: currentSlideIndex === questions.length - 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
            {/* Session Info Grid */}
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