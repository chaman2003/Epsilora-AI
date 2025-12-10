# Epsilora AI - Project Structure (Refactored)

## Overview
This document describes the clean, modern architecture following industry best practices with proper separation of concerns.

## Architecture Pattern
The project follows a **Clean Architecture** pattern with clear separation between:
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Define data structures
- **Routes**: Define API endpoints
- **Utils**: Shared utility functions
- **Config**: Configuration settings
- **Middleware**: Request/response processing

## Root Directory Structure

```
Epsilora-AI/
├── backend/              # Backend API server (Clean Architecture)
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── public/              # Static assets
├── src/                 # Frontend source code (Clean Architecture)
│   ├── components/      # React components
│   ├── config/          # Frontend configuration
│   ├── constants/       # Application constants
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── .env.example         # Environment variables template
├── package.json         # Frontend dependencies
└── vite.config.ts       # Vite configuration
```

## Backend Structure (`backend/`) - Clean Architecture

```
backend/
├── config/                    # Configuration layer
│   ├── config.js             # Application configuration
│   ├── cors.js               # CORS configuration
│   └── database.js           # Database connection
│
├── controllers/               # Controller layer (HTTP handling)
│   ├── authController.js     # Authentication endpoints
│   ├── chatController.js     # Chat history endpoints
│   ├── courseController.js   # Course management endpoints
│   ├── dashboardController.js # Dashboard data endpoints
│   └── quizController.js     # Quiz endpoints
│
├── middleware/                # Middleware layer
│   ├── auth.js               # Authentication middleware
│   └── errorHandler.js       # Error handling middleware
│
├── models/                    # Data models (MongoDB schemas)
│   ├── Achievement.js
│   ├── AIChat.js
│   ├── AIUsage.js
│   ├── Chat.js
│   ├── Course.js
│   ├── MilestoneProgress.js
│   ├── Quiz.js
│   ├── QuizAttempt.js
│   └── User.js
│
├── routes/                    # Route definitions
│   ├── authRoutes.js         # /api/auth/* routes
│   ├── chatRoutes.js         # /api/chat-history/* routes
│   ├── courseRoutes.js       # /api/courses/* routes
│   ├── dashboardRoutes.js    # /api/dashboard routes
│   ├── progress.js           # /api/progress/* routes
│   └── quizRoutes.js         # /api/quiz/* routes
│
├── services/                  # Business logic layer
│   ├── authService.js        # Authentication logic
│   ├── chatService.js        # Chat history logic
│   ├── courseService.js      # Course management logic
│   ├── dashboardService.js   # Dashboard data aggregation
│   └── quizService.js        # Quiz generation logic
│
├── utils/                     # Utility functions
│   ├── gemini.js             # Gemini AI utilities
│   └── responseHandler.js    # Response formatting utilities
│
├── server.js                  # Main server (clean & modular)
├── vercel.js                  # Vercel serverless entry
├── package.json              # Backend dependencies
└── vercel.json               # Vercel config
```

### Backend Architecture Layers

**1. Config Layer** (`config/`)
- Application configuration (environment variables, constants)
- Database connection management
- CORS configuration

**2. Routes Layer** (`routes/`)
- Define API endpoints
- Map endpoints to controllers
- Apply middleware (authentication, validation)

**3. Controller Layer** (`controllers/`)
- Handle HTTP requests and responses
- Validate request data
- Call appropriate service methods
- Format and send responses

**4. Service Layer** (`services/`)
- Contain all business logic
- Database operations
- External API calls (Gemini AI)
- Data processing and transformation

**5. Middleware Layer** (`middleware/`)
- Authentication/authorization
- Error handling
- Request logging
- CORS handling

**6. Utils Layer** (`utils/`)
- Helper functions
- Shared utilities
- Response formatters

## Frontend Structure (`src/`) - Clean Architecture

