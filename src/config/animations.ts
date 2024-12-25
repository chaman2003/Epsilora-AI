// Global animation duration for consistent timing across the app
export const PAGE_TRANSITION_DURATION = 2.5;

// Page transition animation configuration
export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: PAGE_TRANSITION_DURATION }
};

// Navbar animation configuration
export const navbarTransition = {
  staggerChildren: 0.1,
  type: "spring",
  stiffness: 260,
  damping: 20
} as const;

// Theme transition duration in milliseconds
export const THEME_TRANSITION_DURATION = 2500;

// Common animation presets
export const commonAnimations = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: PAGE_TRANSITION_DURATION }
  }
} as const;
