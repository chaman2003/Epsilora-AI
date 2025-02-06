import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

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
    <nav className="fixed top-0 left-0 right-0 bg-background-light/80 dark:bg-background-dark/80 border-b border-border-light/50 dark:border-border-dark/50 shadow-lg dark:shadow-gray-900/30 z-50 theme-transition backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center"
              >
                <span className="logo-text text-2xl">Epsilora</span>
              </motion.div>
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
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium theme-transition group ${
                    location.pathname === item.href
                      ? 'text-primary-light dark:text-primary-dark bg-gradient-to-r from-primary-light/10 to-primary-light/5 dark:from-primary-dark/20 dark:to-primary-dark/10 shadow-lg'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                  } ${clickAnimation === item.href ? 'animate-ripple' : ''} ${
                    item.href === '/ai-assist' ? 'pulse-glow' : ''
                  }`}
                >
                  {item.name}
                  {/* Active indicator line */}
                  {location.pathname === item.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-light to-primary-light/70 dark:from-primary-dark dark:to-primary-dark/70"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {/* Hover effect */}
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-light/0 to-primary-light/0 dark:from-primary-dark/0 dark:to-primary-dark/0 group-hover:from-primary-light/5 group-hover:to-primary-light/0 dark:group-hover:from-primary-dark/10 dark:group-hover:to-primary-dark/0 transition-all duration-300" />
                  {clickAnimation === item.href && (
                    <motion.div
                      className="absolute inset-0 bg-primary-light/10 dark:bg-primary-dark/10 rounded-lg"
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}

            {/* Theme Toggle Button - Always visible */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleThemeToggle}
              className="p-2.5 rounded-2xl text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark theme-transition hover:shadow-md bg-white/5 dark:bg-gray-800/5 hover:bg-white/20 dark:hover:bg-gray-800/20"
              aria-label="Toggle theme"
            >
              <motion.div
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </motion.button>

            {user && (
              <>
                <div className="flex items-center px-3 py-1.5 rounded-2xl bg-white/10 dark:bg-gray-800/10 border border-gray-200/10 dark:border-gray-700/10">
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark theme-transition truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>

                <motion.button
                  onClick={handleLogout}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-2xl text-sm font-medium text-error-light dark:text-error-dark hover:text-error-light/80 dark:hover:text-error-dark/80 theme-transition hover:shadow-md bg-red-50/50 dark:bg-red-900/20 hover:bg-red-50/80 dark:hover:bg-red-900/30"
                >
                  Logout
                </motion.button>
              </>
            )}

            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={() => handleNavClick('/login')}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark theme-transition hover:shadow-md bg-white/5 dark:bg-gray-800/5 hover:bg-white/20 dark:hover:bg-gray-800/20 ${
                    clickedItem === '/login' ? 'animate-nav-click shadow-lg' : ''
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => handleNavClick('/signup')}
                  className={`btn-primary rounded-2xl px-4 py-2 hover:shadow-lg bg-primary-light/90 dark:bg-primary-dark/90 hover:bg-primary-light dark:hover:bg-primary-dark ${clickedItem === '/signup' ? 'animate-nav-click shadow-lg' : ''}`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {/* Theme Toggle - Always visible on mobile */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleThemeToggle}
              className="p-2.5 rounded-2xl text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark focus:outline-none transition-colors duration-200 mr-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </motion.button>

            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center p-2.5 rounded-2xl text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark theme-transition hover:shadow-md bg-white/5 dark:bg-gray-800/5 hover:bg-white/20 dark:hover:bg-gray-800/20"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
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
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background-light/90 dark:bg-background-dark/90 border-b border-border-light/50 dark:border-border-dark/50 theme-transition shadow-lg dark:shadow-gray-900/30 rounded-b-3xl mx-2 backdrop-blur-md"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user && navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => {
                    handleNavClick(item.href);
                    setIsOpen(false);
                  }}
                  className={`block px-4 py-2 rounded-2xl text-base font-medium theme-transition ${
                    location.pathname === item.href
                      ? 'text-primary-light dark:text-primary-dark bg-gradient-to-r from-primary-light/10 to-primary-light/5 dark:from-primary-dark/20 dark:to-primary-dark/10 shadow-lg'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                  } ${clickAnimation === item.href ? 'animate-nav-click shadow-lg' : ''}`}
                >
                  {item.name}
                </Link>
              ))}

              {user && (
                <motion.button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="block w-full text-left px-4 py-2 rounded-2xl text-base font-medium text-error-light dark:text-error-dark hover:text-error-light/80 dark:hover:text-error-dark/80 theme-transition hover:shadow-md"
                >
                  Logout
                </motion.button>
              )}

              {!user && (
                <>
                  <Link
                    to="/login"
                    onClick={() => {
                      handleNavClick('/login');
                      setIsOpen(false);
                    }}
                    className={`block px-4 py-2 rounded-2xl text-base font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark theme-transition hover:shadow-md bg-white/5 dark:bg-gray-800/5 hover:bg-white/20 dark:hover:bg-gray-800/20 ${
                      clickedItem === '/login' ? 'animate-nav-click shadow-lg' : ''
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => {
                      handleNavClick('/signup');
                      setIsOpen(false);
                    }}
                    className={`block px-4 py-2 rounded-2xl text-base font-medium btn-primary hover:shadow-lg bg-primary-light/90 dark:bg-primary-dark/90 hover:bg-primary-light dark:hover:bg-primary-dark ${
                      clickedItem === '/signup' ? 'animate-nav-click shadow-lg' : ''
                    }`}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;