'use client';

import { motion, type Variants } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  animated?: boolean;
}

export function Logo({ size = 'md', showTagline = true, animated = true }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-2xl', tagline: 'text-xs' },
    md: { icon: 48, text: 'text-4xl', tagline: 'text-sm' },
    lg: { icon: 64, text: 'text-5xl', tagline: 'text-base' },
  };

  const currentSize = sizes[size];

  const iconVariants: Variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
  };

  const textVariants: Variants = {
    initial: { y: 10, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' }
    },
  };

  const Icon = animated ? motion.div : 'div';
  const Text = animated ? motion.div : 'div';

  return (
    <div className="flex flex-col items-center gap-3">
      <Icon
        className="flex items-center gap-3"
        variants={animated ? iconVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
      >
        {/* ARVO Icon - Minimalist geometric design */}
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {/* Outer circle */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary-500"
            opacity="0.2"
          />

          {/* Middle circle with rotation indicator */}
          <circle
            cx="24"
            cy="24"
            r="16"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary-500"
            opacity="0.4"
          />

          {/* Inner circle - solid */}
          <circle
            cx="24"
            cy="24"
            r="10"
            fill="currentColor"
            className="text-primary-500"
          />

          {/* Optimization arrows - subtle detail */}
          <path
            d="M24 8 L26 12 L22 12 Z"
            fill="currentColor"
            className="text-primary-500"
            opacity="0.6"
          />
          <path
            d="M40 24 L36 26 L36 22 Z"
            fill="currentColor"
            className="text-primary-500"
            opacity="0.6"
          />
        </svg>

        {/* App Name */}
        <div className="flex flex-col items-start">
          <h1 className={`${currentSize.text} font-bold tracking-tight text-foreground`}>
            ARVO
          </h1>
        </div>
      </Icon>

      <Text
        className="flex flex-col items-center gap-1"
        variants={animated ? textVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
      >
        {/* Subtitle */}
        <p className={`${currentSize.tagline} font-medium text-muted-foreground tracking-wide`}>
          AI Routine, Very Optimized
        </p>

        {/* Tagline */}
        {showTagline && (
          <p className="text-xs text-muted-foreground/70 mt-1">
            Your AI-powered training companion
          </p>
        )}
      </Text>
    </div>
  );
}
