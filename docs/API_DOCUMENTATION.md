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
  "token": "google_id_token"
}
```

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

## ⚡ Socket.IO Events

### Client → Server

* send-question
* send-answer
* toggle-pause
* end-session
* student-leave

### Server → Client

* load-questions
* new-question
* new-answer
* ai-answer
* update-students
* session-paused-toggled
* session-ended

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
* API version: v1

---

## 🔄 Quick Flow

1. Teacher creates session
2. Students send questions (Socket)
3. Teacher answers / uses AI
4. Updates broadcast in real-time
5. Session ends

