import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart2, Brain, BookOpen, Bot, ArrowRight, Sparkles } from 'lucide-react';
import { themeConfig } from '../config/theme';

// Predefine animation variants to improve performance
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const features = [
  {
    name: 'Progress Tracking',
    description: 'Track your learning journey with interactive charts and detailed analytics. Monitor course completion, milestones, and performance metrics.',
    icon: BarChart2,
    color: 'indigo',
    link: '/progress'
  },
  {
    name: 'Interactive Quizzes',
    description: 'Test your knowledge with AI-powered quizzes. Get instant feedback, detailed explanations, and personalized recommendations.',
    icon: Brain,
    color: 'purple',
    link: '/quiz'
  },
  {
    name: 'Course Management',
    description: 'Access and manage your courses efficiently. Set learning goals, track deadlines, and organize your study materials.',
    icon: BookOpen,
    color: 'teal',
    link: '/courses'
  },
  {
    name: 'AI Learning Assistant',
    description: 'Get personalized help from our AI assistant. Ask questions, get explanations, and receive tailored learning recommendations.',
    icon: Bot,
    color: 'rose',
    link: '/ai-assist'
  }
];

// Optimized gradient animation with fewer keyframes and longer duration
const gradientAnimation = {
  animate: {
    background: [
      "linear-gradient(90deg, rgb(99, 102, 241) 0%, rgb(139, 92, 246) 50%, rgb(217, 70, 239) 100%)",
      "linear-gradient(90deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 50%, rgb(236, 72, 153) 100%)"
    ],
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },
  transition: {
    duration: 10,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "linear"
  }
};

