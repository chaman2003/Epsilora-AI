import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { themeConfig } from '../../config/theme';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [clickAnimation, setClickAnimation] = useState<string | null>(null);

  const navigation = [
    { name: 'Progress', href: '/progress' },
    { name: 'Quiz', href: '/quiz' },
    { name: 'Courses', href: '/courses' },
    { name: 'AI Assist', href: '/ai-assist' },
  ];

  const handleNavClick = (href: string) => {
    setClickedItem(href);
    setClickAnimation(href);
    setTimeout(() => setClickAnimation(null), 300);
    
    // Force reload on quiz page navigation
    if (href === '/quiz') {
      window.location.href = href;
    } else {
      navigate(href);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-br from-slate-50/90 to-white/90 dark:from-slate-900/90 dark:to-gray-800/90 border-b border-gray-200/30 dark:border-gray-700/30 shadow-lg dark:shadow-gray-900/30 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center group transform hover:scale-105 transition-transform duration-300">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Epsilora
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user && navigation.map((item) => (
              <motion.div
                key={item.href}
                whileTap={{ scale: 0.97 }}
                animate={{
                  scale: clickAnimation === item.href ? [1, 0.97, 1] : 1
                }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group ${
                    location.pathname === item.href
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {item.name}
                  {/* Active indicator line */}
                  {location.pathname === item.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {/* Hover effect */}
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-50/0 to-purple-50/0 dark:from-indigo-900/0 dark:to-purple-900/0 group-hover:from-indigo-50/50 group-hover:to-purple-50/50 dark:group-hover:from-indigo-900/20 dark:group-hover:to-purple-900/20 transition-all duration-300" />
                </Link>
              </motion.div>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors duration-300"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-600 hover:to-purple-600 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-600 hover:to-purple-600 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors duration-300 mr-2"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors duration-300"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-md"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {user && navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => {
                    handleNavClick(item.href);
                    setIsOpen(false);
                  }}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    location.pathname === item.href
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-600 hover:to-purple-600 rounded-lg transition-all duration-300"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-600 hover:to-purple-600 rounded-lg transition-all duration-300"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;