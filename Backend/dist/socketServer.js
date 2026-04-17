"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketServer = void 0;
const socket_io_1 = require("socket.io");
const sessionModels_1 = __importDefault(require("./models/sessionModels"));
const activeSessions = {};
const EMPTY_MOOD_RESPONSES = {
    understood: 0,
    okay: 0,
    confused: 0
};
const createSocketServer = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: function (origin, callback) {
                // Allow requests with no origin (mobile apps, curl requests, etc.)
                if (!origin)
                    return callback(null, true);
                const allowedOrigins = [
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "http://localhost:5000"
                ];
                // Check for private IP ranges
                const isPrivateIP = /^http:\/\/(localhost|127\.|192\.168\.|10\.|172\.)/;
                if (allowedOrigins.includes(origin) || isPrivateIP.test(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('User connected:', socket.id);
        const { sessionCode, role, userName } = socket.handshake.query;
        if (!sessionCode) {
            socket.disconnect();
            return;
        }
        // Initialize session if it doesn't exist, and always recheck with DB (to keep latest questions after reloads)
        if (!activeSessions[sessionCode]) {
            activeSessions[sessionCode] = {
                questions: [],
                students: [],
                isPaused: false
            };
        }
        let currentMoodState = null;
        try {
            const dbSession = yield sessionModels_1.default.findOne({ code: sessionCode });
            if (dbSession) {
                currentMoodState = dbSession.mood || null;
                if (dbSession.questions) {
                    const loadedFromDb = dbSession.questions.map((q) => {
                        var _a, _b;
                        return ({
                            id: q.id,
                            studentName: q.studentName,
                            question: q.question,
                            timestamp: ((_a = q.timestamp) === null || _a === void 0 ? void 0 : _a.toISOString) ? q.timestamp.toISOString() : q.timestamp,
                            answer: q.answer,
                            email: q.email,
                            source: q.source || "session",
                            aiAnswer: q.aiAnswer,
                            aiAnsweredAt: ((_b = q.aiAnsweredAt) === null || _b === void 0 ? void 0 : _b.toISOString) ? q.aiAnsweredAt.toISOString() : q.aiAnsweredAt
                        });
                    });
                    const existingIds = new Set(activeSessions[sessionCode].questions.map(q => q.id));
                    const merged = [
                        ...activeSessions[sessionCode].questions,
                        ...loadedFromDb.filter(q => !existingIds.has(q.id))
                    ];
                    activeSessions[sessionCode].questions = merged;
                    if (loadedFromDb.length > 0) {
                        console.log(`Updated active session ${sessionCode} with ${loadedFromDb.length} DB questions`);
                    }
                }
                // Keep DB pause value if exists
                if (dbSession.status === 'ended') {
                    activeSessions[sessionCode].isPaused = true;
                }
            }
        }
        catch (error) {
            //console.error("Error reconciling session with DB:", error);
        }
        // Join session room
        socket.join(sessionCode);
        console.log(`${role} ${userName} joined session ${sessionCode}`);
        socket.emit('update-students', activeSessions[sessionCode].students);
        // Add student to active students list
        if (role === 'student' && userName) {
            if (!activeSessions[sessionCode].students.includes(userName)) {
                activeSessions[sessionCode].students.push(userName);
                // Saving student join to database
                try {
                    const session = yield sessionModels_1.default.findOne({ code: sessionCode });
                    if (session) {
                        if (!session.students)
                            session.students = [];
                        const existingStudent = session.students.find(s => s.name === userName);
                        if (!existingStudent) {
                            session.students.push({ name: userName, joinedAt: new Date() });
                            yield session.save();
                            console.log(`Student ${userName} saved to DB for session ${sessionCode}:`, session.students.length, "students");
                        }
                    }
                    else {
                        console.log(`Session ${sessionCode} not found in DB for saving student`);
                    }
                }
                catch (error) {
                    console.error("Error saving student join to DB:", error);
                }
            }
            // 🔥 broadcast updated students
            io.to(sessionCode).emit('update-students', activeSessions[sessionCode].students);
        }
        // Send existing questions to new user
        socket.emit('load-questions', activeSessions[sessionCode].questions);
        socket.emit('session-paused-toggled', activeSessions[sessionCode].isPaused);
        if (currentMoodState === null || currentMoodState === void 0 ? void 0 : currentMoodState.active) {
            socket.emit('mood-started');
            socket.emit('mood-update', currentMoodState.responses || EMPTY_MOOD_RESPONSES);
        }
        socket.on("start-mood-check", (_a) => __awaiter(void 0, [_a], void 0, function* ({ sessionCode }) {
            try {
                const session = yield sessionModels_1.default.findOne({ code: sessionCode });
                if (!session)
                    return;
                session.mood = {
                    active: true,
                    responses: Object.assign({}, EMPTY_MOOD_RESPONSES),
                    respondedStudents: []
                };
                session.moodSummary = null;
                session.markModified("mood");
                session.markModified("moodSummary");
                yield session.save();
                io.to(sessionCode).emit("mood-started");
                io.to(sessionCode).emit("mood-update", session.mood.responses || EMPTY_MOOD_RESPONSES);
            }
            catch (err) {
                console.error("Mood start error:", err);
            }
        }));
        socket.on("submit-mood", (_a) => __awaiter(void 0, [_a], void 0, function* ({ sessionCode, mood, studentName }) {
            var _b;
            try {
                const session = yield sessionModels_1.default.findOne({ code: sessionCode });
                if (!session || !((_b = session.mood) === null || _b === void 0 ? void 0 : _b.active))
                    return;
                if (!studentName || !["understood", "okay", "confused"].includes(mood))
                    return;
                // prevent multiple responses
                if (session.mood.respondedStudents.includes(studentName))
                    return;
                session.mood.respondedStudents.push(studentName);
                if (!session.mood.responses) {
                    session.mood.responses = Object.assign({}, EMPTY_MOOD_RESPONSES);
                }
                if (mood === "understood")
                    session.mood.responses.understood += 1;
                else if (mood === "okay")
                    session.mood.responses.okay += 1;
                else if (mood === "confused")
                    session.mood.responses.confused += 1;
                session.markModified("mood");
                yield session.save();
                io.to(sessionCode).emit("mood-update", session.mood.responses || EMPTY_MOOD_RESPONSES);
            }
            catch (err) {
                console.error("Mood submit error:", err);
            }
        }));
        socket.on("end-mood-check", (_a) => __awaiter(void 0, [_a], void 0, function* ({ sessionCode }) {
            try {
                const session = yield sessionModels_1.default.findOne({ code: sessionCode });
                if (!session || !session.mood)
                    return;
                const { understood = 0, okay = 0, confused = 0 } = session.mood.responses || EMPTY_MOOD_RESPONSES;
                const totalResponses = understood + okay + confused;
                let finalMood = "Neutral 😐";
                if (confused > understood && confused > okay) {
                    finalMood = "Confused 😟";
                }
                else if (understood > confused && understood > okay) {
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
                session.markModified("mood");
                session.markModified("moodSummary");
                yield session.save();
                io.to(sessionCode).emit("mood-ended", session.moodSummary);
            }
            catch (err) {
                console.error("Mood end error:", err);
            }
        }));
        // Handle new question
        socket.on('send-question', (data) => __awaiter(void 0, void 0, void 0, function* () {
            if (!activeSessions[data.sessionCode])
                return;
            const newQuestion = {
                id: Date.now().toString(),
                studentName: userName,
                question: data.question,
                timestamp: new Date().toISOString(),
                source: "session",
                aiAnswer: undefined,
                aiAnsweredAt: undefined
            };
            activeSessions[data.sessionCode].questions.push(newQuestion);
            // Saving question to database
            try {
                const session = yield sessionModels_1.default.findOne({ code: data.sessionCode });
                if (session) {
                    if (!session.questions)
                        session.questions = [];
                    session.questions.push(newQuestion);
                    session.markModified('questions');
                    yield session.save();
                    console.log(`Question saved to DB for session ${data.sessionCode}:`, session.questions.length, "questions");
                }
                else {
                    console.log(`Session ${data.sessionCode} not found in DB for saving question`);
                }
            }
            catch (error) {
                console.error("Error saving question to DB:", error);
            }
            // Broadcast to all in session
            io.to(data.sessionCode).emit('new-question', newQuestion);
            console.log(`New question in ${data.sessionCode}:`, newQuestion);
        }));
        // Handle answer
        socket.on('send-answer', (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!activeSessions[data.sessionCode])
                return;
            const questionIndex = activeSessions[data.sessionCode].questions.findIndex(q => q.id === data.questionId);
            if (questionIndex !== -1) {
                // Fetch the latest question from DB to ensure aiAnswer is included
                try {
                    const session = yield sessionModels_1.default.findOne({ code: data.sessionCode });
                    if (session && session.questions) {
                        const dbQuestion = session.questions.find(q => q.id === data.questionId);
                        if (dbQuestion) {
                            // Update activeSessions with the latest from DB, then set the new answer
                            activeSessions[data.sessionCode].questions[questionIndex] = {
                                id: dbQuestion.id,
                                studentName: dbQuestion.studentName,
                                question: dbQuestion.question,
                                timestamp: ((_a = dbQuestion.timestamp) === null || _a === void 0 ? void 0 : _a.toDateString) ? dbQuestion.timestamp.toDateString() : dbQuestion.timestamp.toDateString(),
                                answer: data.answer,
                                email: dbQuestion.email || undefined,
                                source: dbQuestion.source || "session",
                                aiAnswer: dbQuestion.aiAnswer || null || undefined, //added aiAnswer and aiAnsweredAt mapping
                                aiAnsweredAt: ((_b = dbQuestion.aiAnsweredAt) === null || _b === void 0 ? void 0 : _b.toDateString) ? dbQuestion.aiAnsweredAt.toDateString() : (_c = dbQuestion.aiAnsweredAt) === null || _c === void 0 ? void 0 : _c.toDateString()
                            };
                        }
                    }
                }
                catch (error) {
                    console.error("Error fetching question from DB:", error);
                    // Fallback to just updating answer
                    activeSessions[data.sessionCode].questions[questionIndex].answer = data.answer;
                }
                // Saving answer to database
                try {
                    const session = yield sessionModels_1.default.findOne({ code: data.sessionCode });
                    if (session && session.questions) {
                        const qIndex = session.questions.findIndex(q => q.id === data.questionId);
                        if (qIndex !== -1) {
                            session.questions[qIndex].answer = data.answer;
                            session.markModified('questions');
                            yield session.save();
                            console.log(`Answer saved to DB for session ${data.sessionCode}, question ${data.questionId}`);
                        }
                    }
                }
                catch (error) {
                    console.error("Error saving answer to DB:", error);
                }
                // Broadcast to all in session
                io.to(data.sessionCode).emit('new-answer', activeSessions[data.sessionCode].questions[questionIndex]);
                console.log(`Answer added in ${data.sessionCode}:`, data.questionId);
            }
        }));
        // Handle student leave
        socket.on('student-leave', (data) => __awaiter(void 0, void 0, void 0, function* () {
            if (role === 'student' && userName && activeSessions[data.sessionCode]) {
                const index = activeSessions[data.sessionCode].students.indexOf(userName);
                if (index > -1) {
                    activeSessions[data.sessionCode].students.splice(index, 1);
                    // Updating
                    try {
                        const session = yield sessionModels_1.default.findOne({ code: data.sessionCode });
                        if (session && session.students) {
                            const student = session.students.find(s => s.name === userName);
                            if (student && !student.leftAt) {
                                student.leftAt = new Date();
                                yield session.save();
                            }
                        }
                    }
                    catch (error) {
                        console.error("Error saving student leave to DB:", error);
                    }
                    // Broadcast updated students
                    io.to(data.sessionCode).emit('update-students', activeSessions[data.sessionCode].students);
                    console.log(`Student ${userName} left session ${data.sessionCode}`);
                }
            }
        }));
        // Handle pause/resume toggle
        socket.on('toggle-pause', (data) => {
            if (role === 'teacher' && activeSessions[data.sessionCode]) {
                activeSessions[data.sessionCode].isPaused = !activeSessions[data.sessionCode].isPaused;
                io.to(data.sessionCode).emit('session-paused-toggled', activeSessions[data.sessionCode].isPaused);
                console.log(`Session ${data.sessionCode} paused toggled to ${activeSessions[data.sessionCode].isPaused}`);
            }
        });
        // Handle end session
        socket.on('end-session', (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            if (role === 'teacher' && activeSessions[data.sessionCode]) {
                const endTime = new Date();
                // Save final data to database
                try {
                    const session = yield sessionModels_1.default.findOne({ code: data.sessionCode });
                    if (session) {
                        session.endTime = endTime;
                        if (session.startTime) {
                            const diff = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
                            session.duration = `${diff} min`;
                        }
                        session.status = 'ended';
                        yield session.save();
                        console.log(`Session ${data.sessionCode} ended and saved to DB. Final data:`, {
                            questions: ((_a = session.questions) === null || _a === void 0 ? void 0 : _a.length) || 0,
                            students: ((_b = session.students) === null || _b === void 0 ? void 0 : _b.length) || 0,
                            duration: session.duration
                        });
                    }
                    else {
                        console.log(`Session ${data.sessionCode} not found in DB for ending`);
                    }
                }
                catch (error) {
                    console.error("Error saving session end to DB:", error);
                }
                io.to(data.sessionCode).emit('session-ended');
                console.log(`Session ${data.sessionCode} ended`);
                delete activeSessions[data.sessionCode];
            }
        }));
        socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
            console.log('User disconnected:', socket.id);
            if (role === 'student' && userName && activeSessions[sessionCode]) {
                const index = activeSessions[sessionCode].students.indexOf(userName);
                if (index > -1) {
                    activeSessions[sessionCode].students.splice(index, 1);
                    // Updating database when student disconnects
                    try {
                        const session = yield sessionModels_1.default.findOne({ code: sessionCode });
                        if (session && session.students) {
                            const student = session.students.find(s => s.name === userName);
                            if (student && !student.leftAt) {
                                student.leftAt = new Date();
                                yield session.save();
                            }
                        }
                    }
                    catch (error) {
                        console.error("Error saving student disconnect to DB:", error);
                    }
                }
                // 🔥 broadcast updated students
                io.to(sessionCode).emit('update-students', activeSessions[sessionCode].students);
            }
        }));
    }));
    return { io, httpServer };
};
exports.createSocketServer = createSocketServer;
