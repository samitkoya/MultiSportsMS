import { useState } from "react";
import { cn } from "@/lib/utils";

interface TeamAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function TeamAvatar({ src, alt, className }: TeamAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <svg
        viewBox="0 0 100 120"
        role="img"
        aria-label={alt}
        className={cn("h-[60px] w-[48px]", className)}
      >
        
        {/* Shield base */}
        <path
          d="M50 5 L90 20 V55 C90 80 70 100 50 110 C30 100 10 80 10 55 V20 Z"
          fill="#676c73"
        />
      </svg>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-12 w-12 bg-transparent rounded-md object-contain", className)}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}