import { useState } from "react";
import { cn } from "@/lib/utils";

interface TeamAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

const PLACEHOLDER_SRC = "/placeholder.svg";

export function TeamAvatar({ src, alt, className }: TeamAvatarProps) {
  const [imageSrc, setImageSrc] = useState(src || PLACEHOLDER_SRC);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn("h-12 w-12 bg-transparent object-contain", className)}
      onError={() => setImageSrc(PLACEHOLDER_SRC)}
    />
  );
}
