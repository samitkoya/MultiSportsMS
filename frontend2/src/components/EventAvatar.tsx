import { useState } from "react";
import { cn } from "@/lib/utils";

interface EventAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

const PLACEHOLDER_SRC = "/placeholder.svg";

export function EventAvatar({ src, alt, className }: EventAvatarProps) {
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
