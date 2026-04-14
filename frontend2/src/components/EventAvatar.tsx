import { useState } from "react";
import { cn } from "@/lib/utils";

interface EventAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function EventAvatar({ src, alt, className }: EventAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <svg
        viewBox="0 0 100 100" // square viewBox
        role="img"
        aria-label={alt}
        className={cn("h-12 w-12", className)}
      >
        {<rect width="100" height="100" rx="15" fill="#262B35" />}
        {/* Cup (balanced height/width) */}
        <path
          d="M30 15 h40 v20 c0 18-12 30-20 34-8-4-20-16-20-34z"
          fill="#676c73"
        />

        {/* Handles */}
        <path
          d="M30 18 c-10 0-14 10-9 20s14 10 14 0"
          fill="none"
          stroke="#676c73"
          strokeWidth="4"
        />
        <path
          d="M70 18 c10 0 14 10 9 20s-14 10-14 0"
          fill="none"
          stroke="#676c73"
          strokeWidth="4"
        />

        {/* Stem */}
        <rect x="45" y="68" width="10" height="10" fill="#676c73" />

        {/* Base */}
        <rect x="35" y="78" width="30" height="8" rx="2" fill="#676c73" />
        <rect x="30" y="88" width="40" height="6" rx="2" fill="#676c73" />
      </svg>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-12 w-12 bg-transparent object-contain", className)}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}
