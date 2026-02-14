'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type TeslaButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

export default function TeslaButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}: TeslaButtonProps) {
  const variants = {
    primary: 'bg-electric-blue hover:bg-[#0060d3] text-white shadow-lg shadow-electric-blue/20',
    secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    ghost: 'bg-transparent hover:bg-white/5 text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
