import React from 'react';
import { motion } from 'framer-motion';
import { Milestone } from '../../types';
import { format } from 'date-fns';

interface MilestoneTrackerProps {
  milestones: Milestone[];
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ milestones }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        Upcoming Milestones
      </h3>
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 dark:text-white">
                {milestone.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                  milestone.priority
                )}`}
              >
                {milestone.priority}
              </span>
              {milestone.completed ? (
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
              )}
            </div>
          </motion.div>
        ))}
        {milestones.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No upcoming milestones
          </p>
        )}
      </div>
    </div>
  );
};

export default MilestoneTracker;
