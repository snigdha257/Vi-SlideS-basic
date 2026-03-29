import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// ✅ MOVE SOCKET OUTSIDE
const socket = io("http://localhost:5000");

const ClassPage = () => {
  const sessionCode = "Z5R8XL";
  const userName = "Ashu";
  const role = "Teacher";

  const [questions, setQuestions] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    console.log("Connecting socket...");

    // ✅ JOIN SESSION
    socket.emit("join-session", {
      sessionCode,
      userName,
      role
    });

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("load-questions", (data) => {
      console.log("Loaded questions:", data);
      setQuestions(data);
    });

    socket.on("new-question", (q) => {
      console.log("New question:", q);
      setQuestions((prev) => [...prev, q]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendQuestion = () => {
    socket.emit("send-question", {
      sessionCode,
      question: input
    });
    setInput("");
  };

  return (
    <div>
      <h1>Class Page</h1>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask question"
      />
      <button onClick={sendQuestion}>Send</button>

      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            {q.studentName}: {q.question}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassPage;