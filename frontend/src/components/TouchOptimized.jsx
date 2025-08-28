import React from 'react';
import { motion } from 'framer-motion';

const TouchOptimized = ({ 
  children, 
  className = '', 
  tapScale = 0.98,
  hoverScale = 1.02,
  disabled = false,
  ...props 
}) => {
  const touchVariants = {
    rest: { 
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    hover: { 
      scale: hoverScale,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    tap: { 
      scale: tapScale,
      transition: { duration: 0.1, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      className={`touch-manipulation ${className}`}
      variants={touchVariants}
      initial="rest"
      whileHover={!disabled ? "hover" : "rest"}
      whileTap={!disabled ? "tap" : "rest"}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default TouchOptimized;
