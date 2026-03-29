# Vi-SlideS Architecture Documentation

## System Overview

Vi-SlideS is a **real-time classroom interaction platform** enabling live question-answer sessions with AI assistance. The system uses a **client-server architecture** with **real-time bidirectional communication** via WebSockets.

```
┌─────────────────┐                    ┌──────────────────────┐
│  Frontend App   │ ◄──► HTTP/WS ◄──► │ Backend Server       │
│ (React + Vite) │                     │ (Node.js + Express)  │
└─────────────────┘                    └──────────────────────┘
  • Components                              • Controllers
  • Socket.IO Client                        • Services
  • Browser Storage                         • Socket.IO Server
                                             • API Routes
                                                    ▼
                                           ┌──────────────────┐
                                           │ MongoDB Database │
                                           │ (Persistence)    │
                                           └──────────────────┘
```

---

## Architectural Layers

### 1. Presentation Layer (Frontend)

**Technology:** React 19 + Vite

**Responsibilities:**
- User interface and components
- Client-side authentication
- Real-time socket communication
- Session state management

**Key Structure:**
```
Frontend/src/
├── components/        # React components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Student.tsx
│   ├── Teacher.tsx
│   ├── Session.tsx
│   └── SessionSummary.tsx
├── hooks/             # Custom React hooks
│   └── useSocket.ts   # Socket.IO connection management
├── services/          # HTTP and API client
│   └── authService.ts
└── styles/            # Component CSS
```

**Data Flow:**
```
User Input → Component State → Socket.IO / HTTP → Backend
       ↓
Browser Storage (localStorage) → Session Recovery
```

### 2. API/Transport Layer

**Technologies:** HTTP REST + WebSocket (Socket.IO)

**HTTP Endpoints:**
- Authentication: `/api/auth/*`
- Session management: `/api/session/*`
- Questions/Answers: `/api/session/:code/question/*`

**WebSocket Events:**
- Real-time question submission
- Live answer broadcasting
- Student roster updates
- Session pause/resume

**Hybrid Approach:**
```
HTTP ─► Stateless operations (login, create session)
         ├─ Authentication
         └─ Data validation

Socket.IO ─► Real-time stateful operations
             ├─ Question streaming
             ├─ Answer broadcasting
             ├─ Student roster
             └─ Session control
```

### 3. Application Layer (Backend)

**Technology:** Express.js 5 + Node.js

**Responsibilities:**
- Handle HTTP requests
- Manage WebSocket connections
- Business logic execution
- Data validation and sanitization

**Architecture Pattern:** MVC (Model-View-Controller)

**File Structure:**
```
Backend/src/
├── controllers/       # Request handlers
│   ├── authController.ts
│   ├── aiController.ts
│   ├── qrController.ts
│   └── sessionController.ts
├── services/          # Business logic
│   ├── aiService.ts        # Groq API integration
│   └── sessionService.ts
├── models/            # Data models
│   ├── userModels.ts
│   └── sessionModels.ts
├── routes/            # Route definitions
│   ├── authRoutes.ts
│   └── sessionRoutes.ts
├── middleware/        # Express middleware
│   └── authMiddleware.ts
├── config/            # Configuration
│   └── db.ts          # MongoDB connection
├── socketServer.ts    # WebSocket server
└── server.ts          # Express app initialization
```

**Request Lifecycle:**
```
Request → Router → Middleware (Auth) → Controller → Service → Model → DB
   ↓
Response ← Controller ← Service processes data ← DB query result
```

### 4. Data Layer (MongoDB)

**Technology:** MongoDB + Mongoose ODM

**Collections:**

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  role: "student" | "teacher",
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique, sparse)
- `role` (for teacher filtering)

#### Sessions Collection
```javascript
{
  _id: ObjectId,
  code: String (unique, 6 chars),
  name: String,
  createdBy: String (teacher email),
  status: "active" | "ended",
  startTime: Date,
  endTime: Date,
  duration: String,
  students: [
    {
      name: String,
      email: String (optional),
      joinedAt: Date,
      leftAt: Date (null if still in session)
    }
  ],
  questions: [
    {
      id: String (timestamp),
      studentName: String,
      question: String,
      answer: String (teacher's manual response),
      aiAnswer: String (Groq-generated response),
      source: "session" | "qr",
      email: String (for QR submissions),
      timestamp: Date,
      aiAnsweredAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `code` (unique, for session lookup)
- `createdBy` (for teacher's sessions listing)
- `status` (for active session filtering)
- `startTime` (for session history sorting)

---

## Data Flow Diagrams

### Authentication Flow

```
User submits credentials
        ↓
Frontend: /register or /login (HTTP POST)
        ↓
