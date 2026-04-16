# Vi-SlideS Documentation

Documentation for the **Vi-SlideS real-time classroom interaction platform**.  
View full documentation: https://snigdha257.github.io/Vi-SlideS-basic/

---

## Quick Links

* [Setup Guide](https://snigdha257.github.io/Vi-SlideS-basic/SETUP_GUIDE)
* [API Documentation](https://snigdha257.github.io/Vi-SlideS-basic/API_DOCUMENTATION)
* [Architecture](https://snigdha257.github.io/Vi-SlideS-basic/ARCHITECTURE)
* [Backend Services](https://snigdha257.github.io/Vi-SlideS-basic/BACKEND_SERVICES)
* [Frontend Components](https://snigdha257.github.io/Vi-SlideS-basic/FRONTEND_COMPONENTS)
* [Project Overview](https://snigdha257.github.io/Vi-SlideS-basic/)

---

## Getting Started

```bash
# Backend
cd Backend && npm run dev

# Frontend
cd Frontend && npm run dev
```

Open http://localhost:5173

---

## Tech Stack

* **Frontend:** React 19, Vite, Socket.IO Client, Google OAuth
* **Backend:** Node.js, Express, Socket.IO
* **Database:** MongoDB
* **Auth:** JWT + Google OAuth with role-based redirection
* **AI:** Groq API (LLaMA 3.3 70B)

---

## Project Structure

```
Backend/
  controllers/
  services/
  models/
  routes/
  middleware/
  socketServer.ts

Frontend/
  components/
    Login.tsx
    Register.tsx
    Session.tsx
    RoleSelector.tsx
  hooks/
  services/
  styles/
```

---

## Key Features

### Core Classroom Features
* **Real-time Q&A** - Live question submission and responses
* **AI-Powered Answers** - Groq API integration for automated responses
* **QR Code Access** - Public question form via QR scanning
* **Live Student Tracking** - Real-time attendance and participation

### New Enhanced Features
* **Focus Check** - Real-time attendance verification with timer
* **Mood Check** - Student sentiment tracking (Understood/Okay/Confused)
* **Theme Toggle** - Dark/Light mode with professional styling
* **Enhanced Google Auth** - Role-based authentication with smart redirection
* **Professional UI** - Enhanced animations, gradients, and modern design

### Session Management
* **Session Controls** - Pause/Resume/End functionality
* **Student Roster** - Live participant tracking
* **Session Analytics** - PDF export with comprehensive summaries
* **Multi-modal Input** - Web app + QR code support

---

## API Basics

* Base URL: `http://localhost:5000/api`
* Auth: JWT in `Authorization` header
* Real-time: Socket.IO

**Core Endpoints:**

```
POST /auth/register
POST /auth/login
POST /session/create-session
GET  /session/:code
```

📖 Full API → [API_DOCUMENTATION](https://snigdha257.github.io/Vi-SlideS-basic/API_DOCUMENTATION)

---

## 🔄 Quick Workflow

1. **Authentication** - Login via email/password or Google OAuth
2. **Session Creation** - Teacher creates session with unique code
3. **Student Access** - Students join via code, QR, or Google Auth
4. **Real-time Interaction** - Questions, Focus/Mood checks, answers
5. **Session Management** - Pause, resume, track participation
6. **Session Completion** - End session, generate PDF summary

---

## New Features v2.0

### Focus Check System
- **Real-time Attendance** - Timer-based presence verification
- **Smart Detection** - Auto-mark absent if no response
- **Live Analytics** - Present/Absent counts with participant lists
- **Teacher Controls** - Start/End focus checks with detailed reporting

### Mood Check System  
- **Student Sentiment** - Track understanding levels (Understood/Okay/Confused)
- **Real-time Feedback** - Live mood distribution charts
- **Class Insights** - Immediate feedback on content comprehension
- **Historical Data** - Mood trends across sessions

### Enhanced Authentication
- **Google OAuth Integration** - Seamless Google account login
- **Role-based Redirection** - Smart routing to appropriate dashboards
- **New User Detection** - Automatic role selection for first-time users
- **Existing User Recognition** - Direct dashboard access for returning users

### Professional UI/UX
- **Theme Toggle** - Dark/Light mode with persistent preferences
- **Modern Design** - Professional gradients, animations, and transitions
- **Enhanced Accessibility** - Better contrast, responsive layouts
- **Improved Interactions** - Smooth hover states and micro-animations

---

## 🧩 Core Modules

### Authentication

* Email/password + Google OAuth
* JWT-based auth (1 hour expiry)
* Role-based access (Teacher / Student)

### Sessions

* Unique 6-char session codes
* Real-time student list
* Pause / resume / end session

### Q&A System

* Live question submission
* AI + manual answers
* QR public form support

### AI Integration

* Groq API (LLaMA 3.3 70B)
* Fast, concise responses
* Teacher-controlled usage

---

## 🗄 Database Models

**User**

```
name, email, password, role, createdAt
```

**Session**

```
code, name, createdBy, status,
students[], questions[]
```

---

## 🔐 Security

* Bcrypt password hashing
* JWT authentication
* Input validation
* CORS protection

**Planned:**

* Rate limiting
* Helmet.js
* API versioning

---

## 📈 Performance

* In-memory session cache
* MongoDB indexing
* Socket.IO room-based events

---

## 🧪 Development

```bash
# Run both servers
cd Backend && npm run dev
cd Frontend && npm run dev
```

---

## 🚢 Deployment Checklist

* Configure `.env`
* Setup MongoDB Atlas
* Update CORS origins
* Add logging + monitoring
* Verify API keys (Google, Groq)

---

## 🧠 Reading Guide

* **Beginner:** Setup → Architecture
* **Frontend:** Frontend Components + API
* **Backend:** Backend Services + API
* **Deployment:** Architecture

---

## ❗ Common Issues

* **MongoDB error:** Check URI
* **Port in use:** Kill process
* **CORS issues:** Verify origin
* **Socket errors:** Check backend running

---

## Version

| Version | Date       | Notes           |
| ------- | ---------- | --------------- |
| 2.0     | 2026-04-16 | Enhanced with Focus/Mood checks, Google Auth, Theme Toggle |
| 1.0     | 2026-03-29 | Initial release |

---

## License

Part of the Vi-SlideS project.

