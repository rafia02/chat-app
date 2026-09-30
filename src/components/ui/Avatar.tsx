"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  name: string;
  src?: string | null;
  className?: string;
  width?: number;
  height?: number;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export default function Avatar({
  name,
  src,
  className = "h-12 w-12 text-sm",
  width = 96,
  height = 96,
}: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src?.trim() || null;
  const showImage = imageSrc !== null && imageSrc !== failedSrc;

  return (
    <div
      role="img"
      aria-label={name || "User"}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 font-semibold text-white ${className}`}
    >
      {showImage ? (
        <Image
          src={imageSrc}
          alt=""
          width={width}
          height={height}
          unoptimized
          onError={() => setFailedSrc(imageSrc)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </div>
  );
}