```
src/
├── components/                # Presentational components
│   ├── auth/                 # Authentication UI
│   ├── chat/                 # Chat UI
│   ├── common/               # Shared components
│   ├── dashboard/            # Dashboard widgets
│   └── quiz/                 # Quiz UI
│
├── config/                    # Configuration
│   ├── ai.config.ts
│   ├── animations.ts
│   ├── api.ts
│   ├── axios.ts              # HTTP client with interceptors
│   ├── server.ts
│   └── theme.ts
│
├── constants/                 # Application constants
│   └── index.ts              # API endpoints, storage keys, etc.
│
├── contexts/                  # React Context (state management)
│   ├── AuthContext.tsx
│   ├── DashboardContext.tsx
│   ├── QuizContext.tsx
│   └── ThemeContext.tsx
│
├── hooks/                     # Custom React hooks
│   └── (custom hooks here)
│
├── pages/                     # Page components (routes)
│   ├── AIAssist.tsx
│   ├── Courses.tsx
│   ├── Dashboardd.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Quiz.tsx
│   └── ...
│
├── services/                  # API service layer
│   ├── authService.ts        # Authentication API calls
│   ├── chatService.ts        # Chat API calls
│   ├── courseService.ts      # Course API calls
│   ├── dashboardService.ts   # Dashboard API calls
│   ├── quizService.ts        # Quiz API calls
│   └── index.ts              # Service exports
│
├── types/                     # TypeScript type definitions
│   └── index.ts
│
├── utils/                     # Utility functions
│   ├── markdown.ts
│   └── markdown.tsx
│
├── App.tsx                    # Main App component
├── index.css                  # Global styles
└── main.tsx                   # Entry point
```

### Frontend Architecture Layers

**1. Services Layer** (`services/`)
- All API communication
- Centralized HTTP calls
- Request/response handling
- Error handling

**2. Contexts Layer** (`contexts/`)
- Global state management
- Authentication state
- Theme management
- Shared application state

**3. Hooks Layer** (`hooks/`)
- Custom React hooks
- Reusable logic
- State management hooks

**4. Components Layer** (`components/`)
- Presentational components
- Organized by feature
- Reusable UI elements

**5. Pages Layer** (`pages/`)
- Route components
- Page-level logic
- Component composition

**6. Constants Layer** (`constants/`)
- API endpoints
- Configuration values
- Enums and constants

## Key Features by Directory

