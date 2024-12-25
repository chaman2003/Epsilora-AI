import React from 'react';
import { motion } from 'framer-motion';

interface QuickAction {
  id: string;
  label: string;
  icon: JSX.Element;
  onClick: () => void;
  color: string;
}

interface QuickActionsProps {
  onStartQuiz: () => void;
  onCreateTask: () => void;
  onAddMilestone: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onStartQuiz,
  onCreateTask,
  onAddMilestone,
}) => {
  const actions: QuickAction[] = [
    {
      id: 'start-quiz',
      label: 'Start Quiz',
      color: 'from-cyan-500/20 to-cyan-500/10',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
          />
        </svg>
      ),
      onClick: onStartQuiz,
    },
    {
      id: 'create-task',
      label: 'Create Task',
      color: 'from-blue-500/20 to-blue-500/10',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      onClick: onCreateTask,
    },
    {
      id: 'add-milestone',
      label: 'Add Milestone',
      color: 'from-purple-500/20 to-purple-500/10',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
          />
        </svg>
      ),
      onClick: onAddMilestone,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg p-6 shadow-lg border border-gray-700/50"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-lg blur-xl" />

      {/* Header */}
      <div className="relative flex items-center space-x-2 mb-6">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">
          Quick Actions
        </h3>
      </div>

      {/* Actions Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            onClick={action.onClick}
            className={`
              relative group flex items-center space-x-3 p-4 rounded-lg
              bg-gradient-to-r ${action.color}
              border border-gray-700/50 backdrop-blur-sm
              hover:border-gray-600/50 hover:shadow-lg
              transition-all duration-300 ease-in-out
            `}
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Icon container */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800/50 text-gray-300 group-hover:text-white transition-colors duration-300">
              {action.icon}
            </div>

            {/* Label */}
            <span className="relative text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">
              {action.label}
            </span>

            {/* Decorative dots */}
            <div className="absolute top-2 right-2 flex space-x-1">
              <div className="w-1 h-1 rounded-full bg-current opacity-50" />
              <div className="w-1 h-1 rounded-full bg-current opacity-30" />
              <div className="w-1 h-1 rounded-full bg-current opacity-10" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActions;
