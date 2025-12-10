# Epsilora-AI Backend

RESTful API built with Node.js, Express, and MongoDB following Clean Architecture principles.

## Architecture Overview

This backend follows **Clean Architecture** with clear separation of concerns:

```
HTTP Request → Route → Controller → Service → Model → Database
```

### Layer Responsibilities

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Routes** | Define endpoints and HTTP methods | `routes/` |
| **Controllers** | Handle HTTP requests/responses | `controllers/` |
| **Services** | Business logic and data processing | `services/` |
| **Models** | Database schema and validation | `models/` |
| **Middleware** | Request processing, auth, errors | `middleware/` |
| **Utils** | Helper functions, AI integration | `utils/` |
| **Config** | Configuration and settings | `config/` |

## Directory Structure

```
backend/
├── config/
│   ├── config.js           # Environment configuration
│   ├── cors.js             # CORS settings
│   └── database.js         # MongoDB connection
│
├── controllers/
│   ├── authController.js       # Auth endpoints
│   ├── courseController.js     # Course endpoints
│   ├── quizController.js       # Quiz endpoints
│   ├── chatController.js       # Chat endpoints
│   └── dashboardController.js  # Dashboard endpoints
│
├── middleware/
│   ├── auth.js             # JWT authentication
│   └── errorHandler.js     # Global error handling
│
├── models/
│   ├── User.js             # User schema
│   ├── Course.js           # Course schema
│   ├── Quiz.js             # Quiz schema
│   ├── QuizAttempt.js      # Quiz attempt schema
│   ├── Chat.js             # Chat history schema
│   ├── Achievement.js      # Achievement schema
│   ├── AIUsage.js          # AI usage tracking schema
│   ├── AIChat.js           # AI chat schema
│   └── MilestoneProgress.js # Milestone schema
│
├── routes/
│   ├── authRoutes.js       # /api/auth routes
│   ├── courseRoutes.js     # /api/courses routes
│   ├── quizRoutes.js       # /api/quiz routes
│   ├── chatRoutes.js       # /api/chat routes
│   └── dashboardRoutes.js  # /api/dashboard routes
│
├── services/
│   ├── authService.js      # Authentication logic
│   ├── courseService.js    # Course management logic
│   ├── quizService.js      # Quiz generation logic
│   ├── chatService.js      # Chat management logic
│   └── dashboardService.js # Dashboard data logic
│
├── utils/
│   ├── gemini.js           # Google Gemini AI integration
│   └── responseHandler.js  # Response formatting utilities
│
├── server.js               # Express app setup
├── vercel.js               # Vercel serverless entry
└── package.json
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user
- `POST /verify-token` - Verify JWT token

### Courses (`/api/courses`)
- `GET /` - Get all courses (auth required)
- `POST /` - Create course (auth required)
- `DELETE /:id` - Delete course (auth required)
- `POST /extract-course` - Extract course from URL (auth required)

### Quizzes (`/api/quiz`)
- `POST /generate` - Generate quiz via AI (auth required)
- `GET /history` - Get quiz history (auth required)
- `POST /save-result` - Save quiz result (auth required)
- `GET /stats` - Get quiz statistics (auth required)

### Chat (`/api/chat`)
- `GET /histories` - Get all chat histories (auth required)
- `GET /histories/:id` - Get specific chat history (auth required)
- `POST /histories` - Create chat history (auth required)
- `PUT /histories/:id` - Update chat history (auth required)
- `DELETE /histories/:id` - Delete chat history (auth required)
- `DELETE /histories` - Delete all chat histories (auth required)

### Dashboard (`/api/dashboard`)
- `GET /` - Get dashboard data (auth required)

### Health Check
- `GET /health` - Server health status

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **AI Integration**: Google Gemini AI (@google/generative-ai)
- **Deployment**: Vercel Serverless Functions
- **Security**: helmet, express-rate-limit, express-mongo-sanitize

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your_secure_random_jwt_secret_here

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Server
PORT=3001
NODE_ENV=production

# CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start
```

## Development

### Adding a New Feature

