# 🎓 Vi-SlideS Frontend Components

A comprehensive reference for React components and features in the Vi-SlideS application.

---

## 🧩 Component Structure

```
App.tsx (Main Router)
  ├── Login.tsx (Enhanced with Google OAuth)
  ├── Register.tsx (Enhanced with Google OAuth)
  ├── RoleSelector.tsx (Role selection for new users)
  ├── Profile.tsx
  ├── Student.tsx (Dashboard)
  ├── Teacher.tsx (Dashboard)
  ├── Session.tsx (Live Session - Enhanced)
  │   ├── Focus Check System
  │   ├── Mood Check System
  │   ├── Theme Toggle
  │   ├── QuestionList
  │   ├── QuestionCard
  │   ├── AnswerForm
  │   ├── StudentRoster
  │   └── QR Modal
  ├── SessionSummary.tsx (Post-session)
  ├── PublicAsk.tsx (QR-based)
  └── StudentSummary.tsx

Shared Hooks:
  └── useSocket.ts (Socket.IO management)

Services:
  └── authService.ts (Enhanced with Google OAuth)
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

### Login / Register (Enhanced)

* **Enhanced Authentication** - Email + Google OAuth integration
* **Smart Role Selection** - RoleSelector component for new Google users
* **Role-based Redirection** - Automatic routing to appropriate dashboards
* **Existing User Detection** - Direct dashboard access for returning users
* **Professional UI** - Enhanced styling with gradients and animations

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

### Session (Main Feature Enhanced)

**Student Features:**

* Ask questions with real-time submission
* View answers (manual + AI)
* **Focus Check Response** - Timer-based presence verification
* **Mood Check Response** - Sentiment tracking (Present only option)
* **Theme Toggle** - Dark/Light mode preference

**Teacher Features:**

* View questions live with sidebar navigation
* Answer manually or use AI assistance
* **Focus Check Control** - Start/End attendance verification
* **Mood Check Control** - Start/End sentiment tracking
* **Session Management** - Pause/Resume/End functionality
* **Student Roster** - Live participant tracking
* **QR Code Generation** - Mobile-friendly question submission
* **Professional UI** - Enhanced animations and modern design

**Real-time events:**

* `new-question` - New question submitted
* `new-answer` - Teacher manual answer
* `ai-answer` - AI-generated response
* `update-students` - Student list updates
* `session-ended` - Session termination
* `pulse-check-start` - Focus check initiated
* `pulse-check-update` - Focus check results
* `mood-update` - Mood check results

**New Components:**

* **RoleSelector** - Role selection for new Google users
* **Focus Check UI** - Timer-based attendance interface
* **Mood Check UI** - Sentiment tracking interface
* **Theme Toggle** - Dark/Light mode switcher

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

## 🎨 Styling (Enhanced)

* **Professional Design System** - Modern gradients and animations
* **Theme Support** - Dark/Light mode with CSS variables
* **Responsive Design** - Mobile-friendly layouts
* **Enhanced Accessibility** - Better contrast and focus states
* **Micro-interactions** - Smooth hover states and transitions
* **Component-based CSS** - Modular styling per component

---

## ⚡ State Management

* **Local State** -> Forms, UI interactions, theme preferences
* **localStorage** -> Auth tokens, theme settings, user preferences
* **Socket.IO** -> Real-time data, live updates, session state
* **Context API** -> Global theme and authentication state

---

## 📱 Key Features

* **Real-time Interaction** - Live Q&A with instant updates
* **Teacher-controlled AI** - Groq API integration for automated answers
* **QR-based Question Input** - Mobile-friendly submission
* **Session Analytics** - Comprehensive PDF exports and insights
* **Focus Check System** - Timer-based attendance verification
* **Mood Check System** - Student sentiment tracking
* **Enhanced Authentication** - Google OAuth with smart routing
* **Professional UI/UX** - Modern design with theme support

---

## 🧠 Summary

Vi-SlideS frontend is designed to be:

* simple
* real-time
* role-based
* mobile-friendly
