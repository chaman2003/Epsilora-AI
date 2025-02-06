import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  Heart,
  ArrowUp,
  BookOpen,
  MessageSquare,
  Award,
  Users,
  Sparkles
} from 'lucide-react';

const Footer = () => {
  const [suggestion, setSuggestion] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would typically send this to your backend
      // For now, we'll just simulate sending an email
      const emailBody = `New suggestion from ${email}:\n\n${suggestion}`;
      window.location.href = `mailto:chamans7952@gmail.com?subject=Website Suggestion&body=${encodeURIComponent(emailBody)}`;
      setIsSubmitted(true);
      setSuggestion('');
      setEmail('');
    } catch (error) {
      console.error('Error sending suggestion:', error);
    }
  };

  return (
    <footer className="relative bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-gray-900/90 dark:to-gray-800/90">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-24 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"
          style={{ animationDuration: '15s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob-spin"
          style={{ animationDuration: '25s' }}
        />
        <div 
          className="absolute -bottom-32 -left-20 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"
          style={{ animationDuration: '20s' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link 
              to="/" 
              className="group flex items-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Epsilora
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Transforming education through AI-powered learning experiences. Join us in revolutionizing how people learn and grow.
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Features</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/progress" 
                  className="group flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <Award className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Progress Tracking</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/quiz" 
                  className="group flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <BookOpen className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Interactive Quizzes</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/courses" 
                  className="group flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <Users className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Course Management</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resources</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/ai-assist" 
                  className="group flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <MessageSquare className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>AI Assistant</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/documentation" 
                  className="group flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <BookOpen className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Documentation</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/support" 
                  className="group flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <MessageSquare className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Support</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Suggestions Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share Your Ideas</h3>
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Help us improve! Share your suggestions or feedback.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    required
                  />
                  <textarea
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="Your suggestion or feedback..."
                    className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm h-24 resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
                  >
                    Send Suggestion
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-green-50/50 dark:bg-green-900/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Thank you for your feedback! We'll review it soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative pt-8 mt-12 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <a 
                href="https://x.com/2003_chaman" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/chaman-ss" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://www.linkedin.com/in/chaman-ss" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="mailto:chamans7952@gmail.com" 
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center flex items-center">
              Made with <Heart className="w-4 h-4 mx-1 text-red-500" /> by Chammy
            </p>

            <button
              onClick={scrollToTop}
              className="p-2 bg-white/80 dark:bg-gray-800/80 text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 backdrop-blur-sm"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(30px, 30px) scale(1.05);
          }
        }
        @keyframes blob-spin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) scale(1);
          }
        }
        .animate-blob {
          animation: blob infinite;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-blob-spin {
          animation: blob-spin infinite linear;
        }
      `}</style>
    </footer>
  );
};

export default Footer;