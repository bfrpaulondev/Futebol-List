// -.-.-.-
import React from 'react';
import { motion } from 'framer-motion';

// -.-.-.-
export const Card = ({ 
  children, 
  glow = false,
  className = '',
  animate = true,
  ...props 
}) => {
  const classes = ['card', glow && 'card-glow', className]
    .filter(Boolean)
    .join(' ');
  
  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  } : {};
  
  return (
    <Component className={classes} {...animationProps} {...props}>
      {children}
    </Component>
  );
};
