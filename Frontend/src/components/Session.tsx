import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from '../hooks/useSocket';
import "../styles/session.css";

type Student = {
  id: string;
  name: string;
  joinedAt: string;
  leftAt?: string;
};


type Question = {
  id: string;
  studentName: string;
  question: string;
  timestamp: string;
  answer?: string;
  email?: string;
  source?: string;
  aiAnswer?: string;
  aiAnsweredAt?: string;
};
type SessionItem = {
  code: string;
  name: string;
  createdBy: string;
  createdAt: string;
  status?: "active" | "ended";
  students?: Student[];

  // 🔥 ADD THESE
  questions?: Question[];
  startTime?: string;
  endTime?: string;
};


export default function Session() {
  const [showSidebar, setShowSidebar] = useState(false);
  const { sessionCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = searchParams.get("role");

  const [students, setStudents] = useState<Student[]>([]);
  const [session, setSession] = useState<SessionItem | null>(null);
  const [ended, setEnded] = useState(false);
  const [showQRCopied, setShowQRCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [serverIp, setServerIp] = useState("localhost");
  const [serverPort, setServerPort] = useState("5000");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null); // questionId being processed by AI

  const userInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}");

const name =
  userInfo.name ||
  userInfo.email?.split("@")[0] ||
  localStorage.getItem("name") ||
  "Student";

const { socket, connected } = useSocket(
  sessionCode || '',
  role || '',
  name,
  userInfo.email
);

  // SOCKET
  useEffect(() => {
    if (!socket) return;

    socket.on('load-questions', setQuestions);
   socket.on('new-question', (q: Question) => {
  setQuestions(prev => {
    const updatedQuestions = [...prev, q];

    // 🔥 update localStorage
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

    const updatedSessions = sessions.map((s: any) => {
      if (s.code === sessionCode) {
        return {
          ...s,
          questions: updatedQuestions // store questions
        };
      }
      return s;
    });

    localStorage.setItem("sessions", JSON.stringify(updatedSessions));

    return updatedQuestions;
  });
});
    socket.on('new-answer', (q: Question) =>
      setQuestions(prev => prev.map(x => x.id === q.id ? q : x))
    );
    socket.on('session-ended', () => {
     if(role === "student"){
      toast.error('Session has been ended by the teacher');
      setTimeout(() => {
        navigate('/student');
      }, 2000);
    }
    });
    socket.on('session-paused-toggled', (paused: boolean) => {
      setIsPaused(paused);
      if (paused) {
        toast.error('Session has been paused');
      } else {
        toast.success('Session has been resumed');
      }
    });

    return () => {
      socket.off('load-questions');
      socket.off('new-question');
      socket.off('new-answer');
      socket.off('session-ended');
      socket.off('session-paused-toggled');
    };
  }, [socket]);

  // LOAD SESSION
 useEffect(() => {
  const sessions: any[] = JSON.parse(localStorage.getItem("sessions") || "[]");
  const found = sessions.find(s => s.code === sessionCode);

  if (!found) return setSession(null);

  // 🔥 ADD START TIME IF NOT EXISTS
  if (!found.startTime) {
    found.startTime = new Date().toISOString();

    const updated = sessions.map(s =>
      s.code === sessionCode ? found : s
    );

    localStorage.setItem("sessions", JSON.stringify(updated));
  }

  if (found.status === "ended") setEnded(true);

  setSession(found);
  setStudents(found.students || []);
}, [sessionCode]);
  // AUTO JOIN
  useEffect(() => {
    if (!session || !sessionCode || role !== "student") return;

    const info = JSON.parse(localStorage.getItem("studentInfo") || "{}");
    const name = info.name || info.email?.split("@")[0];

    if (!name) return;

    // Note: Student list is now fully managed by socket events
    // The 'update-students' event will update the students state
  }, [session, sessionCode, role]);

  // ACTIONS
  const handleSendQuestion = () => {
    if (!newQuestion.trim() || !socket || isPaused) return;

    socket.emit('send-question', {
      sessionCode,
      question: newQuestion.trim()
    });

    setNewQuestion('');
  };

  const handleSendAnswer = (id: string) => {
    if (!answerText.trim() || !socket) return;

    socket.emit('send-answer', {
      sessionCode,
      questionId: id,
      answer: answerText.trim()
    });

    setAnswerText('');
  };

  const handleStudentLeave = () => {
  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

  const updated = sessions.map((s: any) => {
    if (s.code === sessionCode) {
      return {
        ...s,
        students: (s.students || []).map((stu: any) =>
          stu.name === userInfo.name
            ? {
                ...stu,
                leftAt: new Date().toISOString() // ✅ SAVE LEAVE TIME
              }
            : stu
        )
      };
    }
    return s;
  });

  localStorage.setItem("sessions", JSON.stringify(updated));

  navigate("/student");
};

  const handleEndSession = () => {
    if (socket && role === "teacher") {
      socket.emit('end-session', { sessionCode });
    }

    const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");

   const updated = sessions.map(s =>
  s.code === sessionCode
    ? {
        ...s,
        status: "ended",
        endTime: new Date().toISOString() // 🔥 ADD THIS
      }
    : s
);

    localStorage.setItem("sessions", JSON.stringify(updated));
    
    if (role === "teacher") {
    navigate(`/summary/${sessionCode}`);
  } else {
    navigate("/student");
  }
  };

  const handleTogglePause = () => {
    if (socket && role === "teacher") {
      socket.emit('toggle-pause', { sessionCode });
    }
  };

  // Generate QR code URL
  const getQRCodeUrl = () => {
    const qrUrl = `http://${serverIp}:${serverPort}/ask/${sessionCode}`;
    return encodeURIComponent(qrUrl);
  };

  const handleCopyQRLink = () => {
    const qrUrl = `http://${serverIp}:${serverPort}/ask/${sessionCode}`;
    navigator.clipboard.writeText(qrUrl);
    setShowQRCopied(true);
    setTimeout(() => setShowQRCopied(false), 2000);
    toast.success("QR link copied to clipboard!");
  };

  if (!session) return <div className="center-msg">Session not found</div>;
  if (ended && role !== "teacher") return <div className="center-msg">Session ended</div>;

  const current = currentSlideIndex !== null ? questions[currentSlideIndex] : null;

  return (
    <div className="session-page">
      <div className="session-container">

        {/* HEADER */}
        <header className="session-topbar">
          <span className="session-title">Code: {sessionCode}</span>
          <span className="session-title">{session.name}</span>
          <div className="actions">
            {role === "teacher" && (
              <>
                <button
                  className="btn-qr"
                  onClick={() => setShowQRModal(true)}
                  title="Show QR code for students to scan"
                >
                  📱
                </button>
                <button
                  className={isPaused ? "btn-success" : "btn-warning"}
                  onClick={handleTogglePause}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button className="btn-danger" onClick={handleEndSession}>End</button>
              </>
            )}

            {role === "student" && (
              <button className="btn-danger" onClick={handleStudentLeave}>Leave</button>
            )}

            <button className="btn-icon" onClick={() => navigate("/")}>
              <ArrowLeft size={14} />
            </button>
          </div>
        </header>

        {/* Q&A */}
        <div className={`qa-sidebar ${showSidebar ? "open" : ""}`}>
          <h3>Questions</h3>
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`sidebar-item ${currentSlideIndex === index ? "active" : ""} ${q.source === "qr" ? "qr-source" : ""}`}
              onClick={() => {
                setCurrentSlideIndex(index);
                setShowSidebar(false);
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <strong>{q.studentName}</strong>
                {q.source === "qr" && <span className="qr-badge">QR</span>}
              </div>
              <p>{q.question}</p>
            </div>
          ))}
        </div>
        {showSidebar && (
          <div className="overlay" onClick={() => setShowSidebar(false)} />
        )}
        <div className="card">
          <div className="card-title">
            <button onClick={() => setShowSidebar(true)} className="card-btn">☰</button>
            Live Q&A {connected ? "🟢" : "⚪"} {isPaused && <span className="paused-badge">Paused</span>}
          </div>


          {questions.length === 0 ? (
            <div className="qa-empty">No questions yet</div>
          ) : current === null ? (
            <div className="qa-empty">Select a question from sidebar</div>
          ) : (
            <div className="qa-box">
              <div className="question" key={current.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <span className="student">{current?.studentName}</span>
                  {current?.source === "qr" && <span className="qr-badge">QR Submission</span>}
                </div>
                <p>{current?.question}</p>
                {current?.email && <p className="question-email">Email: {current.email}</p>}

                {current.answer ? (
                  <div className="answer">{current.answer}</div>
                ) : role === "teacher" && (
                  <div className="input-row">
                    <input
                      className="input"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Write answer..."
                    />
                    <button className="btn-primary" onClick={() => handleSendAnswer(current.id)}>
                      Reply
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleAskAI(current.id)}
                      disabled={aiLoading === current.id || !!current.aiAnswer}
                    >
                      {aiLoading === current.id ? "🤖 Thinking..." : current.aiAnswer ? "🤖 AI Answered" : "🤖 Ask AI"}
                    </button>
                  </div>
                )}

                {current.aiAnswer && (
                  <div className="ai-answer">
                    <div className="ai-header">🤖 AI Answer</div>
                    <div className="ai-content">{current.aiAnswer}</div>
                  </div>
                )}
              </div>

              {/* NAV */}
              <div className="nav-btns">
                <button disabled={currentSlideIndex === null} onClick={() => setCurrentSlideIndex(i =>
                  i === null ? 0 : Math.max(0, i - 1))
                }
                >Prev
                </button>
                <button
                  disabled={currentSlideIndex === null}
                  onClick={() =>
                    setCurrentSlideIndex(i =>
                      i === null ? 0 : Math.min(questions.length - 1, i + 1)
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {role === "student" && (
            <div className={`input-row ${isPaused ? "paused-input" : ""}`}>
              <input
                className="input"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder={isPaused ? "Session is paused..." : "Ask a question..."}
                disabled={isPaused}
              />
              <button
                className="btn-primary"
                onClick={handleSendQuestion}
                disabled={isPaused}
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* STUDENTS */}
        {role === "teacher" && (
          <div className="card">
            <div className="card-title">
              Students ({students.length})
            </div>

            {students.map(s => (
              <div key={s.id} className="student-item">
                {s.name}
              </div>
            ))}
          </div>
        )}

        {/* QR CODE MODAL - TEACHER ONLY */}
        {showQRModal && (
          <div className="qr-modal-overlay" onClick={() => setShowQRModal(false)}>
            <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="qr-modal-header">
                <h2>Share QR Code</h2>
                <button
                  className="qr-modal-close"
                  onClick={() => setShowQRModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="qr-modal-body">
                <div className="qr-display">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${getQRCodeUrl()}`}
                    alt="QR Code"
                    className="qr-image-large"
                  />
                </div>
                <div className="qr-info-modal">
                  <p className="qr-text">Students can scan this QR code to submit questions without joining the session.</p>
                  <div className="qr-url-box">
                    <span className="qr-url-label">Link:</span>
                    <code>{`http://${serverIp}:${serverPort}/ask/${sessionCode}`}</code>
                  </div>
                  <button className="qr-copy-btn-modal" onClick={handleCopyQRLink}>
                    {showQRCopied ? (
                      <>
                        <Check size={16} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}