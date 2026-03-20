"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketServer = void 0;
const socket_io_1 = require("socket.io");
const activeSessions = {};
const getActiveStudents = (sessionCode) => {
    var _a;
    return Object.keys(((_a = activeSessions[sessionCode]) === null || _a === void 0 ? void 0 : _a.studentConnections) || {});
};
const removeStudentConnection = (sessionCode, userName, socketId) => {
    const session = activeSessions[sessionCode];
    if (!(session === null || session === void 0 ? void 0 : session.studentConnections[userName]))
        return;
    session.studentConnections[userName] = session.studentConnections[userName].filter((id) => id !== socketId);
    if (session.studentConnections[userName].length === 0) {
        delete session.studentConnections[userName];
    }
};
const createSocketServer = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
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
        if (!activeSessions[sessionCode]) {
            activeSessions[sessionCode] = {
                questions: [],
                studentConnections: {}
            };
        }
        // Join session room
        socket.join(sessionCode);
        console.log(`${role} ${userName} joined session ${sessionCode}`);
        // Add student to active students list
        if (role === 'student' && userName) {
            const sessionStudents = activeSessions[sessionCode].studentConnections;
            const studentName = userName;
            if (!sessionStudents[studentName]) {
                sessionStudents[studentName] = [];
            }
            if (!sessionStudents[studentName].includes(socket.id)) {
                sessionStudents[studentName].push(socket.id);
            }
            io.to(sessionCode).emit('active-students', getActiveStudents(sessionCode));
        }
        // Send existing questions to new user
        socket.emit('load-questions', activeSessions[sessionCode].questions);
        socket.emit('active-students', getActiveStudents(sessionCode));
        // Handle new question
        socket.on('send-question', (data) => {
            const newQuestion = {
                id: Date.now().toString(),
                studentName: userName,
                question: data.question,
                timestamp: new Date().toISOString()
            };
            activeSessions[data.sessionCode].questions.push(newQuestion);
            // Broadcast to all in session
            io.to(data.sessionCode).emit('new-question', newQuestion);
            console.log(`New question in ${data.sessionCode}:`, newQuestion);
        });
        // Handle answer
        socket.on('send-answer', (data) => {
            const questionIndex = activeSessions[data.sessionCode].questions.findIndex(q => q.id === data.questionId);
            if (questionIndex !== -1) {
                activeSessions[data.sessionCode].questions[questionIndex].answer = data.answer;
                // Broadcast to all in session
                io.to(data.sessionCode).emit('new-answer', activeSessions[data.sessionCode].questions[questionIndex]);
                console.log(`Answer added in ${data.sessionCode}:`, data.questionId);
            }
        });
        socket.on('leave-session', () => {
            if (role === 'student' && userName) {
                removeStudentConnection(sessionCode, userName, socket.id);
                io.to(sessionCode).emit('active-students', getActiveStudents(sessionCode));
            }
        });
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Remove student from active list
            if (role === 'student' && userName) {
                removeStudentConnection(sessionCode, userName, socket.id);
                io.to(sessionCode).emit('active-students', getActiveStudents(sessionCode));
            }
        });
    });
    return { io, httpServer };
};
exports.createSocketServer = createSocketServer;