### Components (`src/components/`)
- **auth/**: Protected route wrappers
- **chat/**: Chat history and conversations
- **common/**: Reusable components (navbar, footer, transitions)
- **dashboard/**: Dashboard-specific components (metrics, charts, recommendations)
- **quiz/**: Quiz generation, history, and transitions

### Configuration (`src/config/`)
- **ai.config.ts**: Gemini AI model configuration
- **axios.ts**: HTTP client with authentication interceptors
- **api.ts**: Centralized API endpoint definitions
- **theme.ts**: Dark/light theme configuration

### Contexts (`src/contexts/`)
- **AuthContext**: User authentication and session management
- **DashboardContext**: Dashboard state and data
- **QuizContext**: Quiz state and results
- **ThemeContext**: Theme switching (dark/light mode)

### Pages (`src/pages/`)
Each page represents a distinct route in the application:
- User authentication (Login, Signup)
- Learning management (Courses, Progress)
- AI features (AIAssist, Quiz)
- Dashboard (main hub with analytics)

### Backend Services (`backend/services/`)
- **authService.js**: User authentication and JWT management
- **courseService.js**: Course management and AI extraction
- **quizService.js**: Quiz generation via Gemini AI
- **chatService.js**: Chat history management
- **dashboardService.js**: Aggregated dashboard data

### Backend Controllers (`backend/controllers/`)
- **authController.js**: Authentication endpoints (signup, login, verify)
- **courseController.js**: Course endpoints (CRUD, extraction)
- **quizController.js**: Quiz endpoints (generate, history, results)
- **chatController.js**: Chat endpoints (CRUD operations)
- **dashboardController.js**: Dashboard data aggregation

## Data Flow Architecture

### Request Flow
```
HTTP Request
    ↓
Route (routes/*.js)
    ↓
Controller (controllers/*.js) - HTTP handling
    ↓
Service (services/*.js) - Business logic
    ↓
Model (models/*.js) - Database operations
    ↓
Response
```

### Authentication Flow
```
Login Request
    ↓
authController.login()
    ↓
authService.login() - Verify credentials
    ↓
Generate JWT token
    ↓
Return token + user data
    ↓
Frontend stores token
    ↓
Subsequent requests include token
    ↓
auth.js middleware validates token
```

## Files Cleaned Up During Refactoring

### Architecture Refactoring
- ✅ `server.js` - Refactored from 1562-line monolith to clean modular structure
- ✅ `server-old-monolith.js` - Backup of original server (preserved for reference)
- ✅ `vercel.js` - Simplified from 62 lines to 6 lines
- ✅ Created Clean Architecture with proper separation of concerns

### Files Removed
- ❌ `vite.config.js` (kept `.ts` version)
- ❌ `src/context/` folder (consolidated into `contexts/`)
- ❌ `src/components/layout/` (merged into `common/`)
- ❌ `utils/` root folder (moved backend utils to `backend/utils/`)
- ❌ `Quiz.tsx.old` (backup file)
- ❌ `server-backup.js` (old backup)
- ❌ `build.sh` (unused script)
- ❌ `sample_quiz.txt` (sample data)
- ❌ `backend/test-api-folder/` (test files)
- ❌ `backend/test-api.js` (test file)
- ❌ `backend/test-package.json` (test dependencies)
- ❌ `backend/api-check.js` (test file)
- ❌ `src/utils/test-markdown.tsx` (test file)
- ❌ `scripts/` folder (unused)
- ❌ `src/pages/api/` (not used in frontend)
- ❌ `src/routes/` (backend routes - moved to `backend/routes/`)
- ❌ `src/models/` (backend models - moved to `backend/models/`)
- ❌ `src/services/aiService.ts` (old service - replaced with new architecture)
- ❌ `src/services/chatService.ts` (old version - replaced)
- ❌ `src/services/gemini.ts` (moved to `backend/utils/gemini.js`)
- ❌ `src/api/mockData.ts` (unused mock data)
- ❌ `src/utils/auth.js` (moved to backend)
- ❌ `src/utils/userUtils.ts` (unused)
- ❌ `utils/chatValidator.ts` (moved to backend)
- ❌ `src/components/AIAssist.tsx` (page exists in pages/)
- ❌ `src/components/AIChat.tsx` (unused)
- ❌ `src/components/Header.tsx` (uses Navbar instead)
- ❌ `src/components/Sidebar.tsx` (unused)
- ❌ `backend/vercel-init.js` (unused initialization script)

## Import Path Standards

After refactoring, all imports follow these conventions:

### Frontend Imports
```typescript
// Services (new architecture)
import { authService, courseService, quizService } from '../services';
// or individual imports:
import { authService } from '../services/authService';

// Constants
import { API_ENDPOINTS, STORAGE_KEYS, QUIZ_DIFFICULTIES } from '../constants';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../contexts/QuizContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';

// Config
import axiosInstance from '../config/axios';
import { API_BASE_URL } from '../config/api';

// Components
import Navbar from '../components/common/Navbar';
import PageTransition from '../components/common/PageTransition';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Utils
import { normalizeMarkdownText } from '../utils/markdown';
```

### Backend Imports
```javascript
// Controllers
const authController = require('./controllers/authController');
const courseController = require('./controllers/courseController');

// Services
const authService = require('./services/authService');
const quizService = require('./services/quizService');

// Middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Config
const config = require('./config/config');
const { connectToMongoDB } = require('./config/database');
const corsOptions = require('./config/cors');

// Utils
const { sendSuccess, sendError, asyncHandler } = require('./utils/responseHandler');
const { getGeminiAI, generateContent } = require('./utils/gemini');

// Models
const User = require('./models/User');
const Quiz = require('./models/Quiz');
```

## Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Google Gemini AI** - AI features

### Deployment
- **Vercel** - Frontend & Backend hosting
- **MongoDB Atlas** - Database hosting

## Environment Variables

### Frontend (`.env`)
```
VITE_API_URL=https://your-backend.vercel.app
VITE_GEMINI_API_KEY=your_gemini_key
```

### Backend (`.env`)
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash-exp
PORT=3001
```

## Development

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Run frontend dev server
npm run dev

# Run backend dev server
cd backend && node server.js
```

## Build & Deploy

```bash
# Build frontend
npm run build

# Deploy to Vercel (both frontend and backend)
vercel --prod
```

---

**Last Updated**: December 2025
**Refactored By**: GitHub Copilot
**Status**: ✅ Production Ready
