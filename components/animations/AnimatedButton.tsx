'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type AnimatedButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

export default function AnimatedButton({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled,
  type = 'button',
}: AnimatedButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-electric-blue to-electric-cyan text-black hover:shadow-lg hover:shadow-electric-blue/50',
    secondary: 'bg-glass border border-glass-border hover:bg-glass-hover text-white',
    ghost: 'bg-transparent hover:bg-glass text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  );
}
