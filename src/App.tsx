import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { QuizProvider } from './context/QuizContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PageTransition from './components/common/PageTransition';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Quiz from './pages/Quiz';
import QuizResults from './pages/QuizResults';
import Courses from './pages/Courses';
import AIAssist from './pages/AIAssist';
import Progress from './pages/Progress';
import ErrorBoundary from './components/ErrorBoundary';
import { THEME_TRANSITION_DURATION } from './config/animations';

// Separate AppContent component to use the theme context
const AppContent = () => {
  // We don't need to use the theme context here since the theme transitions 
  // are handled by Tailwind CSS and the Navbar component
  return (
    <AuthProvider>
      <div className={`min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-[${THEME_TRANSITION_DURATION}ms]`}>
        <Navbar />
        <div className="pt-16 flex-grow pb-12">
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <Navigate to="/" replace />
                }
              />
              <Route
                path="/quiz"
                element={
                  <ProtectedRoute>
                    <Quiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz-results"
                element={
                  <ProtectedRoute>
                    <QuizResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-assist"
                element={
                  <ProtectedRoute>
                    <AIAssist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <Progress />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </div>
        <Footer />
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  );
};

function App() {
  return (
    <QuizProvider>
      <Router>
        <ThemeProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ThemeProvider>
      </Router>
    </QuizProvider>
  );
}

export default App;