import React, { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const controls = useAnimationControls();

  const transition = {
    duration: 0.2,
    ease: "easeInOut"
  };

  const variants = {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        ...transition,
        onComplete: () => {
          // Dispatch event when page animation completes
          window.dispatchEvent(new CustomEvent('pageAnimationComplete'));
        }
      }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: transition
    }
  };

  useEffect(() => {
    controls.start('animate');
  }, [location.pathname, controls]);

  return (
    <motion.div
      key={location.pathname}
      variants={variants}
      initial="initial"
      animate={controls}
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
