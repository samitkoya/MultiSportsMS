import { useState } from "react";
import { cn } from "@/lib/utils";

interface CoachAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

const PLACEHOLDER_SRC = "/placeholder.svg";

export function CoachAvatar({ src, alt, className }: CoachAvatarProps) {
  const [imageSrc, setImageSrc] = useState(src || PLACEHOLDER_SRC);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn("h-12 w-12 rounded-md bg-transparent object-cover", className)}
      onError={() => setImageSrc(PLACEHOLDER_SRC)}
    />
  );
}
