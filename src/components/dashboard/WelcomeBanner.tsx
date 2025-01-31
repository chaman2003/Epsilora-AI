import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types';

interface WelcomeBannerProps {
  user: User;
  achievements: number;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ user, achievements }) => {
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-lg p-8 shadow-lg mb-8 border border-gray-700/50"
    >
      {/* Animated background effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 animate-pulse" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <p className="text-sm text-gray-400 uppercase tracking-wider">
                Security Status: Active
              </p>
            </div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">
                Good {getTimeOfDay()}, {user.name}
              </span>
            </h1>
            <p className="text-gray-400 max-w-xl">
              You've earned{' '}
              <span className="text-cyan-400 font-semibold">{achievements}</span>{' '}
              achievements in your cybersecurity journey. Keep strengthening your defenses!
            </p>
          </div>

          {/* Decorative cyber shield icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="hidden md:flex items-center justify-center w-16 h-16 rounded-lg bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm"
          >
            <svg
              className="w-8 h-8 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </motion.div>
        </div>

        {/* Security metrics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Security Level', value: 'Advanced', color: 'text-green-400' },
            { label: 'Active Streak', value: '12 Days', color: 'text-blue-400' },
            { label: 'Total Score', value: '2,450', color: 'text-purple-400' },
            { label: 'Rank', value: 'Cyber Guardian', color: 'text-cyan-400' },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50"
            >
              <p className="text-sm text-gray-400">{metric.label}</p>
              <p className={`text-lg font-semibold ${metric.color}`}>
                {metric.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-100" />
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse delay-200" />
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeBanner;
