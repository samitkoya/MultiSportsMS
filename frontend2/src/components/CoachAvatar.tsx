import { useState } from "react";
import { cn } from "@/lib/utils";

interface CoachAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function CoachAvatar({ src, alt, className }: CoachAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={alt}
        className={cn("h-12 w-12", className)}
      >
        {<rect width="100" height="100" rx="15" fill="#262B35" />}

        {/* Head */}
        <circle cx="50" cy="38" r="18" fill="#676c73" />

        {/* Body */}
        <path
          d="M20 85c0-16 13-26 30-26s30 10 30 26"
          fill="#676c73"
        />
      </svg>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-12 w-12 bg-transparent rounded-md object-cover", className)}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}