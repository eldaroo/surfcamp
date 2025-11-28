'use client';

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

// Dynamically import framer-motion components to prevent SSR issues
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded" />
  }
);

interface MotionWrapperProps {
  children: ReactNode;
  className?: string;
  initial?: any;
  animate?: any;
  transition?: any;
  whileHover?: any;
}

export default function MotionWrapper({
  children,
  className = '',
  initial,
  animate,
  transition,
  whileHover,
  ...props
}: MotionWrapperProps) {
  return (
    <MotionDiv
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
      whileHover={whileHover}
      {...props}
    >
      {children}
    </MotionDiv>
  );
}