Backend: authController validates input
        ↓
       Check if user exists in MongoDB
        ├─ EXISTS: Verify bcrypt password hash
        └─ NEW: Create user with hashed password
        ↓
Generate JWT token (HS256, 1-hour expiry)
        ↓
Return token + user info to Frontend
        ↓
Frontend: Store token in localStorage
        ↓
Subsequent requests include "Bearer {token}" in Authorization header
```

### Session Creation Flow

```
Teacher submits session form
        ↓
Frontend → POST /api/session/create-session
        ↓
Backend: authMiddleware validates JWT
        ↓
Controller generates unique 6-char code
        ↓
MongoDB: Save session document
        ↓
Server initializes in-memory cache: activeSessions[code] = {}
        ↓
Return session code + details to Frontend
        ↓
Frontend: Redirect to session page
        ↓
Frontend: Initiate Socket.IO connection with session code
```

### Real-time Question Submission

```
Student types question → Click "Ask"
        ↓
Frontend → Socket.IO event "send-question"
        ↓
Backend: socketServer receives event
        ├─ Validate sessionCode + questionText
        ├─ Create question object
        ├─ Save to MongoDB: session.questions array
        ├─ Update in-memory cache: activeSessions[code].questions
        └─ Broadcast via Socket.IO "new-question" to all clients in room
        ↓
All clients (Teacher + Students): Receive event, update UI instantly
```

### AI Answer Generation

```
Teacher clicks "Ask AI" on question
        ↓
Frontend → HTTP POST /api/session/:code/question/:id/ask-ai
        ↓
Backend: authMiddleware validates JWT
        ↓
Controller extracts question text
        ↓
aiService: Call Groq API (llama-3.3-70b model)
  Request:
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "helpful teaching assistant..." },
        { role: "user", content: "What is photosynthesis?" }
      ],
      max_tokens: 300
    }
        ↓
Groq API processes and returns response
        ↓
Backend: Strip markdown, save aiAnswer to MongoDB
        ↓
Broadcast via Socket.IO "ai-answer" to all sessions
        ↓
Frontend: Update question card with AI answer
```

---

## Real-time Communication Architecture

### Socket.IO Connection Setup

```
Frontend initiates Socket.IO connection:
  socket = io('http://localhost:5000', {
    query: {
      sessionCode: 'ABC123',
      role: 'student',
      userName: 'Alice',
      email: 'alice@example.com'
    }
  })

        ↓

Backend: socketServer.on('connection', (socket) => {
  • Extract query parameters
  • Load session from MongoDB
  • Load all questions from DB
  • Emit 'load-questions' event to client
  • Add socket to room: socket.join(sessionCode)
  • Broadcast 'update-students' to all in room
})

        ↓

All connected clients in room receive roster update
```

### Event Broadcasting Pattern

```
In-Room Broadcasting (Session participants only):
  io.of('/').in(sessionCode).emit('event', data)

Individual Socket Response:
  socket.emit('event', data)

Single Client Notification:
  socket.to(targetSocketId).emit('event', data)
```

---

## Caching Strategy

### In-Memory Cache Layer

**Purpose:** Reduce MongoDB queries for real-time responsiveness

**Structure:**
```javascript
activeSessions = {
  'ABC123': {
    code: 'ABC123',
    students: [
      { name: 'Alice', socketId: 'xyz123' },
      { name: 'Bob', socketId: 'xyz456' }
    ],
    isPaused: false,
    lastUpdate: Date.now()
  },
  'DEF456': { ... }
}
```

**Cache Lifecycle:**
1. Session created → Added to cache
2. Student joins → Added to session.students array
3. Real-time events processed from cache
4. Student leaves/session ends → Cleaned from cache
5. On restart → Rebuilt from MongoDB on first connection

**Data Consistency:**
- Cache is authoritative for connected users
- Database is backup when client reconnects
- Reconciliation on connection: "Load from DB, merge with cache"

---

## Authentication & Authorization

### JWT Token Structure

```
Header: {
  alg: "HS256",
  typ: "JWT"
}

Payload: {
  email: "user@example.com",
  name: "John Doe",
  role: "student",
  iat: 1234567890,
  exp: 1234571490
}

Signature: HMAC-SHA256(header.payload, JWT_SECRET)
```

### Authorization Matrix

| Endpoint | Guest | Student | Teacher | Admin |
|----------|-------|---------|---------|-------|
| /register | ✓ | ✓ | ✓ | N/A |
| /login | ✓ | ✓ | ✓ | N/A |
| /auth/profile | ✗ | ✓ | ✓ | ✓ |
| POST /session/create | ✗ | ✗ | ✓ | ✓ |
| GET /session/:code | ✗ | ✓ | ✓ | ✓ |
| PATCH /session/end | ✗ | ✗ | ✓ | ✓ |
| POST /ask-ai | ✗ | ✗ | ✓ | ✓ |
| POST /ask/:code (QR) | ✓ | ✓ | ✓ | ✓ |

---

## Deployment Architecture

### Development Environment

```
Laptop:
  ├─ Frontend: npm run dev (Vite, localhost:5173)
  ├─ Backend: npm run dev (Express, localhost:5000)
  └─ MongoDB: Local instance (localhost:27017)
              or MongoDB Atlas cloud
