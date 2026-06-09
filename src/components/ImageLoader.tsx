import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export default function ImageLoader({ src, alt, className = "", containerClassName = "" }: ImageLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");

  useEffect(() => {
    // Basic image caching / pre-loading optimization
    // We can use a small, lightweight placeholder (a tiny Base64 or Unsplash fallback) to guarantee fast initial paints
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#FAF8F5] ${containerClassName}`}>
      {/* 1. Shimmering Skeleton Placeholder */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 shimmer-bg flex flex-col items-center justify-center text-[#A89B88]"
          >
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#8E806A] animate-pulse">
              微光載入中...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Optimistic Lazy Image Layer */}
      {currentSrc && (
        <motion.img
          src={currentSrc}
          alt={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`w-full h-full object-cover select-none ${className}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
