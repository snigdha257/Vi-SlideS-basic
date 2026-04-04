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


  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null); // questionId being processed by AI
  const [moodCheckActive, setMoodCheckActive] = useState(false);
  const [moodResponses, setMoodResponses] = useState({ understood: 0, okay: 0, confused: 0 });
  const [studentMoodSubmitted, setStudentMoodSubmitted] = useState(false);

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
    socket.on('new-question', (q: Question) =>
      setQuestions(prev => [...prev, q])
    );
    socket.on('new-answer', (q: Question) =>
      setQuestions(prev => prev.map(x => x.id === q.id ? q : x))
    );
    socket.on('ai-answer', (data: { questionId: string; question: string; answer: string; source: string }) => {
      setQuestions(prev => prev.map(q =>
        q.id === data.questionId
          ? { ...q, aiAnswer: data.answer }
          : q
      ));
      setAiLoading(null);
      toast.success('AI answer received!');
    });
    socket.on('student-joined', (studentName: string) => {
      toast.success(`${studentName} joined the session`);
    });
    socket.on('student-left', (studentName: string) => {
      toast.error(`${studentName} left the session`);
    });
    socket.on('update-students', (studentList: string[]) => {
      setStudents(studentList.map(name => ({
        id: name,
        name: name,
        joinedAt: new Date().toISOString()
      })));
    });
    socket.on('session-ended', () => {
      setEnded(true);
      toast.error('Session has been ended by the teacher');
      if (role === 'student') {
        setTimeout(() => {
          navigate(`/student-summary/${sessionCode}`);
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
    socket.on('mood-started', () => {
      setMoodCheckActive(true);
      setMoodResponses({ understood: 0, okay: 0, confused: 0 });
      setStudentMoodSubmitted(false);
      toast.success('Class Mood Check Started! Please respond.');
    });
    socket.on('mood-update', (responses: { understood: number; okay: number; confused: number }) => {
      setMoodResponses(responses);
    });
    socket.on('mood-ended', (summary?: { understood: number; okay: number; confused: number }) => {
      setMoodCheckActive(false);
      setMoodResponses(summary || { understood: 0, okay: 0, confused: 0 });
      setStudentMoodSubmitted(false);
      toast.success('Mood check ended');
    });

    return () => {
      socket.off('load-questions');
      socket.off('new-question');
      socket.off('new-answer');
      socket.off('ai-answer');
      socket.off('student-joined');
      socket.off('student-left');
      socket.off('update-students');
      socket.off('session-ended');
      socket.off('session-paused-toggled');
      socket.off('mood-started');
      socket.off('mood-update');
      socket.off('mood-ended');
    };
  }, [socket, role, navigate]);

  useEffect(() => {
    if (questions.length > 0 && currentSlideIndex === null) {
      setCurrentSlideIndex(0);
    }
    if (currentSlideIndex !== null && currentSlideIndex >= questions.length) {
      setCurrentSlideIndex(questions.length - 1);
    }
  }, [questions, currentSlideIndex]);


  // AUTO JOIN & LOAD SESSION
  useEffect(() => {
    if (!sessionCode) return;

    const fetchSession = async () => {
      try {
        // Try to fetch from backend database first
        const response = await fetch(`http://localhost:5000/session/${sessionCode}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          return;
        }
      } catch (error) {
        console.error("Error fetching session from backend:", error);
      }

      // Fallback to localStorage
      const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
      const current = sessions.find(s => s.code === sessionCode);

      if (current) {
        setSession(current);
      }
    };

    fetchSession();
  }, [sessionCode]);

  // Fetch server IP for mobile access
  useEffect(() => {
    const fetchServerIp = async () => {
      try {
        const response = await fetch("http://localhost:5000/server-ip");
        if (response.ok) {
          const data = await response.json();
          setServerIp(data.ip);
        }
      } catch (error) {
        console.error("Error fetching server IP:", error);
        // Fallback to localhost if error
      }
    };

    fetchServerIp();
  }, []);

  // Handle student joining (via socket)
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
    if (!newQuestion.trim() || !socket || isPaused) return;//added isPaused check to prevent sending questions when session is paused

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

  const handleAskAI = async (questionId: string) => {
    if (!sessionCode || aiLoading) return;

    setAiLoading(questionId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/session/${sessionCode}/question/${questionId}/ask-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to get AI answer");
        setAiLoading(null);
      }
      // Success will be handled by socket event
    } catch (error) {
      console.error("Error asking AI:", error);
      toast.error("Network error while asking AI");
      setAiLoading(null);
    }
  };

  // Update handleStudentLeave in Session.tsx:
const handleStudentLeave = () => {
  if (socket && role === "student") {
    socket.emit('student-leave', { sessionCode });
  }
  navigate("/student");
};

  const handleEndSession = async () => {
    if (socket && role === "teacher") {
      socket.emit('end-session', { sessionCode });
      
      // Also update backend
      try {
        await fetch(`http://localhost:5000/session/${sessionCode}/end`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
      } catch (error) {
        console.error("Error ending session in backend:", error);
      }
    }

    // Update localStorage backup
    const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");
    const updated = sessions.map(s =>
      s.code === sessionCode ? { ...s, status: "ended" } : s
    );
    localStorage.setItem("sessions", JSON.stringify(updated));
    setEnded(true);
    navigate(role === "teacher" ? `/session-summary/${sessionCode}` : `/student-summary/${sessionCode}`);
  };

  const handleTogglePause = () => {
    if (socket && role === "teacher") {
      socket.emit('toggle-pause', { sessionCode });
    }
  };

  const handleStartMoodCheck = () => {
    if (socket && role === "teacher") {
      socket.emit('start-mood-check', { sessionCode });
    }
  };

  const handleEndMoodCheck = () => {
    if (socket && role === "teacher") {
      socket.emit('end-mood-check', { sessionCode });
    }
  };

  const handleSubmitMood = (mood: 'understood' | 'okay' | 'confused') => {
    if (socket && !studentMoodSubmitted) {
      socket.emit('submit-mood', { sessionCode, mood, studentName: name });
      setStudentMoodSubmitted(true);
      toast.success(`Mood recorded: ${mood}`);
    }
  };

  // Generate QR code URL
  const getQRCodeUrl = () => {
    const qrUrl = `http://${serverIp}:5173/ask/${sessionCode}`;
    return encodeURIComponent(qrUrl);
  };

  const getMajorityMoods = () => {
    const max = Math.max(moodResponses.understood, moodResponses.okay, moodResponses.confused);
    if (max === 0) return [];
    const moods: string[] = [];
    if (moodResponses.understood === max) moods.push('understood');
    if (moodResponses.okay === max) moods.push('okay');
    if (moodResponses.confused === max) moods.push('confused');
    return moods;
  };

  const handleCopyQRLink = () => {
      const qrUrl = `http://${serverIp}:5173/ask/${sessionCode}`;
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
      {/* Q&A SIDEBAR - MUST BE OUTSIDE CONTAINER */}
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

      <div className="session-container">
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
                {moodCheckActive ? (
                  <button className="btn-secondary" onClick={handleEndMoodCheck}>
                    End Mood Check
                  </button>
                ) : (
                  <button className="btn-info" onClick={handleStartMoodCheck}>
                    😊 Mood Check
                  </button>
                )}
                <button className="btn-danger" onClick={handleEndSession}>End</button>
              </>
            )}

            {role === "student" && (
              <button className="btn-danger" onClick={handleStudentLeave}>Leave</button>
            )}
          </div>
        </header>

        {/* MAIN CONTENT */}
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

          {role === "student" && moodCheckActive && (
            <div className="mood-check-container">
              <div className="mood-prompt">How are you feeling about the content?</div>
              <div className="mood-buttons">
                <button
                  className="mood-btn understood"
                  onClick={() => handleSubmitMood('understood')}
                  disabled={studentMoodSubmitted}
                >
                  👍 Understood
                </button>
                <button
                  className="mood-btn okay"
                  onClick={() => handleSubmitMood('okay')}
                  disabled={studentMoodSubmitted}
                >
                  😐 Okay
                </button>
                <button
                  className="mood-btn confused"
                  onClick={() => handleSubmitMood('confused')}
                  disabled={studentMoodSubmitted}
                >
                  👎 Confused
                </button>
              </div>
            </div>
          )}
          {role === "teacher" && moodCheckActive && (
            <div className="mood-display-teacher">
              <div className="mood-header">Live Mood Responses</div>
              <div className="mood-stats">
                <div className={`mood-stat ${getMajorityMoods().includes('understood') ? 'highlighted' : ''}`}>
                  👍 Understood: {moodResponses.understood}
                </div>
                <div className={`mood-stat ${getMajorityMoods().includes('okay') ? 'highlighted' : ''}`}>
                  😐 Okay: {moodResponses.okay}
                </div>
                <div className={`mood-stat ${getMajorityMoods().includes('confused') ? 'highlighted' : ''}`}>
                  👎 Confused: {moodResponses.confused}
                </div>
              </div>
            </div>
          )}
          {role === "student" && !moodCheckActive && (
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
                    <code>{`http://${serverIp}:5173/ask/${sessionCode}`}</code>
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