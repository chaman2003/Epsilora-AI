import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Lock, ArrowRight, BookOpen, Bot } from 'lucide-react';

const Login = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      toast.error('Email is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      toast.error('Password is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      toast.success('Successfully logged in!');
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to log in';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { ease: "easeOut", duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full filter blur-3xl opacity-70 animate-blob-spin" style={{ animationDuration: '25s' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-full filter blur-3xl opacity-70 animate-blob" style={{ animationDuration: '15s' }} />
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-full filter blur-3xl opacity-70 animate-blob" style={{ animationDuration: '20s' }} />
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 pb-28">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-5xl mx-auto"
        >
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm border border-white/20 dark:border-gray-700/20"
          >
            <div className="flex flex-col md:flex-row h-full">
              {/* Left side - Welcome section */}
              <div className="md:w-2/5 bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-800 text-white px-6 py-8 md:py-0 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full filter blur-xl transform translate-x-10 -translate-y-10" />
                  <div className="absolute left-0 bottom-0 w-32 h-32 bg-white/10 rounded-full filter blur-xl transform -translate-x-10 translate-y-10" />
                  <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80")' }} />
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/90 to-purple-600/90 dark:from-indigo-700/90 dark:to-purple-800/90" />
                </div>
                
                <div className="relative">
                  <motion.h2 
                    variants={itemVariants}
                    className="text-3xl sm:text-4xl font-bold"
                  >
                    Welcome Back
                  </motion.h2>
                  <motion.p 
                    variants={itemVariants}
                    className="mt-4 text-white/80"
                  >
                    Sign in to continue your learning journey and track your progress.
                  </motion.p>
                  
                  <motion.div 
                    variants={itemVariants}
                    className="mt-12"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <h3 className="font-medium">Interactive Learning</h3>
                        <p className="text-sm text-white/70">Engage with courses and quizzes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 mt-6">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot size={18} />
                      </div>
                      <div>
                        <h3 className="font-medium">AI Assistant</h3>
                        <p className="text-sm text-white/70">Get help from our AI tutor</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Right side - Form */}
              <div className="md:w-3/5 p-5 sm:p-6 md:p-7">
                <motion.div variants={itemVariants} className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Sign In
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Enter your credentials to access your account
                  </p>
                </motion.div>
                
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-hidden"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                
                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        ref={emailRef}
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                          error && !email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-300 ease-in-out`}
                        placeholder="Enter your email"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password
                      </label>
                      <div className="text-xs">
                        <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                          Forgot password?
                        </a>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                          error && !password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-300 ease-in-out`}
                        placeholder="Enter your password"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                        loading
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/20'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform hover:scale-[1.01] active:scale-[0.98]`}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Sign in
                          <span className="absolute right-3 inset-y-0 flex items-center">
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>

                <motion.div 
                  variants={itemVariants}
                  className="mt-4 text-center"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link
                      to="/signup"
                      className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline transition-colors"
                    >
                      Sign up now
                    </Link>
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;