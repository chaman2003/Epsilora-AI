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
  Sparkles,
  BarChart2,
  Brain,
  Bot
} from 'lucide-react';
import { themeConfig } from '../../config/theme';

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
    <footer className="relative bg-gradient-to-br from-slate-50/90 to-white/90 dark:from-slate-900/90 dark:to-gray-800/90 border-t border-gray-200/30 dark:border-gray-700/30">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-24 -right-20 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full mix-blend-multiply filter blur-xl animate-blob"
          style={{ animationDuration: '15s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-purple-500/10 dark:bg-purple-500/5 rounded-full mix-blend-multiply filter blur-xl animate-blob-spin"
          style={{ animationDuration: '25s' }}
        />
        <div 
          className="absolute -bottom-32 -left-20 w-72 h-72 bg-teal-500/10 dark:bg-teal-500/5 rounded-full mix-blend-multiply filter blur-xl animate-blob"
          style={{ animationDuration: '20s' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link 
              to="/" 
              className="group flex items-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Epsilora
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transforming education through AI-powered learning experiences.
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/progress" 
                  className="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <BarChart2 className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Progress Tracking</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/quiz" 
                  className="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300"
                >
                  <Brain className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Interactive Quizzes</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/courses" 
                  className="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300"
                >
                  <BookOpen className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Course Management</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/ai-assist" 
                  className="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-300"
                >
                  <Bot className="w-4 h-4 mr-2 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>AI Assistant</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="https://github.com/chaman2003" 
                  className="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <BookOpen className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Documentation</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="https://github.com/chaman2003" 
                  className="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>Support</span>
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/chaman2003" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  <Github className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                  <span>GitHub</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Connect With Us</h3>
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            {/* Grid layout - 2x2 for all screens */}
            <div className="grid grid-cols-2 gap-3">
              {/* LinkedIn */}
              <a 
                href="https://www.linkedin.com/in/chaman2003/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800/70 dark:hover:to-gray-800/60 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <Linkedin className="flex-shrink-0 w-5 h-5 text-[#0A66C2] group-hover:scale-110 transition-transform duration-300" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">LinkedIn</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">@chaman2003</span>
                </div>
              </a>
              
              {/* GitHub */}
              <a 
                href="https://github.com/chaman2003" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800/70 dark:hover:to-gray-800/60 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <Github className="flex-shrink-0 w-5 h-5 text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">GitHub</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">@chaman2003</span>
                </div>
              </a>

              {/* Twitter */}
              <a 
                href="https://x.com/2003_chaman" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800/70 dark:hover:to-gray-800/60 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <Twitter className="flex-shrink-0 w-5 h-5 text-[#1DA1F2] group-hover:scale-110 transition-transform duration-300" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">Twitter</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">@2003_chaman</span>
                </div>
              </a>
              
              {/* Gmail */}
              <a 
                href="mailto:chamans7952@gmail.com" 
                className="group flex items-center space-x-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800/70 dark:hover:to-gray-800/60 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="flex-shrink-0 w-5 h-5 text-[#EA4335] group-hover:scale-110 transition-transform duration-300" 
                  fill="currentColor"
                >
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">Gmail</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">chamans7952</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative pt-6 mt-6 border-t border-gray-200/30 dark:border-gray-700/30">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <a 
                href="https://x.com/2003_chaman" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://github.com/chaman2003" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="https://www.linkedin.com/in/chaman2003/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="mailto:chamans7952@gmail.com" 
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-4 h-4" 
                  fill="currentColor"
                >
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
              </a>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-xs text-center flex items-center">
              Made with <Heart className="w-3 h-3 mx-1 text-rose-500" /> by Chammy
            </p>

            <button
              onClick={scrollToTop}
              className="p-1.5 bg-white/80 dark:bg-gray-800/80 text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 backdrop-blur-sm"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
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
