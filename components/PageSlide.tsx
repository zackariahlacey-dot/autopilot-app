'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type PageSlideProps = {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
};

export default function PageSlide({ children, direction = 'right' }: PageSlideProps) {
  const directions = {
    left: { x: -20, opacity: 0 },
    right: { x: 20, opacity: 0 },
    up: { y: -20, opacity: 0 },
    down: { y: 20, opacity: 0 },
  };

  return (
    <motion.div
      initial={directions[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={{ ...directions[direction] }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
