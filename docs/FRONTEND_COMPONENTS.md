# 🎓 Vi-SlideS Frontend Components

A quick reference for key React components used in the Vi-SlideS application.

---

## 🧩 Component Structure

```
App.tsx (Main Router)
├── Login.tsx
├── Register.tsx
├── Profile.tsx
├── Student.tsx (Dashboard)
├── Teacher.tsx (Dashboard)
├── Session.tsx (Live Session)
│   ├── QuestionList
│   ├── QuestionCard
│   ├── AnswerForm
│   └── StudentRoster
├── SessionSummary.tsx (Post-session)
└── PublicAsk.tsx (QR-based)

Shared Hooks:
└── useSocket.ts (Socket.IO management)

Services:
└── authService.ts (API calls)
```

---

## 🚀 Core Components

### App.tsx

* Main router
* Handles protected routes
* Stores auth state

**Routes:**

* `/login`, `/register`
* `/student`, `/teacher`
* `/session/:code`
* `/session-summary/:id`
* `/ask/:code`

---

### Login / Register

* Email + Google login
* Role selection (Student / Teacher)
* Basic validation + error handling

---

### Profile

* Displays user info
* Fetches from backend
* Logout support

---

### Student Dashboard

* Enter session code + name
* Join session
* Redirects to live session

---

### Teacher Dashboard

* Create session (auto code)
* View past sessions
* Start / End sessions

---

### Session (Main Feature ⭐)

**Student:**

* Ask questions
* View answers (manual + AI)

**Teacher:**

* View questions live
* Answer manually
* Use “Ask AI”
* Control session (pause/end)

**Real-time events:**

* `new-question`
* `new-answer`
* `ai-answer`
* `update-students`
* `session-ended`

---

### Session Summary

* Shows:

  * total questions
  * duration
  * participants
* Export as PDF

---

### PublicAsk (QR)

* No login required
* Submit question via QR
* Mobile-friendly

---

## 🔌 Shared Logic

### useSocket

* Manages Socket.IO connection
* Handles real-time updates

### authService

* login / register / profile
* stores JWT in localStorage

---

## 🎨 Styling

* Separate CSS per page
* Responsive design
* Simple color system

---

## ⚡ State Management

* Local state → forms, UI
* localStorage → auth
* Socket.IO → live data

---

## 📱 Key Features

* Real-time interaction
* Teacher-controlled AI
* QR-based question input
* Session analytics

---

## 🧠 Summary

Vi-SlideS frontend is designed to be:

* simple
* real-time
* role-based
* mobile-friendly
