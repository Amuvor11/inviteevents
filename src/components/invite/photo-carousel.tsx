"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { imageFitClass, inlineAlignStyle, objectPositionToCss } from "@/lib/invite/block-style-utils";
import type { BlockStyle } from "@/types/design";

interface PhotoCarouselProps {
  images: { id: string; url: string; altText: string | null }[];
  className?: string;
  height?: number;
  width?: number;
  borderRadius?: number;
  objectFit?: BlockStyle["objectFit"];
  objectPosition?: BlockStyle["objectPosition"];
  align?: BlockStyle["textAlign"];
  rotation?: number;
}

export function PhotoCarousel({
  images,
  className = "",
  height = 320,
  width = 100,
  borderRadius = 24,
  objectFit,
  objectPosition,
  align,
  rotation,
}: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className={`relative ${className}`} style={inlineAlignStyle(align)}>
      <div
        className="relative overflow-hidden shadow-2xl"
        style={{
          width: `${width}%`,
          height,
          borderRadius,
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={images[index].id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="relative h-full w-full"
          >
            <Image
              src={images[index].url}
              alt={images[index].altText ?? ""}
              fill
              className={imageFitClass(objectFit)}
              style={{ objectPosition: objectPositionToCss(objectPosition) }}
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Попереднє фото"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Наступне фото"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <div className="mt-4 flex justify-center gap-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
                aria-label={`Перейти до фото ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