1. **Create Model** (if needed): `models/YourModel.js`
2. **Create Service**: `services/yourService.js` - Business logic
3. **Create Controller**: `controllers/yourController.js` - HTTP handling
4. **Create Routes**: `routes/yourRoutes.js` - Endpoint definitions
5. **Register Routes**: Add to `server.js`

### Example: Adding a New Endpoint

```javascript
// 1. Service (services/exampleService.js)
const Example = require('../models/Example');

exports.getExamples = async (userId) => {
  return await Example.find({ userId });
};

// 2. Controller (controllers/exampleController.js)
const exampleService = require('../services/exampleService');
const { sendSuccess, asyncHandler } = require('../utils/responseHandler');

exports.getExamples = asyncHandler(async (req, res) => {
  const examples = await exampleService.getExamples(req.user.id);
  sendSuccess(res, examples, 'Examples retrieved successfully');
});

// 3. Routes (routes/exampleRoutes.js)
const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, exampleController.getExamples);

module.exports = router;

// 4. Register in server.js
const exampleRoutes = require('./routes/exampleRoutes');
app.use('/api/examples', exampleRoutes);
```

## Database Models

### User
- Authentication and profile information
- Courses, achievements, AI usage tracking

### Course
- Course metadata (title, description, URL)
- User association
- Progress tracking

### Quiz
- Quiz questions and answers
- Difficulty levels
- Topic association

### QuizAttempt
- User quiz attempts
- Scores and completion tracking
- Question responses

### Chat
- Chat history storage
- User conversations

### Achievement
- User achievements and badges
- Milestone tracking

## AI Integration

### Gemini AI Features
- **Course Extraction**: Extract structured course data from URLs
- **Quiz Generation**: Generate contextual quizzes from course content

### Usage Example

```javascript
const { generateContent } = require('./utils/gemini');

const prompt = "Generate a quiz about JavaScript closures";
const result = await generateContent(prompt);
```

## Error Handling

All controllers use `asyncHandler` wrapper for automatic error catching:

```javascript
exports.someEndpoint = asyncHandler(async (req, res) => {
  // Your code here
  // Errors are automatically caught and handled
});
```

Global error handler in `middleware/errorHandler.js`:
- Formats errors consistently
- Logs errors for debugging
- Returns appropriate HTTP status codes

## Authentication Flow

1. User signs up/logs in → JWT token generated
2. Token stored in frontend (localStorage/cookies)
3. Subsequent requests include token in Authorization header
4. `authenticateToken` middleware validates token
5. `req.user` populated with user data
6. Controller accesses `req.user.id` for user-specific operations

## Response Format

All API responses follow consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Testing

```bash
# Run tests (if configured)
npm test

# Test API endpoints
npm run test:api
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

The `vercel.json` configuration handles serverless deployment:
- All API routes available at `/api/*`
- Automatic scaling
- Environment variables configured in Vercel dashboard

## Performance Considerations

- **MongoDB Connection**: Connection pooling for efficiency
- **JWT**: Stateless authentication for scalability
- **Async/Await**: Non-blocking operations
- **Error Handling**: Graceful error recovery
- **Rate Limiting**: Prevent abuse (if configured)

## Security Best Practices

- ✅ JWT authentication on protected routes
- ✅ Password hashing with bcrypt
- ✅ MongoDB sanitization
- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Input validation

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check `MONGODB_URI` in `.env`
- Verify network access in MongoDB Atlas
- Check IP whitelist

**JWT Authentication Errors**
- Verify `JWT_SECRET` is set
- Check token format: `Bearer <token>`
- Ensure token hasn't expired

**Gemini AI Errors**
- Verify `GEMINI_API_KEY` is valid
- Check API quota/limits
- Review prompt format

## Contributing

1. Follow Clean Architecture principles
2. Keep controllers thin (HTTP only)
3. Put business logic in services
4. Use `asyncHandler` for async routes
5. Add proper error handling
6. Document new endpoints

## License

MIT License - See LICENSE file for details

---

**Last Updated**: December 2024
**Architecture**: Clean Architecture
**Status**: ✅ Production Ready
