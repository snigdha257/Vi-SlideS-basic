# 📘 Vi-SlideS Documentation

Documentation for the **Vi-SlideS real-time classroom interaction platform**.  
🌐 View full documentation: https://snigdha257.github.io/Vi-SlideS-basic/

---

## 🔗 Quick Links

* [Setup Guide](https://snigdha257.github.io/Vi-SlideS-basic/SETUP_GUIDE)
* [API Documentation](https://snigdha257.github.io/Vi-SlideS-basic/API_DOCUMENTATION)
* [Architecture](https://snigdha257.github.io/Vi-SlideS-basic/ARCHITECTURE)
* [Backend Services](https://snigdha257.github.io/Vi-SlideS-basic/BACKEND_SERVICES)
* [Frontend Components](https://snigdha257.github.io/Vi-SlideS-basic/FRONTEND_COMPONENTS)
* [Project Overview](https://snigdha257.github.io/Vi-SlideS-basic/)

---

## 🚀 Getting Started

```bash
# Backend
cd Backend && npm run dev

# Frontend
cd Frontend && npm run dev
````

Open → [http://localhost:5173](http://localhost:5173)

---

## 🛠 Tech Stack

* **Frontend:** React 19, Vite, Socket.IO Client
* **Backend:** Node.js, Express, Socket.IO
* **Database:** MongoDB
* **Auth:** JWT + Google OAuth
* **AI:** Groq API (LLaMA 3.3 70B)

---

## 📂 Project Structure

```
Backend/
  ├── controllers/
  ├── services/
  ├── models/
  ├── routes/
  ├── middleware/
  └── socketServer.ts

Frontend/
  ├── components/
  ├── hooks/
  ├── services/
  └── styles/
```

---

## ✨ Key Features

* Real-time Q&A (Socket.IO)
* Manual + AI answers
* QR-based question submission
* Live student tracking
* Session summary & PDF export
* Google OAuth authentication

---

## ⚡ API Basics

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

1. Teacher creates session
2. Students join using code / QR
3. Questions sent in real-time
4. Teacher answers (manual / AI)
5. Session ends → summary generated

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

## 📌 Version

| Version | Date       | Notes           |
| ------- | ---------- | --------------- |
| 1.0     | 2026-03-29 | Initial release |

---

## 📜 License

Part of the Vi-SlideS project.

