import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const PageLoader = ({ 
  isLoading = false, 
  text = "Loading...",
  type = "fade",
  duration = 2000 
}) => {
  const [showLoader, setShowLoader] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
    } else {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 500); // Small delay for smooth exit
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const loaderVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        delay: 0.2
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const waveVariants = {
    animate: {
      y: [-10, 0, -10],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const renderLoader = () => {
    switch (type) {
      case "spinner":
        return (
          <motion.div
            className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full"
            variants={spinnerVariants}
            animate="animate"
          />
        );

      case "pulse":
        return (
          <motion.div
            className="w-16 h-16 bg-black rounded-full"
            variants={pulseVariants}
            animate="animate"
          />
        );

      case "wave":
        return (
          <div className="flex space-x-2">
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                className="w-3 h-12 bg-black rounded-full"
                variants={waveVariants}
                animate="animate"
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </div>
        );

      case "dots":
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-4 h-4 bg-black rounded-full"
                variants={pulseVariants}
                animate="animate"
                transition={{ delay: index * 0.2 }}
              />
            ))}
          </div>
        );

      case "ring":
        return (
          <motion.div
            className="w-16 h-16 border-4 border-black border-t-transparent rounded-full"
            variants={spinnerVariants}
            animate="animate"
          />
        );

      default:
        return (
          <motion.div
            className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full"
            variants={spinnerVariants}
            animate="animate"
          />
        );
    }
  };

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
          variants={loaderVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div
            className="flex flex-col items-center space-y-4"
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderLoader()}
            {text && (
              <motion.p
                className="text-gray-600 text-lg font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {text}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader; 