```

### Production Environment

```
Cloud Provider (Vercel/Netlify for Frontend, Render/Railway for Backend):

CDN/Static Hosting:
  └─ Frontend (React SPA)
     • Vite build output → dist/
     • Served from CDN

Backend Server:
  ├─ Node.js application
  ├─ Express + Socket.IO
  ├─ Environment variables (.env)
  └─ Connected to MongoDB Atlas

MongoDB Cloud:
  └─ MongoDB Atlas
     • Replicated cluster
     • Automated backups
     • IP whitelisting
```

**DNS & SSL:**
```
your-domain.com → DNS → API Server
                         ↝ SSL/TLS Certificate
```

---

## Security Considerations

### Authentication
- ✓ JWT tokens with expiration
- ✓ Passwords hashed with bcrypt (10 rounds)
- ✓ HTTP-only cookies (consider in future)

### Data Protection
- ✓ CORS policy restricts origins
- ✓ Input validation on all endpoints
- ✓ SQL injection prevented (MongoDB + Mongoose)
- ✓ XSS prevention via React

### Areas for Improvement
- [ ] Rate limiting on endpoints
- [ ] CSRF token for state-changing operations
- [ ] Encryption at rest for sensitive data
- [ ] Helmet.js for HTTP headers
- [ ] Request logging and monitoring
- [ ] API versioning for backward compatibility

---

## Scalability Considerations

### Current Bottlenecks
1. **In-memory cache**: Limited to server RAM, doesn't scale across servers
2. **MongoDB queries**: Single database, no sharding
3. **Socket.IO**: Single server, limited to single machine

### Scaling Strategies

**Horizontal Scaling (Multiple Servers):**
```
Load Balancer
  ├─ Backend Server 1
  ├─ Backend Server 2
  └─ Backend Server 3

Challenges:
  • Socket.IO requires Redis adapter for cross-server communication
  • Session cache must be distributed
  • Database connection pooling needed
```

**Vertical Scaling (Single Server):**
```
• Increase server RAM/CPU
• Optimize MongoDB queries
• Add database indexes
• Cache frequently accessed data
```

**Database Scaling:**
```
• MongoDB replica set (3+ nodes)
• Read replicas for scaling reads
• Sharding on session code
```

---

## Performance Optimization

### Frontend
- Code splitting via Vite
- Lazy loading components
- Local storage for offline support
- Debouncing on question submission

### Backend
- Database connection pooling
- In-memory caching for active sessions
- Index optimization on MongoDB
- Selective data loading (projection)

### Network
- Gzip compression on responses
- Mini bundling and tree shaking
- HTTP/2 for multiplexing

---

## Monitoring & Logging

**Recommended Tools:**
- **Application Logging:** Winston or Pino
- **Error Tracking:** Sentry
- **Performance Monitoring:** New Relic or Datadog
- **Database Monitoring:** MongoDB Atlas metrics
- **Real-time Alerts:** PagerDuty

**Metrics to Monitor:**
- API response times
- Socket.IO connection count
- Error rates
- Database query performance
- Uptime/availability

---

## Technology Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **React** | Component reusability, ecosystem, developer experience |
| **Vite** | Fast dev build, faster than Webpack for modern apps |
| **Socket.IO** | Real-time reliability, fallback support, widely used |
| **Express.js** | Lightweight, flexible, large ecosystem |
| **MongoDB** | Document structure fits nested questions/students, flexible schema |
| **Mongoose** | Schema validation, query builder, middleware support |
| **JWT** | Stateless auth, scalable across servers |
| **Bcrypt** | Industry standard, resistant to GPU attacks |
| **Groq API** | Fast inference for real-time AI responses |

---

## Future Enhancements

1. **Notification System:** Email/SMS for session summaries
2. **Advanced Analytics:** Question analysis, student engagement metrics
3. **Video Integration:** Streaming video alongside chat
4. **Mobile App:** Native iOS/Android apps
5. **Accessibility:** WCAG 2.1 AA compliance
6. **Internationalization:** Multi-language support
7. **Advanced Auth:** Two-factor authentication, SSO
8. **Admin Dashboard:** User management, analytics
9. **Content Moderation:** Profanity filter, spam detection
10. **Offline Mode:** PWA support for offline question storage
