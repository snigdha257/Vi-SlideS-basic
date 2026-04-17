# 🚀 Vi-SlideS API Documentation

## 🌐 Base URL

* **Development:** [http://localhost:5000](http://localhost:5000)
* **Production:** [https://your-domain.com](https://your-domain.com)

---

## 🔐 Authentication

All protected routes require:

```
Authorization: Bearer <JWT_TOKEN>
```

* Token from `/api/auth/login` or `/api/auth/google-login`
* Expires in **1 hour**

---

## 👤 Authentication APIs

### Register

**POST** `/api/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password",
  "role": "student"
}
```

---

### Login

**POST** `/api/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password"
}
```

---

### Google Login

**POST** `/api/auth/google-login`

```json
{
  "token": "google_id_token",
  "role": "teacher|student"
}
```

* **Role-based routing** - Automatically redirects to appropriate dashboard
* **New user detection** - Shows role selector for first-time users

---

### Get Profile 🔐

**GET** `/api/auth/profile`

---

## 🧑‍🏫 Session APIs

### Create Session 🔐 (Teacher)

**POST** `/api/session/create-session`

```json
{
  "name": "Session Name",
  "code": "AUTO"
}
```

---

### Get Session 🔐

**GET** `/api/session/:code`

---

### Get Teacher Sessions 🔐

**GET** `/api/session/teacher-sessions`

---

### End Session 🔐

**PATCH** `/api/session/:code/end`

---

## ❓ Question APIs

### Submit Question (Live) 🔐

**POST** `/api/session/:code/question`

* Broadcast via `new-question`

---

### Submit QR Question (Public)

**POST** `/api/session/ask/:sessionCode`

---

### Get QR Form

**GET** `/api/session/ask/:sessionCode`

---

## 💬 Answer APIs

### Manual Answer 🔐

**POST** `/api/session/:code/question/:questionId/answer`

* Broadcast via `new-answer`

---

### AI Answer 🔐

**POST** `/api/session/:code/question/:questionId/ask-ai`

* Broadcast via `ai-answer`

---

## 🎮 Session Controls

### Pause / Resume 🔐

**PATCH** `/api/session/:code/pause`

```json
{
  "paused": true
}
```

* Broadcast via `session-paused-toggled`

---

### Get Server IP

**GET** `/api/session/server-ip`

---

## Focus Check APIs 

### Start Focus Check (Teacher) 

**POST** `/api/session/:code/focus-check/start`

* Broadcast via `pulse-check-start`

### Submit Focus Check Response (Student)

**POST** `/api/session/:code/focus-check/response`

```json
{
  "userId": "student_email",
  "present": true
}
```

* Broadcast via `pulse-check-update`

### End Focus Check (Teacher)

**POST** `/api/session/:code/focus-check/end`

* Broadcast via `pulse-check-end`

---

## Mood Check APIs

### Start Mood Check (Teacher)

**POST** `/api/session/:code/mood-check/start`

* Broadcast via `start-mood-check`

### Submit Mood Check Response (Student)

**POST** `/api/session/:code/mood-check/response`

```json
{
  "mood": "understood|okay|confused"
}
```

* Broadcast via `mood-update`

### End Mood Check (Teacher)

**POST** `/api/session/:code/mood-check/end`

* Broadcast via `mood-check-end`

---

## ⚡ Socket.IO Events

### Client → Server

* send-question
* send-answer
* toggle-pause
* end-session
* student-leave
* **pulse-check-response** - Submit focus check response
* **mood-check-response** - Submit mood check response

### Server → Client

* load-questions
* new-question
* new-answer
* ai-answer
* update-students
* session-paused-toggled
* session-ended
* **pulse-check-start** - Focus check initiated
* **pulse-check-update** - Focus check results update
* **pulse-check-end** - Focus check completed
* **start-mood-check** - Mood check initiated
* **mood-update** - Mood check results update
* **mood-check-end** - Mood check completed

---

## ❗ Error Codes

| Code | Meaning      |
| ---- | ------------ |
| 400  | Bad Request  |
| 401  | Unauthorized |
| 403  | Forbidden    |
| 404  | Not Found    |
| 500  | Server Error |

---

## ⚙️ Notes

* No rate limiting yet
* CORS allows localhost + private IPs

* **Enhanced with Focus/Mood check features**

---

## 🔄 Quick Flow (Enhanced)

1. **Teacher creates session** (Google Auth available)
2. **Students join** (Code/QR/Google Auth)
3. **Real-time Q&A interaction**
4. **Focus & Mood checks** (Teacher-controlled)
5. **Teacher answers** (Manual/AI with grammar check)
6. **Updates broadcast** in real-time
7. **Session ends** with comprehensive analytics
