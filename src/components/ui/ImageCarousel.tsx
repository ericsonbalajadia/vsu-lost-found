// src/components/ui/ImageCarousel.tsx
import { useState } from 'react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export default function ImageCarousel({ images, alt, className = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images.length) return null;

  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Main image */}
      <img
        src={images[currentIndex]}
        alt={`${alt} - image ${currentIndex + 1}`}
        className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-outline-variant/10"
      />

      {/* Always visible pagination dots (already fine) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-2.5 py-1.5 rounded-full bg-black/20 backdrop-blur-md z-20">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === currentIndex ? 'bg-white shadow-sm w-3' : 'bg-white/40'
            }`}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>

      {/* Current image counter (mobile friendly) */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation arrows – always visible on mobile (opacity lowered, but always there) */}
      <button
        onClick={goPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-on-surface shadow-md transition-all hover:bg-white z-20 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Previous image"
      >
        <span className="material-symbols-outlined text-xl">chevron_left</span>
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-on-surface shadow-md transition-all hover:bg-white z-20 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Next image"
      >
        <span className="material-symbols-outlined text-xl">chevron_right</span>
      </button>
    </div>
  );
}