const Home: React.FC = () => {
  // Prevent scroll restoration on navigation
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Reset scroll position when component mounts
    window.scrollTo(0, 0);
    
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={`min-h-screen bg-gradient-to-b from-${themeConfig.colors.background.page.light} via-white to-${themeConfig.colors.background.page.light} dark:from-${themeConfig.colors.background.page.dark} dark:via-gray-900 dark:to-${themeConfig.colors.background.page.dark} overflow-x-hidden`}
    >
      {/* Hero Section */}
      <div className="relative isolate">
        {/* Background Effects - reduced blur for better performance */}
        <div className="absolute inset-x-0 top-40 -z-10 transform-gpu overflow-hidden blur-2xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-200 to-purple-200 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
        </div>

        <div className="w-full px-4 sm:px-6 pt-9 pb-12">
          <div className="text-center">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 1, delay: 0.2 }}
              className="flex items-center justify-center space-x-2 mb-3"
            >
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold leading-6 text-indigo-600 dark:text-indigo-400">
                Revolutionizing Learning
              </span>
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </motion.div>

            {/* Enhanced heading with optimized glow effect */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ duration: 1, delay: 0.3 }}
              className="relative mb-5"
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-2xl"></div>
              
              {/* Optimized glow effect with reduced animation complexity */}
              <motion.h1 
                className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400 pb-2"
                animate={gradientAnimation.animate}
                transition={gradientAnimation.transition}
              >
                ✨ Welcome to Epsilora ✨
              </motion.h1>
              
              {/* Reduced number of decorative elements */}
              <div className="absolute -inset-x-10 sm:-inset-x-20 -inset-y-10 -z-10">
                <div className="absolute left-1/2 top-1/2 w-32 sm:w-40 h-32 sm:h-40 rounded-full bg-indigo-500/10 blur-2xl animate-pulse" style={{ animationDuration: "3s" }}></div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 1, delay: 0.4 }}
              className="flex flex-col items-center space-y-4 sm:space-y-6 mb-6 sm:mb-8"
            >
              <div className="flex flex-wrap items-center justify-center gap-3 sm:space-x-4">
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-indigo-500/20 dark:from-indigo-400/20 dark:to-indigo-400/30">
                  <span className="text-base sm:text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-300 dark:to-indigo-500">ε Epsilon</span>
                </div>
                <span className="text-gray-400 hidden sm:inline">✦</span>
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-purple-500/20 dark:from-purple-400/20 dark:to-purple-400/30">
                  <span className="text-base sm:text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-300 dark:to-purple-500">Aura ✧</span>
                </div>
              </div>
              <p className="text-base sm:text-lg text-center text-gray-600 dark:text-gray-300 px-2 sm:px-4 max-w-2xl">
                Where precision meets intelligence. Empowering your learning journey with AI-driven insights and adaptive growth.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 1, delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-7xl mx-auto mb-8 sm:mb-12 px-2 sm:px-4"
            >
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-indigo-50/30 to-transparent dark:from-indigo-950/30 dark:via-indigo-950/20 dark:to-transparent border border-indigo-100/20 dark:border-indigo-800/20 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3">
                    <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">ε</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-600">Epsilon</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">The symbol of precision and continuous improvement. Like the mathematical epsilon that represents small, significant changes, we help you make incremental steps toward mastery.</p>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-50/50 via-purple-50/30 to-transparent dark:from-purple-950/30 dark:via-purple-950/20 dark:to-transparent border border-purple-100/20 dark:border-purple-800/20 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600">Aura</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">The intelligent field that surrounds and guides you. Our AI creates a supportive learning environment that adapts to your unique journey and goals.</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 1, delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto text-center px-2 sm:px-4"
            >
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-indigo-50 to-transparent dark:from-indigo-950/30 dark:to-transparent transform hover:scale-105 transition-transform duration-300">
                <div className="mb-2">
                  <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 mx-auto text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Track your progress</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-purple-50 to-transparent dark:from-purple-950/30 dark:to-transparent transform hover:scale-105 transition-transform duration-300">
                <div className="mb-2">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 mx-auto text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Test your knowledge</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-pink-50 to-transparent dark:from-pink-950/30 dark:to-transparent transform hover:scale-105 transition-transform duration-300">
                <div className="mb-2">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 mx-auto text-pink-600 dark:text-pink-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Get AI assistance</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Effects - reduced blur */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-2xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-purple-200 to-indigo-200 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-8 sm:py-12 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:from-transparent dark:via-gray-900/30 dark:to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.7 }}
            className="text-center mb-10 sm:mb-14 relative"
          >
            {/* Reduced decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 blur-2xl -z-10" />
            
            {/* Optimized sparkle animation */}
            <motion.div
              animate={{ 
                rotate: [0, 5, 0, -5, 0],
                scale: [1, 1.05, 1] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 6,
                ease: "easeInOut" 
              }}
              className="inline-block mb-2"
            >
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-indigo-600/80 dark:text-indigo-400/80" />
            </motion.div>
            
            <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 inline-block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
              Elevate Your Learning Experience
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50 rounded-full"></span>
            </h2>
            
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-2">
              Unlock your <span className="text-indigo-600 dark:text-indigo-400 font-medium">full potential</span> with our powerful features designed to enhance your <span className="text-purple-600 dark:text-purple-400 font-medium">educational journey</span>.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-${feature.color}-500/20 to-${feature.color}-500/5 dark:from-${feature.color}-500/10 dark:to-${feature.color}-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
                <Link 
                  to={feature.link}
                  className="block relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full border border-gray-100 dark:border-gray-700"
                >
                  {/* Feature Icon with Colored Background Circle */}
                  <div className={`absolute -right-4 sm:-right-6 -top-4 sm:-top-6 w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-${feature.color}-500/10 dark:bg-${feature.color}-500/20 group-hover:scale-110 transition-transform duration-500`} />
                  
                  {/* Feature Content */}
                  <div className="p-4 sm:p-6 relative z-10">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-500`}>
                      <feature.icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${feature.color}-600 dark:text-${feature.color}-400`} aria-hidden="true" />
                    </div>
                    
                    <h3 className={`text-lg sm:text-xl font-bold text-${feature.color}-600 dark:text-${feature.color}-400 mb-2 sm:mb-3 group-hover:translate-x-1 transition-transform duration-300`}>
                      {feature.name}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <div className={`mt-3 sm:mt-4 inline-flex items-center text-${feature.color}-600 dark:text-${feature.color}-400 text-xs sm:text-sm font-medium`}>
                      <span className="mr-2 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                        Explore
                      </span>
                      <ArrowRight className={`h-3 w-3 sm:h-4 sm:w-4 transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300`} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
