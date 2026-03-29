import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Session from './models/sessionModels';

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
    isPaused?: boolean;
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

  io.on('connection', async (socket) => {//added async here to allow await inside
    console.log('User connected:', socket.id);

    const { sessionCode, role, userName } = socket.handshake.query;

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
    if (role === 'student' && userName) {
      if (!activeSessions[sessionCode as string].students.includes(userName as string)) {
        activeSessions[sessionCode as string].students.push(userName as string);
        
        // Saving student join to database
        try {
          const session = await Session.findOne({ code: sessionCode });
          if (session) {
            if (!session.students) session.students = [] as any;
            const existingStudent = session.students.find(s => s.name === userName);
            if (!existingStudent) {
              session.students.push({ name: userName as string, joinedAt: new Date() });
              await session.save();
              console.log(`Student ${userName} saved to DB for session ${sessionCode}:`, session.students.length, "students");
            }
          } else {
            console.log(`Session ${sessionCode} not found in DB for saving student`);
          }
        } catch (error) {
          console.error("Error saving student join to DB:", error);
        }
      }

      // 🔥 broadcast updated students
      io.to(sessionCode as string).emit(
        'update-students',
        activeSessions[sessionCode as string].students
      );
    }
    // Send existing questions to new user
    socket.emit('load-questions', activeSessions[sessionCode as string].questions);
    socket.emit('session-paused-toggled', activeSessions[sessionCode as string].isPaused);
  socket.on("start-mood-check", async ({ sessionCode }) => {
  try {
    const session = await Session.findOne({ code: sessionCode });
    if (!session) return;

    session.mood = {
      active: true,
      responses: {
        understood: 0,
        okay: 0,
        confused: 0
      },
      respondedStudents: []
    };

    await session.save();

    io.to(sessionCode).emit("mood-started");
  } catch (err) {
    console.error("Mood start error:", err);
  }
});
socket.on("submit-mood", async ({ sessionCode, mood, studentName }: any) => {
  try {
    const session = await Session.findOne({ code: sessionCode });
    if (!session || !session.mood?.active) return;

    // prevent multiple responses
    if (session.mood.respondedStudents.includes(studentName)) return;

    session.mood.respondedStudents.push(studentName);

    // Ensure responses object exists and is initialized
    if (!session.mood.responses) {
      session.mood.responses = {
        understood: 0,
        okay: 0,
        confused: 0
      };
    }

    // Increment the mood count
    if (mood === "understood") session.mood.responses.understood++;
    else if (mood === "okay") session.mood.responses.okay++;
    else if (mood === "confused") session.mood.responses.confused++;

    await session.save();

    io.to(sessionCode).emit("mood-update", session.mood?.responses || {
      understood: 0,
      okay: 0,
      confused: 0
    });

  } catch (err) {
    console.error("Mood submit error:", err);
  }
});
socket.on("end-mood-check", async ({ sessionCode }) => {
  try {
    const session = await Session.findOne({ code: sessionCode });
    if (!session || !session.mood) return;

    const { understood = 0, okay = 0, confused = 0 } = session.mood.responses || {};
    const totalResponses = understood + okay + confused;

    let finalMood = "Neutral 😐";

    if (confused > understood && confused > okay) {
      finalMood = "Confused 😟";
    } else if (understood > confused && understood > okay) {
      finalMood = "Comfortable 😊";
    }

    session.moodSummary = {
      totalResponses,
      understood,
      okay,
      confused,
      finalMood
    };

    session.mood.active = false;

    await session.save();

    // 👇 THIS io is SAME io (already exists above)
    io.to(sessionCode).emit("mood-ended", session.moodSummary);

  } catch (err) {
    console.error("Mood end error:", err);
  }
});
    // Handle new question
    socket.on('send-question', async (data: { sessionCode: string; question: string }) => {
      if (!activeSessions[data.sessionCode]) return;
      const newQuestion: Question = {
        id: Date.now().toString(),
        studentName: userName as string,
        question: data.question,
        timestamp: new Date().toISOString(),
        source: "session",
        aiAnswer: undefined,
        aiAnsweredAt: undefined
      };

      activeSessions[data.sessionCode].questions.push(newQuestion);
      
      // Saving question to database
      try {
        const session = await Session.findOne({ code: data.sessionCode });
        if (session) {
          if (!session.questions) session.questions = [] as any;
          session.questions.push(newQuestion);
          session.markModified('questions');
          await session.save();
          console.log(`Question saved to DB for session ${data.sessionCode}:`, session.questions.length, "questions");
        } else {
          console.log(`Session ${data.sessionCode} not found in DB for saving question`);
        }
      } catch (error) {
        console.error("Error saving question to DB:", error);
      }
      
      // Broadcast to all in session
      io.to(data.sessionCode).emit('new-question', newQuestion);
      console.log(`New question in ${data.sessionCode}:`, newQuestion);
    });

    // Handle answer
    socket.on('send-answer', async (data: { sessionCode: string; questionId: string; answer: string }) => {
      if (!activeSessions[data.sessionCode]) return;
      const questionIndex = activeSessions[data.sessionCode].questions.findIndex(
        q => q.id === data.questionId
      );

      if (questionIndex !== -1) {
        // Fetch the latest question from DB to ensure aiAnswer is included
        try {
          const session = await Session.findOne({ code: data.sessionCode });
          if (session && session.questions) {
            const dbQuestion = session.questions.find(q => q.id === data.questionId);
            if (dbQuestion) {
              // Update activeSessions with the latest from DB, then set the new answer
              activeSessions[data.sessionCode].questions[questionIndex] = {
                id: dbQuestion.id,
                studentName: dbQuestion.studentName,
                question: dbQuestion.question,
                timestamp: dbQuestion.timestamp?.toDateString ? dbQuestion.timestamp.toDateString() : dbQuestion.timestamp.toDateString(),
                answer: data.answer,
                email: dbQuestion.email||undefined,
                source: dbQuestion.source || "session",
                aiAnswer: dbQuestion.aiAnswer||null||undefined,//added aiAnswer and aiAnsweredAt mapping
                aiAnsweredAt: dbQuestion.aiAnsweredAt?.toDateString ? dbQuestion.aiAnsweredAt.toDateString() : dbQuestion.aiAnsweredAt?.toDateString()
              };
            }
          }
        } catch (error) {
          console.error("Error fetching question from DB:", error);
          // Fallback to just updating answer
          activeSessions[data.sessionCode].questions[questionIndex].answer = data.answer;
        }
        
        // Saving answer to database
        try {
          const session = await Session.findOne({ code: data.sessionCode });
          if (session && session.questions) {
            const qIndex = session.questions.findIndex(q => q.id === data.questionId);
            if (qIndex !== -1) {
              session.questions[qIndex].answer = data.answer;
              session.markModified('questions');
              await session.save();
              console.log(`Answer saved to DB for session ${data.sessionCode}, question ${data.questionId}`);
            }
          }
        } catch (error) {
          console.error("Error saving answer to DB:", error);
        }
        
        // Broadcast to all in session
        io.to(data.sessionCode).emit('new-answer', activeSessions[data.sessionCode].questions[questionIndex]);
        console.log(`Answer added in ${data.sessionCode}:`, data.questionId);
      }
    });

    // Handle student leave
    socket.on('student-leave', async (data: { sessionCode: string }) => {
      if (role === 'student' && userName && activeSessions[data.sessionCode]) {
        const index = activeSessions[data.sessionCode].students.indexOf(userName as string);
        if (index > -1) {
          activeSessions[data.sessionCode].students.splice(index, 1);
          
          // Updating
          try {
            const session = await Session.findOne({ code: data.sessionCode });
            if (session && session.students) {
              const student = session.students.find(s => s.name === userName);
              if (student && !student.leftAt) {
                student.leftAt = new Date();
                await session.save();
              }
            }
          } catch (error) {
            console.error("Error saving student leave to DB:", error);
          }
          
          // Broadcast updated students
          io.to(data.sessionCode).emit('update-students', activeSessions[data.sessionCode].students);
          console.log(`Student ${userName} left session ${data.sessionCode}`);
        }
      }
    });

    // Handle pause/resume toggle
    socket.on('toggle-pause', (data: { sessionCode: string }) => {
      if (role === 'teacher' && activeSessions[data.sessionCode]) {
        activeSessions[data.sessionCode].isPaused = !activeSessions[data.sessionCode].isPaused;
        io.to(data.sessionCode).emit('session-paused-toggled', activeSessions[data.sessionCode].isPaused);
        console.log(`Session ${data.sessionCode} paused toggled to ${activeSessions[data.sessionCode].isPaused}`);
      }
    });

    // Handle end session
    socket.on('end-session', async (data: { sessionCode: string }) => {
      if (role === 'teacher' && activeSessions[data.sessionCode]) {
        const endTime = new Date();
        
        // Save final data to database
        try {
          const session = await Session.findOne({ code: data.sessionCode });
          if (session) {
            session.endTime = endTime;
            if (session.startTime) {
              const diff = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
              session.duration = `${diff} min`;
            }
            session.status = 'ended';
            await session.save();
            console.log(`Session ${data.sessionCode} ended and saved to DB. Final data:`, {
              questions: session.questions?.length || 0,
              students: session.students?.length || 0,
              duration: session.duration
            });
          } else {
            console.log(`Session ${data.sessionCode} not found in DB for ending`);
          }
        } catch (error) {
          console.error("Error saving session end to DB:", error);
        }
        
        io.to(data.sessionCode).emit('session-ended');
        console.log(`Session ${data.sessionCode} ended`);
        delete activeSessions[data.sessionCode];
      }
    });

    
    socket.on('disconnect', async () => {
  console.log('User disconnected:', socket.id);

  if (role === 'student' && userName && activeSessions[sessionCode as string]) {
    const index = activeSessions[sessionCode as string].students.indexOf(userName as string);
    if (index > -1) {
      activeSessions[sessionCode as string].students.splice(index, 1);
      
      // Updating database when student disconnects
      try {
        const session = await Session.findOne({ code: sessionCode });
        if (session && session.students) {
          const student = session.students.find(s => s.name === userName);
          if (student && !student.leftAt) {
            student.leftAt = new Date();
            await session.save();
          }
        }
      } catch (error) {
        console.error("Error saving student disconnect to DB:", error);
      }
    }

    // 🔥 broadcast updated students
    io.to(sessionCode as string).emit(
      'update-students',
      activeSessions[sessionCode as string].students
    );
  }
});
  });

  return { io, httpServer };
};