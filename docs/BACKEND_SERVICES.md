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

* Authentication (JWT + Google)
* Session management (create/join/end)
* Real-time Q&A (Socket.IO)
* AI-powered answers
* QR-based question submission

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

* `new-question`
* `new-answer`
* `ai-answer`
* `update-students`
* `session-ended`

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
* Generates short teaching answers
* Response saved and sent in real-time

---

## 🔐 Authentication

* JWT-based
* Protected routes use middleware
* Token stored on client

---

## 🌐 API Routes

**Auth**

* `/register`
* `/login`
* `/profile`

**Session**

* `/create-session`
* `/session/:code`
* `/session/:code/end`

**AI**

* `/ask-ai`

**QR**

* `/ask/:code`

---

## ⚡ System Flow

```id="3h4b2k"
Teacher creates session
→ Students join (code / QR)
→ Questions submitted
→ Teacher answers or uses AI
→ Updates sent in real-time
→ Session ends → summary generated
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

## 🧠 Summary

Backend is designed to be:

* real-time (Socket.IO)
* scalable (MongoDB)
* secure (JWT)
* extensible (AI + QR features)
