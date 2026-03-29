# Vi-SlideS Documentation

A real-time classroom interaction platform where teachers create sessions, students ask questions, and teachers respond manually or with AI assistance.

**Local Development:**
```bash
# Clone the repository
git clone https://github.com/snigdha257/Vi-SlideS-basic.git
cd Vi-SlideS-basic

# Follow setup instructions
```
## 📚 Documentation

### Getting Started
- **[📖 Setup Guide](SETUP_GUIDE.md)** - Installation and configuration
- **[🏗️ Architecture](ARCHITECTURE.md)** - System design and data flow
- **[📋 API Reference](API_DOCUMENTATION.md)** - REST API and Socket.IO events

### Implementation Details
- **[⚙️ Backend Services](BACKEND_SERVICES.md)** - Server-side code structure
- **[🖥️ Frontend Components](FRONTEND_COMPONENTS.md)** - React components and UI
- **[📄 Project Overview](README.md)** - Complete documentation index

## ✨ Key Features

- **Real-time Q&A** - Live question submission and responses
- **AI Assistance** - Groq API integration for automated answers
- **QR Code Access** - Public question form via QR scanning
- **Live Roster** - Real-time student attendance tracking
- **Session Analytics** - PDF export of session summaries
- **Google OAuth** - Secure authentication for teachers and students

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19, Vite, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO |
| **Database** | MongoDB with Mongoose |
| **AI** | Groq API (LLaMA 3.3 70B) |
| **Auth** | JWT + Google OAuth, bcrypt |
| **Deployment** | GitHub Pages (Frontend), Railway/Render (Backend) |

## 📱 How It Works

1. **Teacher creates session** → Gets unique 6-character code
2. **Students join** → Enter code or scan QR
3. **Real-time interaction** → Questions appear instantly
4. **Teacher responds** → Manual or AI-powered answers
5. **Session ends** → Summary generated with analytics

## 🔗 Links

- **📂 Source Code:** [GitHub Repository](https://github.com/snigdha257/Vi-SlideS-basic)

- **📝 License:** MIT License

## 📊 Project Status

- ✅ Core Q&A functionality
- ✅ AI integration (Groq API)
- ✅ Real-time communication
- ✅ Authentication system
- ✅ Session management
- ✅ PDF export
- 🚧 Mobile app (planned)
- 🚧 Advanced analytics (planned)

---

**Version:** 1.0.0 | **Last Updated:** March 29, 2026 | **Maintained by:** Vi-SlideS Team
