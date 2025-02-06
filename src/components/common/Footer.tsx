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
  Star
} from 'lucide-react';
import { themeConfig } from '../../config/theme';

const Footer = () => {
  const [isNewsletterSubmitted, setIsNewsletterSubmitted] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsNewsletterSubmitted(true);
    // Add newsletter subscription logic here
  };

  return (
    <footer className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-24 -right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
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
            <div className="flex items-center space-x-1">
              <Star className="w-5 h-5 text-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                Trusted by 1000+ students
              </span>
            </div>
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

          {/* Newsletter Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stay Updated</h3>
            {!isNewsletterSubmitted ? (
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Subscribe to our newsletter for the latest updates and learning resources.
                </p>
                <div className="flex flex-col space-y-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Thanks for subscribing! Check your email for confirmation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative pt-8 mt-12 border-t border-gray-200 dark:border-gray-700">
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
                href="mailto:contact@epsilora.com" 
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transform hover:scale-110 transition-all duration-300"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center flex items-center">
              Made with <Heart className="w-4 h-4 mx-1 text-red-500" /> by Chaman
            </p>

            <button
              onClick={scrollToTop}
              className="p-2 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </footer>
  );
};

export default Footer;