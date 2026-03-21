import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

interface Question {
  id: string;
  studentName: string;
  question: string;
  timestamp: string;
  answer?: string;
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
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const { sessionCode, role, userName } = socket.handshake.query;

    if (!sessionCode) {
      socket.disconnect();
      return;
    }

    // Initialize session if it doesn't exist
    if (!activeSessions[sessionCode as string]) {
      activeSessions[sessionCode as string] = {
        questions: [],
        students: [],
        isPaused: false
      };
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
      }

      // 🔥 broadcast updated students
      io.to(sessionCode as string).emit(
        'update-students',
        activeSessions[sessionCode as string].students
      );
    }
    // Send existing questions to new user
    socket.emit('load-questions', activeSessions[sessionCode as string].questions);

    // Handle new question
    socket.on('send-question', (data: { sessionCode: string; question: string }) => {
      const newQuestion: Question = {
        id: Date.now().toString(),
        studentName: userName as string,
        question: data.question,
        timestamp: new Date().toISOString()
      };

      activeSessions[data.sessionCode].questions.push(newQuestion);
      
      // Broadcast to all in session
      io.to(data.sessionCode).emit('new-question', newQuestion);
      console.log(`New question in ${data.sessionCode}:`, newQuestion);
    });

    // Handle answer
    socket.on('send-answer', (data: { sessionCode: string; questionId: string; answer: string }) => {
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

    // Handle student leave
    socket.on('student-leave', (data: { sessionCode: string }) => {
      if (role === 'student' && userName) {
        const index = activeSessions[data.sessionCode].students.indexOf(userName as string);
        if (index > -1) {
          activeSessions[data.sessionCode].students.splice(index, 1);
          
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
    socket.on('end-session', (data: { sessionCode: string }) => {
      if (role === 'teacher' && activeSessions[data.sessionCode]) {
        io.to(data.sessionCode).emit('session-ended');
        console.log(`Session ${data.sessionCode} ended`);
        delete activeSessions[data.sessionCode];
      }
    });

    
    socket.on('disconnect', () => {
  console.log('User disconnected:', socket.id);

  if (role === 'student' && userName) {
    const index = activeSessions[sessionCode as string].students.indexOf(userName as string);
    if (index > -1) {
      activeSessions[sessionCode as string].students.splice(index, 1);
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