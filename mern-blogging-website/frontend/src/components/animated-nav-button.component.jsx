import { motion } from 'framer-motion';
import { buttonHover } from '../common/animations';

const AnimatedNavButton = ({ 
  direction = 'left', 
  onClick, 
  disabled = false, 
  size = 'medium',
  variant = 'primary',
  className = '',
  children 
}) => {
  const sizeClasses = {
    small: 'p-1.5',
    medium: 'p-2',
    large: 'p-3'
  };

  const variantClasses = {
    primary: 'bg-[#fad796] hover:bg-yellow-400 border-gray-200',
    secondary: 'bg-gray-100 hover:bg-gray-200 border-gray-300',
    dark: 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white'
  };

  const iconSize = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const defaultIcons = {
    left: (
      <svg className={iconSize[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    ),
    right: (
      <svg className={iconSize[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    )
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        rounded-full shadow-lg border 
        disabled:opacity-50 disabled:cursor-not-allowed 
        relative overflow-hidden
        ${className}
      `}
      variants={buttonHover}
      whileHover={disabled ? {} : "hover"}
      whileTap={disabled ? {} : "tap"}
      initial="initial"
      animate="animate"
      style={{
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      {/* Background gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Icon with subtle animation */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        whileHover={{ 
          scale: 1.1,
          transition: { duration: 0.2 }
        }}
      >
        {children || defaultIcons[direction]}
      </motion.div>

      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/30"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ 
          scale: 1.5, 
          opacity: [0, 1, 0],
          transition: { duration: 0.4 }
        }}
      />
    </motion.button>
  );
};

export default AnimatedNavButton; 