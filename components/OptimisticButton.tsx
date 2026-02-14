'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { haptics } from '@/lib/haptics';

type OptimisticButtonProps = {
  onClick: () => Promise<void>;
  successMessage: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'danger' | 'success';
};

export default function OptimisticButton({
  onClick,
  successMessage,
  children,
  className = '',
  variant = 'primary',
}: OptimisticButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleClick = async () => {
    setStatus('loading');
    haptics.medium();

    try {
      // Show success optimistically
      setTimeout(() => {
        setStatus('success');
        haptics.success();
      }, 300);

      // Execute actual action in background
      await onClick();

      // Keep success state for a moment
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (error) {
      setStatus('error');
      haptics.error();
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-electric-blue to-electric-cyan text-black',
    danger: 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
    success: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
  };

  const statusStyles = {
    idle: variantStyles[variant],
    loading: 'bg-zinc-700 text-zinc-400',
    success: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
    error: 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      disabled={status === 'loading' || status === 'success'}
      className={`px-6 py-3 rounded-xl font-semibold transition-all disabled:cursor-not-allowed relative overflow-hidden ${statusStyles[status]} ${className}`}
    >
      {/* Loading Spinner */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          <div className="loading-spinner w-5 h-5" />
        </div>
      )}

      {/* Success Checkmark */}
      {status === 'success' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}

      {/* Error Icon */}
      {status === 'error' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.div>
      )}

      {/* Button Text */}
      <span className={status !== 'idle' ? 'opacity-0' : ''}>
        {status === 'success' ? successMessage : children}
      </span>
    </motion.button>
  );
}
