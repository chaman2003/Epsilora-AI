import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Lock, User, ArrowRight, Shield, BarChart2, Sparkles } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      toast.error('Name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      toast.error('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setError('');
      setLoading(true);
      await signup(name, email, password);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to create an account';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-full filter blur-3xl opacity-70 animate-blob-spin" style={{ animationDuration: '25s' }} />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full filter blur-3xl opacity-70 animate-blob" style={{ animationDuration: '15s' }} />
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full filter blur-3xl opacity-70 animate-blob" style={{ animationDuration: '20s' }} />
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen pt-10 pb-32 px-4 sm:px-6 lg:px-8">
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
            <div className="flex flex-col md:flex-row-reverse h-full">
              {/* Left side - Welcome section */}
              <div className="md:w-2/5 bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 text-white px-6 py-8 md:py-0 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full filter blur-xl transform translate-x-10 -translate-y-10" />
                  <div className="absolute left-0 bottom-0 w-32 h-32 bg-white/10 rounded-full filter blur-xl transform -translate-x-10 translate-y-10" />
                  <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80")' }} />
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-600/90 to-indigo-600/90 dark:from-purple-700/90 dark:to-indigo-800/90" />
                </div>
                
                <div className="relative">
                  <motion.h2 
                    variants={itemVariants}
                    className="text-3xl sm:text-4xl font-bold"
                  >
                    Join Us Today
                  </motion.h2>
                  <motion.p 
                    variants={itemVariants}
                    className="mt-4 text-white/80"
                  >
                    Create your account and start your learning journey with us. Track your progress, join courses, and achieve your goals.
                  </motion.p>
                  
                  <motion.div 
                    variants={itemVariants}
                    className="mt-12"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Shield size={18} />
                      </div>
                      <div>
                        <h3 className="font-medium">Secure Account</h3>
                        <p className="text-sm text-white/70">Your data is protected</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 mt-6">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <BarChart2 size={18} />
                      </div>
                      <div>
                        <h3 className="font-medium">Progress Tracking</h3>
                        <p className="text-sm text-white/70">Monitor your learning journey</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Right side - Form */}
              <div className="md:w-3/5 p-5 sm:p-6 md:p-7">
                <motion.div variants={itemVariants} className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center">
                    Create an Account
                    <Sparkles className="ml-2 w-5 h-5 text-yellow-400 animate-pulse" />
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Start your educational journey with Epsilora
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        ref={nameRef}
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError('');
                        }}
                        className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                          error && !name.trim() ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-300 ease-in-out`}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                          error && !email.trim() ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-300 ease-in-out`}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                          error && (!password || password.length < 6) ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-300 ease-in-out`}
                        placeholder="Create a password"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Password must be at least 6 characters long
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError('');
                        }}
                        className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                          error && password !== confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-300 ease-in-out`}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                        loading
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-indigo-500/20'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform hover:scale-[1.01] active:scale-[0.98]`}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Create Account
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
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline transition-colors"
                    >
                      Sign in instead
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

export default Signup;