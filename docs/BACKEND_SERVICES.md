# ⚙️ Vi-SlideS Backend Documentation

A simplified overview of the Node.js backend architecture and features.

---

## 🧱 Backend Structure

```id="w7k2pz"
Backend/src/
├── server.ts              # Express app initialization
├── socketServer.ts        # Socket.IO connection handling
├── config/
│   └── db.ts             # MongoDB connection
├── controllers/
│   ├── authController.ts  # Authentication endpoints
│   ├── aiController.ts    # AI integration endpoints
│   ├── qrController.ts    # QR form endpoints
│   └── sessionController.ts
├── services/
│   └── aiService.ts       # Groq API client
├── models/
│   ├── userModels.ts      # User schema
│   └── sessionModels.ts   # Session schema
├── routes/
│   ├── authRoutes.ts      # Auth endpoints
│   └── sessionRoutes.ts   # Session endpoints
├── middleware/
│   └── authMiddleware.ts  # JWT verification
└── package.json           # Dependencies
```

---

## 🚀 Core Responsibilities

* **Enhanced Authentication** (JWT + Google OAuth with role-based routing)
* **Session management** (create/join/end with pause/resume)
* **Real-time Q&A** (Socket.IO with enhanced events)
* **AI-powered answers** (Grammar checking + teaching responses)
* **QR-based question submission**
* **Focus Check System** (Timer-based attendance verification)
* **Mood Check System** (Student sentiment tracking)
* **Session Analytics** (Comprehensive data collection)

---

## 🔌 Server (server.ts)

* Initializes Express app
* Connects to MongoDB
* Registers routes
* Starts server

---

## 🔄 Real-time System (socketServer.ts)

Handles live classroom interaction.

**Main flow:**

* User joins session → added to room
* Questions sent → broadcast to all
* Answers (manual/AI) → updated live
* Session end → all users notified

**Key events:**

* `new-question` - New question submitted
* `new-answer` - Teacher manual answer
* `ai-answer` - AI-generated response
* `update-students` - Student list updates
* `session-ended` - Session termination
* `pulse-check-start` - Focus check initiated
* `pulse-check-update` - Focus check results
* `pulse-check-end` - Focus check completed
* `start-mood-check` - Mood check initiated
* `mood-update` - Mood check results
* `mood-check-end` - Mood check completed

---

## 🗄️ Database Models

### User

* name, email, password
* role (student / teacher)

### Session

* code, name, status
* students list
* questions list

### Question

* question text
* answer / AI answer
* source (session / QR)

---

## 🎮 Controllers

### Auth

* Register / Login / Google login
* Returns JWT token

### Session

* Create session (teacher only)
* Fetch session
* End session

### AI

* Teacher triggers AI answer
* Response stored + broadcast

### QR

* Public question submission
* No login required

---

## 🤖 AI Service

* Uses Groq API
* Checks grammatical errors in questions
* Generates short teaching answers
* Response saved and sent in real-time

---

## 🔐 Authentication

* JWT-based
* Protected routes use middleware
* Token stored on client

---

## 🌐 API Routes

**Auth (Enhanced)**

* `/register` - User registration with role selection
* `/login` - Email/password authentication
* `/google-login` - Google OAuth integration with role-based routing
* `/profile` - User profile management

**Session**

* `/create-session` - Create new session (teacher only)
* `/session/:code` - Fetch session details
* `/session/:code/end` - End session
* `/session/:code/pause` - Pause/Resume session

**AI (Enhanced)**

* `/ask-ai` - Generate AI-powered answers
* `/grammar-check` - Question grammar validation

**QR**

* `/ask/:code` - Public question submission via QR

**New Features**

* `/pulse-check/start` - Initiate focus check
* `/pulse-check/response` - Submit focus check response
* `/mood-check/start` - Initiate mood check
* `/mood-check/response` - Submit mood check response

---

## ⚡ System Flow (Enhanced)

```id="3h4b2k"
Teacher creates session
Students join (code / QR / Google Auth)
Real-time Q&A interaction
Focus & Mood checks (optional)
Teacher answers (manual/AI with grammar check)
Updates sent in real-time
Session ends -> comprehensive summary generated
```

---

## 📦 Data Handling

* MongoDB → persistent storage
* In-memory cache → active sessions
* Socket.IO → real-time updates

---

## 🔒 Security

* Password hashing (bcrypt)
* JWT authentication
* Basic validation

---

## Summary

Backend is designed to be:

* **real-time** (Socket.IO with enhanced events)
* **scalable** (MongoDB with optimized indexing)
* **secure** (JWT + Google OAuth integration)
* **extensible** (AI + QR + Focus/Mood check features)
* **intelligent** (Grammar checking + smart authentication)
* **analytics-driven** (Comprehensive session data collection)
