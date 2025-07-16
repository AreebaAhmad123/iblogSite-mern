import { motion } from 'framer-motion';

const ContentLoader = ({ 
  type = "grid", 
  count = 4, 
  className = "",
  animate = true 
}) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

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

  const renderGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="bg-white rounded-lg shadow-md p-4 h-[340px]"
        >
          {/* Image skeleton */}
          <motion.div 
            className="w-full h-32 bg-gray-200 rounded-md mb-3"
            variants={animate ? skeletonAnimation : {}}
            initial="initial"
            animate="animate"
          />
          {/* Title skeleton */}
          <motion.div 
            className="h-4 bg-gray-200 rounded mb-2"
            variants={animate ? skeletonAnimation : {}}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          />
          <motion.div 
            className="h-4 bg-gray-200 rounded mb-2 w-3/4"
            variants={animate ? skeletonAnimation : {}}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          />
          {/* Description skeleton */}
          <motion.div 
            className="h-3 bg-gray-200 rounded mb-1"
            variants={animate ? skeletonAnimation : {}}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          />
          <motion.div 
            className="h-3 bg-gray-200 rounded mb-3 w-5/6"
            variants={animate ? skeletonAnimation : {}}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
          />
          {/* Author section skeleton */}
          <div className="flex items-center mt-auto bg-gray-100 rounded-xl px-3 py-2">
            <motion.div 
              className="w-8 h-8 bg-gray-200 rounded-full"
              variants={animate ? skeletonAnimation : {}}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.5 }}
            />
            <div className="ml-2 flex-grow">
              <motion.div 
                className="h-3 bg-gray-200 rounded mb-1 w-20"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.6 }}
              />
              <motion.div 
                className="h-2 bg-gray-200 rounded w-16"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.7 }}
              />
            </div>
            <motion.div 
              className="w-5 h-5 bg-gray-200 rounded"
              variants={animate ? skeletonAnimation : {}}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.8 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="flex flex-col sm:flex-row bg-white rounded-xl shadow p-4 gap-4 items-center"
        >
          {/* Image skeleton */}
          <motion.div 
            className="w-full sm:w-32 h-40 sm:h-32 bg-gray-200 rounded-lg"
            variants={animate ? skeletonAnimation : {}}
            initial="initial"
            animate="animate"
          />
          <div className="flex-1 flex flex-col justify-between h-full w-full">
            <div>
              {/* Title skeleton */}
              <motion.div 
                className="h-5 bg-gray-200 rounded mb-2"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
              />
              <motion.div 
                className="h-5 bg-gray-200 rounded mb-2 w-3/4"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
              />
              {/* Description skeleton */}
              <motion.div 
                className="h-3 bg-gray-200 rounded mb-1"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.3 }}
              />
              <motion.div 
                className="h-3 bg-gray-200 rounded w-5/6"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.4 }}
              />
            </div>
            {/* Author section skeleton */}
            <div className="flex items-center justify-between mt-4 bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-8 h-8 bg-gray-200 rounded-full"
                  variants={animate ? skeletonAnimation : {}}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.5 }}
                />
                <div className="flex flex-col">
                  <motion.div 
                    className="h-3 bg-gray-200 rounded mb-1 w-16"
                    variants={animate ? skeletonAnimation : {}}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.6 }}
                  />
                  <motion.div 
                    className="h-2 bg-gray-200 rounded w-12"
                    variants={animate ? skeletonAnimation : {}}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.7 }}
                  />
                </div>
              </div>
              <motion.div 
                className="w-5 h-5 bg-gray-200 rounded"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.8 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderCarousel = () => (
    <div className="flex space-x-4 overflow-hidden">
      {Array.from({ length: count }, (_, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="w-1/4 flex-shrink-0"
        >
          <div className="bg-white rounded-lg shadow-md p-4 h-[340px]">
            {/* Image skeleton */}
            <motion.div 
              className="w-full h-32 bg-gray-200 rounded-md mb-3"
              variants={animate ? skeletonAnimation : {}}
              initial="initial"
              animate="animate"
            />
            {/* Title skeleton */}
            <motion.div 
              className="h-4 bg-gray-200 rounded mb-2"
              variants={animate ? skeletonAnimation : {}}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            />
            <motion.div 
              className="h-4 bg-gray-200 rounded mb-2 w-3/4"
              variants={animate ? skeletonAnimation : {}}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            />
            {/* Description skeleton */}
            <motion.div 
              className="h-3 bg-gray-200 rounded mb-1"
              variants={animate ? skeletonAnimation : {}}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            />
            <motion.div 
              className="h-3 bg-gray-200 rounded mb-3 w-5/6"
              variants={animate ? skeletonAnimation : {}}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
            />
            {/* Author section skeleton */}
            <div className="flex items-center mt-auto bg-gray-100 rounded-xl px-3 py-2">
              <motion.div 
                className="w-8 h-8 bg-gray-200 rounded-full"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.5 }}
              />
              <div className="ml-2 flex-grow">
                <motion.div 
                  className="h-3 bg-gray-200 rounded mb-1 w-20"
                  variants={animate ? skeletonAnimation : {}}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.6 }}
                />
                <motion.div 
                  className="h-2 bg-gray-200 rounded w-16"
                  variants={animate ? skeletonAnimation : {}}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.7 }}
                />
              </div>
              <motion.div 
                className="w-5 h-5 bg-gray-200 rounded"
                variants={animate ? skeletonAnimation : {}}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.8 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {type === "grid" && renderGrid()}
      {type === "list" && renderList()}
      {type === "carousel" && renderCarousel()}
    </motion.div>
  );
};

export default ContentLoader; 