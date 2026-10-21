"use client";

import Image, { type ImageLoader } from "next/image";

// Cloudinary resizes and converts formats itself (free tier), so we hand it
// the sizing instead of using Vercel's image optimiser quota.
const cloudinaryLoader: ImageLoader = ({ src, width, quality }) =>
  src.replace(
    "/image/upload/",
    `/image/upload/f_auto,q_${quality ?? "auto"},c_limit,w_${width}/`,
  );

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
  priority?: boolean;
};

/** An uploaded image: CDN-resized on Cloudinary, served as-is from local disk in dev. */
export function StoredImage({ src, alt, priority, ...props }: Props) {
  const isCloudinary = src.startsWith("https://res.cloudinary.com/");
  return (
    <Image
      src={src}
      alt={alt}
      loader={isCloudinary ? cloudinaryLoader : undefined}
      unoptimized={!isCloudinary}
      loading={priority ? "eager" : "lazy"}
      {...props}
    />
  );
}
