import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const LoadingProgress = ({ 
  isLoading = false, 
  progress = 0,
  color = "black",
  height = "2px",
  className = ""
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setCurrentProgress(progress);
    } else {
      setCurrentProgress(100);
      const timer = setTimeout(() => {
        setCurrentProgress(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress]);

  const colorClasses = {
    black: "bg-black",
    green: "bg-green-600",
    yellow: "bg-yellow-500",
    red: "bg-red-600",
    purple: "bg-purple-600",
    gradient: "bg-gradient-to-r from-black via-purple-600 to-cyan-600"
  };

  const progressVariants = {
    initial: { scaleX: 0 },
    animate: { 
      scaleX: currentProgress / 100,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      scaleX: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={`fixed top-0 left-0 w-full z-[9999] ${className}`}
          style={{ height }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full h-full bg-gray-200">
            <motion.div
              className={`h-full ${colorClasses[color]}`}
              style={{ transformOrigin: 'left' }}
              variants={progressVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingProgress; 