import { motion } from 'framer-motion';
import { loadingSpinner } from '../common/animations';

const AnimatedLoader = ({ size = "medium", color = "primary" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  const colorClasses = {
    primary: "border-gray-300 border-t-black",
    secondary: "border-gray-300 border-t-yellow-500",
    white: "border-gray-200 border-t-white"
  };

  return (
    <div className="flex justify-center items-center">
      <motion.div
        className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

export default AnimatedLoader; 