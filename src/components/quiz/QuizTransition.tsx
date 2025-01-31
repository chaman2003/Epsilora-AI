import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const QuizTransition: React.FC<Props> = ({ onComplete }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-r from-blue-500 to-purple-600 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5 }}
        className="text-white text-4xl font-bold"
      >
        Get Ready!
      </motion.div>
    </motion.div>
  );
};

export default QuizTransition;
