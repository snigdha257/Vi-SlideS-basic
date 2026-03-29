import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Session from "./models/sessionModels";
interface Question {
  id: string;
  studentName: string;
  question: string;
  timestamp: string;
  answer?: string;
  email?: string;
  source: string;
  aiAnswer?: string;//added aiAnswer and aiAnsweredAt to Question interface
  aiAnsweredAt?: string;
}
interface ActiveSession {
  [sessionCode: string]: {
    questions: Question[];
    students: string[];
    isPaused: boolean;// to track for pausing the session
  };
}

const activeSessions: ActiveSession = {};

export const createSocketServer = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: function(origin: string | undefined, callback: any) {
        // Allow requests with no origin (mobile apps, curl requests, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://localhost:5000"
        ];

        // Check for private IP ranges
        const isPrivateIP = /^http:\/\/(localhost|127\.|192\.168\.|10\.|172\.)/;
        
        if (allowedOrigins.includes(origin) || isPrivateIP.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', async(socket) => {
    console.log('User connected:', socket.id);

    const { sessionCode, role, userName } = socket.handshake.query as any;

    if (!sessionCode) {
      socket.disconnect();
      return;
    }

    // Initialize session if it doesn't exist, and always recheck with DB (to keep latest questions after reloads)
    if (!activeSessions[sessionCode as string]) {
      activeSessions[sessionCode as string] = {
        questions: [],
        students: [],
        isPaused: false
      };
      if (role === 'teacher') {
    try {
      const existing = await Session.findOne({ code: sessionCode });

      if (!existing) {
        await Session.create({
          code: sessionCode,
          students: [],
          questions: [],
          duration: "0"
        });

        console.log("✅ Session created in DB");
      }

    } catch (error) {
      console.log("DB ERROR:", error);
    }
  }

    }

    try {
      const dbSession = await Session.findOne({ code: sessionCode });
      if (dbSession && dbSession.questions) {
        const loadedFromDb = dbSession.questions.map((q: any) => ({
          id: q.id,
          studentName: q.studentName,
          question: q.question,
          timestamp: q.timestamp?.toISOString ? q.timestamp.toISOString() : q.timestamp,
          answer: q.answer,
          email: q.email,
          source: q.source || "session",
          aiAnswer: q.aiAnswer,//added aiAnswer and aiAnsweredAt mapping
          aiAnsweredAt: q.aiAnsweredAt?.toISOString ? q.aiAnsweredAt.toISOString() : q.aiAnsweredAt
        }));

        const existingIds = new Set(activeSessions[sessionCode as string].questions.map(q => q.id));
        const merged = [
          ...activeSessions[sessionCode as string].questions,
          ...loadedFromDb.filter(q => !existingIds.has(q.id))
        ];

        activeSessions[sessionCode as string].questions = merged;
        if (loadedFromDb.length > 0) {
          console.log(`Updated active session ${sessionCode} with ${loadedFromDb.length} DB questions`);
        }

        // Keep DB pause value if exists
        if (dbSession.status === 'ended') {
          activeSessions[sessionCode as string].isPaused = true;
        }
      }
    } catch (error) {
      //console.error("Error reconciling session with DB:", error);
    }
  
    // Join session room
    socket.join(sessionCode as string);
    console.log(`${role} ${userName} joined session ${sessionCode}`);
    socket.emit(
      'update-students',
      activeSessions[sessionCode as string].students
    );
    // Add student to active students list
    // Add student to active students list + SAVE TO DB
if (role === 'student' && userName) {

  if (!activeSessions[sessionCode as string].students.includes(userName as string)) {
    activeSessions[sessionCode as string].students.push(userName as string);
  }
  try {
    const session = await Session.findOne({ code: sessionCode as string });

    if (session) {
      session.students.push({
        name: userName,
        email: `${userName}@mail.com`, // temporary email
        joinedAt: new Date()
      });

      await session.save();

      console.log(" Student saved in DB");
    } else {
      console.log("Session not found in DB");
    }

  } catch (error) {
    console.log("DB ERROR:", error);
  }
}
    // Send existing questions and pause state to new user
    socket.emit('load-questions', activeSessions[sessionCode as string].questions);
    socket.emit('session-paused-toggled', activeSessions[sessionCode as string].isPaused);

    // Handle new question
   socket.on('send-question', async (data: { sessionCode: string; question: string }) => {
  const session = activeSessions[data.sessionCode];
  if (!session || session.isPaused) {
    return;
  }

  const newQuestion: Question = {
    id: Date.now().toString(),
    studentName: userName as string,
    question: data.question,
    timestamp: new Date().toISOString()
  };

  session.questions.push(newQuestion);

  // for DB, we only save question text, student name and timestamp. Answer will be added later when teacher answers
  try {
    await Session.updateOne(
      { code: data.sessionCode },
      {
        $push: {
          questions: {
            question: data.question,
            studentName: userName,
            timestamp: new Date()
          }
        }
      }
    );

    console.log(" Question saved in DB");
  } catch (err) {
    console.log("DB ERROR:", err);
  }

  // Broadcast
  io.to(data.sessionCode).emit('new-question', newQuestion);
});
    // Handle answer
    socket.on('send-answer', async (data: { sessionCode: string; questionId: string; answer: string }) => {
      if (!activeSessions[data.sessionCode]) return;
      const questionIndex = activeSessions[data.sessionCode].questions.findIndex(
        q => q.id === data.questionId
      );

      if (questionIndex !== -1) {
        activeSessions[data.sessionCode].questions[questionIndex].answer = data.answer;

        // Broadcast to all in session
        io.to(data.sessionCode).emit('new-answer', activeSessions[data.sessionCode].questions[questionIndex]);
        console.log(`Answer added in ${data.sessionCode}:`, data.questionId);
      }
    });

    // Handle end session
    socket.on('end-session', (data: { sessionCode: string }) => {
      if (role === 'teacher') {
        io.to(data.sessionCode).emit('session-ended');
        delete activeSessions[data.sessionCode];
        console.log(`Session ${data.sessionCode} ended by teacher`);
      }
    });

    // Handle toggle pause
    socket.on('toggle-pause', (data: { sessionCode: string }) => {
      if (role === 'teacher') {
        const session = activeSessions[data.sessionCode];
        if (session) {
          session.isPaused = !session.isPaused;
          io.to(data.sessionCode).emit('session-paused-toggled', session.isPaused);
          console.log(`Session ${data.sessionCode} pause state: ${session.isPaused}`);
        }
      }
    });

    socket.on('disconnect', async () => {
  console.log('User disconnected:', socket.id);

  if (role === 'student' && userName && activeSessions[sessionCode as string]) {

    const index = activeSessions[sessionCode as string].students.indexOf(userName as string);

    if (index > -1) {
      activeSessions[sessionCode as string].students.splice(index, 1);
    }

    //  UPDATE LEAVE TIME IN DB
    try {
      const session = await Session.findOne({ code: sessionCode });

      if (session) {

        const student = session.students.find(
          (s: any) => s.name === userName
        );

        if (student) {
          student.leftAt = new Date();
          await session.save();

          console.log("✅ Leave time updated in DB");
        }
      }

    } catch (error) {
      console.log("DB ERROR:", error);
    }
  }
});
  });

  return { io, httpServer };
};