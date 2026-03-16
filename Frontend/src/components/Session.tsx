import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/teacher.css";

type SessionItem = {
  code: string;
  name: string;
  createdBy: string;
  createdAt: string;
};

export default function Session() {
  const { sessionCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = searchParams.get("role");
  const sessions: SessionItem[] = JSON.parse(localStorage.getItem("sessions") || "[]");

  const currentSession = sessions.find(
    (session) => session.code === sessionCode
  );

  if (!sessionCode || !currentSession) {
    return (
      <div className="teacher">
        <h1>No Session Found</h1>
        <button
          onClick={() => navigate(role === "teacher" ? "/teacher" : "/student")}
          className="session-button"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="teacher">
      <h1>{role === "teacher" ? "Session Created" : "Session Joined"}</h1>

      <div className="session-card">
        <h2>{currentSession.name}</h2>
        <p>
          <strong>Session Code:</strong> {currentSession.code}
        </p>
        <p>
          <strong>Status:</strong> Active
        </p>

        <button
          onClick={() => navigate(role === "teacher" ? "/teacher" : "/student")}
          className="session-button"
        >
          {role === "teacher" ? "Back to Teacher Dashboard" : "Back to Student Dashboard"}
        </button>
      </div>
    </div>
  );
}