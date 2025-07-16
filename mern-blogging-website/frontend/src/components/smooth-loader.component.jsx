import { motion } from 'framer-motion';
import { loadingSpinner } from '../common/animations';

const SmoothLoader = ({ 
  type = "spinner", 
  size = "medium", 
  color = "primary",
  text = "",
  className = ""
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8", 
    large: "w-12 h-12",
    xlarge: "w-16 h-16"
  };

  const colorClasses = {
    primary: "border-gray-300 border-t-black",
    secondary: "border-gray-300 border-t-yellow-500",
    white: "border-gray-200 border-t-white",
    dark: "border-gray-600 border-t-gray-900"
  };

  const textSizes = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
    xlarge: "text-lg"
  };

  // Pulse dots animation
  const pulseDots = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: { 
      scale: [0.8, 1.2, 0.8],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Wave animation
  const waveAnimation = {
    initial: { y: 0 },
    animate: { 
      y: [-10, 0, -10],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Skeleton loading animation
  const skeletonAnimation = {
    initial: { opacity: 0.3 },
    animate: { 
      opacity: [0.3, 0.7, 0.3],
      transition: {
        duration: 1.5,
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
            className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        );

      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`${sizeClasses[size]} bg-current rounded-full`}
                variants={pulseDots}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.2 }}
              />
            ))}
          </div>
        );

      case "wave":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                className={`w-1 ${sizeClasses[size]} bg-current rounded-full`}
                variants={waveAnimation}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </div>
        );

      case "skeleton":
        return (
          <motion.div
            className={`${sizeClasses[size]} bg-gray-300 rounded`}
            variants={skeletonAnimation}
            initial="initial"
            animate="animate"
          />
        );

      case "ring":
        return (
          <motion.div
            className={`${sizeClasses[size]} border-4 border-gray-200 border-t-current rounded-full`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        );

      case "bars":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((index) => (
              <motion.div
                key={index}
                className={`w-1 ${sizeClasses[size]} bg-current rounded`}
                variants={waveAnimation}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.15 }}
              />
            ))}
          </div>
        );

      default:
        return (
          <motion.div
            className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex items-center justify-center">
        {renderLoader()}
      </div>
      {text && (
        <motion.p
          className={`mt-2 text-gray-600 ${textSizes[size]} text-center`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default SmoothLoader; 