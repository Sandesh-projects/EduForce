# EduForce: Empowering Education with AI-Driven Quizzing

**EduForce** is a comprehensive web application that transforms the quizzing and assessment experience for both students and teachers. Powered by AI, it offers personalized performance insights for students and robust quiz management tools for educators.

---

## 🧭 Quick Navigation

| Section                             | Description                     |
| ----------------------------------- | ------------------------------- |
| [🚀 Quick Start](#-quick-start)     | Get up and running in 5 minutes |
| [✨ Features](#-features)           | Complete feature overview       |
| [🛠️ Installation](#️-installation)  | Step-by-step setup guide        |
| [📱 Usage](#-usage)                 | How to use the application      |
| [🔧 Configuration](#-configuration) | Environment setup               |
| [📽️ Live Demo](#️-live-demo)        | Try it now                      |

---

## 🚀 Quick Start

```bash
# 1. Clone and navigate
git clone https://github.com/Sandesh-projects/EduForce.git
cd EduForce

# 2. Setup backend
cd backend && npm install && node index.js

# 3. Setup frontend (new terminal)
cd frontend && npm install && npm run dev

# 4. Visit: http://localhost:5173
```

**⚡ Need help?** Jump to [Detailed Installation](#️-detailed-installation)

---

## 📚 Table of Contents

- [🧭 Quick Navigation](#-quick-navigation)
- [🚀 Quick Start](#-quick-start)
- [✨ Features](#-features)
  - [👨‍🎓 For Students](#-for-students)
  - [👩‍🏫 For Teachers](#-for-teachers)
- [🛠️ Technologies Used](#️-technologies-used)
- [📁 Project Structure](#-project-structure)
- [🛠️ Installation](#️-installation)
  - [📋 Prerequisites](#-prerequisites)
  - [🔧 Backend Setup](#-backend-setup)
  - [⚛️ Frontend Setup](#️-frontend-setup)
- [🔧 Configuration](#-configuration)
- [📱 Usage](#-usage)
- [🌐 API Endpoints](#-api-endpoints)
- [📽️ Live Demo](#️-live-demo)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 👨‍🎓 For Students

- **📊 Smart Dashboard**: Clean interface with performance overview
- **🧠 AI Analysis**: Personalized insights using Google Gemini API
- **📚 Quiz Library**: Access all attempted quizzes and reports
- **📈 Progress Tracking**: Monitor improvement over time
- **📱 Mobile Friendly**: Study anywhere, anytime

### 👩‍🏫 For Teachers

- **🎯 Quiz Management**: Create, edit, and organize quizzes
- **👥 Student Management**: Assign quizzes to specific students
- **📊 Analytics Dashboard**: Track class performance and engagement
- **📋 Detailed Reports**: Export and analyze student data
- **🔒 Secure Access**: Role-based authentication system

---

## 🛠️ Technologies Used

<details>
<summary><strong>Frontend Stack</strong></summary>

- **React 19** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client
- **React Router DOM v6** - Navigation
- **Zustand** - State management
- **jsPDF** - PDF generation
- **React Toastify** - Notifications

</details>

<details>
<summary><strong>Backend Stack</strong></summary>

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Bcrypt.js** - Password hashing
- **CORS** - Cross-origin requests
- **Google Gemini API** - AI analysis

</details>

---

## 📁 Project Structure

```
EduForce/
├── 📂 backend/                 # Server-side code
│   ├── 📄 index.js            # Entry point
│   ├── 🔒 .env                # Environment variables
│   └── 📂 src/
│       ├── 📂 config/         # Database & API configs
│       ├── 📂 controllers/    # Business logic
│       ├── 📂 middleware/     # Authentication & validation
│       ├── 📂 models/         # Database schemas
│       ├── 📂 routes/         # API endpoints
│       └── 📂 services/       # External services
├── 📂 frontend/               # Client-side code
│   ├── 📄 index.html         # HTML entry point
│   ├── ⚙️ vite.config.js     # Vite configuration
│   ├── 🔒 .env               # Environment variables
│   └── 📂 src/
│       ├── 📄 App.jsx        # Main component
│       ├── 🔗 axios.js       # API configuration
│       ├── 📂 components/    # Reusable components
│       ├── 📂 context/       # State management
│       ├── 📂 pages/         # Route components
│       └── 📂 assets/        # Static files
└── 📄 README.md              # You are here!
```

---

## 🛠️ Installation

### 📋 Prerequisites

Ensure you have these installed:

| Tool    | Version | Download                            |
| ------- | ------- | ----------------------------------- |
| Node.js | v18+    | [nodejs.org](https://nodejs.org/)   |
| npm     | Latest  | Comes with Node.js                  |
| Git     | Latest  | [git-scm.com](https://git-scm.com/) |

### 🔧 Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
code .env
```

**Environment Configuration:**

```env
# backend/.env
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET_KEY=your_strong_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

**Start the server:**

```bash
node index.js
# Server runs at: http://localhost:5000
```

### ⚛️ Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
touch .env
```

**Environment Configuration:**

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:5000
```

**Start development server:**

```bash
npm run dev
# App runs at: http://localhost:5173
```

---

## 🔧 Configuration

<details>
<summary><strong>MongoDB Setup</strong></summary>

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Add to `MONGODB_URI` in backend/.env

</details>

<details>
<summary><strong>Google Gemini API</strong></summary>

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to `GEMINI_API_KEY` in backend/.env

</details>

<details>
<summary><strong>JWT Secret</strong></summary>

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

</details>

---

## 📱 Usage

### 👨‍🎓 For Students

1. **Register/Login** - Create account or sign in
2. **Take Quizzes** - Browse and attempt available quizzes
3. **View Results** - Get instant feedback and AI analysis
4. **Track Progress** - Monitor performance over time

### 👩‍🏫 For Teachers

1. **Create Quizzes** - Design custom assessments
2. **Assign to Students** - Share quizzes with specific learners
3. **Monitor Progress** - Track student performance
4. **Generate Reports** - Export detailed analytics

---

## 🌐 API Endpoints

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | User registration |
| POST   | `/api/auth/login`    | User login        |
| POST   | `/api/auth/logout`   | User logout       |

</details>

<details>
<summary><strong>Quizzes</strong></summary>

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/api/quizzes`     | Get all quizzes   |
| POST   | `/api/quizzes`     | Create new quiz   |
| GET    | `/api/quizzes/:id` | Get specific quiz |
| PUT    | `/api/quizzes/:id` | Update quiz       |
| DELETE | `/api/quizzes/:id` | Delete quiz       |

</details>

<details>
<summary><strong>Results</strong></summary>

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| POST   | `/api/results`          | Submit quiz results |
| GET    | `/api/results/user/:id` | Get user results    |
| GET    | `/api/results/quiz/:id` | Get quiz results    |

</details>

---

## 📽️ Live Demo

🌟 **Try EduForce Now:** [https://eduforce-frontend.vercel.app](https://eduforce-frontend.vercel.app)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 🔄 Quick Contribution Guide

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/EduForce.git

# 3. Create feature branch
git checkout -b feature/amazing-feature

# 4. Make changes and commit
git commit -m "Add amazing feature"

# 5. Push and create PR
git push origin feature/amazing-feature
```

### 📝 Contribution Guidelines

- Follow existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Need Help?

- 📧 **Email:** sandesh.vlcs@gmail.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/Sandesh-projects/EduForce/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Sandesh-projects/EduForce/discussions)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

[⬆️ Back to Top](#eduforce-empowering-education-with-ai-driven-quizzing)

</div>
