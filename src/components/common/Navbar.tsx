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
          <div className="flex items-center">
            <Link 
              to="/" 
              className={`text-xl font-bold text-primary-light dark:text-primary-dark theme-transition hover:shadow-md rounded-2xl px-4 py-2 bg-white/10 dark:bg-gray-800/10 hover:bg-white/20 dark:hover:bg-gray-800/20 ${
                clickedItem === '/' ? 'animate-nav-click shadow-lg' : ''
              }`}
              onClick={() => handleNavClick('/')}
            >
              Epsilora
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user && navigation.map((item) => (
              <motion.div
                key={item.href}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: clickAnimation === item.href ? [1, 0.95, 1] : 1,
                  rotate: clickAnimation === item.href ? [0, -2, 2, 0] : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  to={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium theme-transition hover:shadow-md bg-white/5 dark:bg-gray-800/5 hover:bg-white/20 dark:hover:bg-gray-800/20 relative overflow-hidden ${
                    location.pathname === item.href
                      ? 'text-primary-light dark:text-primary-dark shadow-lg bg-white/20 dark:bg-gray-800/20'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                  } ${clickAnimation === item.href ? 'animate-ripple' : ''} ${
                    item.href === '/ai-assist' ? 'pulse-glow' : ''
                  } nav-item-hover`}
                >
                  {item.name}
                  {clickAnimation === item.href && (
                    <motion.div
                      className="absolute inset-0 bg-primary-light/10 dark:bg-primary-dark/10 rounded-2xl"
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}

            {user && (
              <>
                <motion.button
                  onClick={handleThemeToggle}
                  whileTap={{ scale: 0.95 }}
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

                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark theme-transition px-4 py-2 rounded-2xl bg-white/10 dark:bg-gray-800/10">
                  {user.email}
                </span>

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
                  className={`block px-4 py-2 rounded-2xl text-base font-medium theme-transition hover:shadow-md bg-white/5 dark:bg-gray-800/5 hover:bg-white/20 dark:hover:bg-gray-800/20 ${
                    location.pathname === item.href
                      ? 'text-primary-light dark:text-primary-dark shadow-lg bg-white/20 dark:bg-gray-800/20'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                  } ${clickedItem === item.href ? 'animate-nav-click shadow-lg' : ''}`}
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