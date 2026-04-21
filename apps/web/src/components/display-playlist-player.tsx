"use client";

import { useEffect, useMemo, useState } from "react";

type PlaylistSlide = {
  durationSeconds: number;
  src: string;
  title: string;
};

export function DisplayPlaylistPlayer({
  className = "",
  slides,
}: {
  className?: string;
  slides: PlaylistSlide[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const normalizedSlides = useMemo(() => slides.filter((slide) => slide.src), [slides]);

  useEffect(() => {
    if (normalizedSlides.length <= 1) {
      return;
    }

    const activeSlide = normalizedSlides[activeIndex] ?? normalizedSlides[0];

    if (!activeSlide) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % normalizedSlides.length);
    }, activeSlide.durationSeconds * 1000);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, normalizedSlides]);

  if (normalizedSlides.length === 0) {
    return (
      <div
        className={`flex h-full min-h-[280px] items-center justify-center rounded-xl border border-dashed border-rim bg-white/60 px-6 text-center text-[13px] text-muted ${className}`.trim()}
      >
        Add at least one saved view preset to this playlist.
      </div>
    );
  }

  return (
    <div className={`relative h-full min-h-[280px] w-full overflow-hidden rounded-[22px] bg-black ${className}`.trim()}>
      {normalizedSlides.map((slide, index) => (
        <iframe
          aria-hidden={index !== activeIndex}
          className="absolute inset-0 h-full w-full border-0 transition-opacity duration-700"
          key={`${slide.src}-${index}`}
          loading={index === 0 ? "eager" : "lazy"}
          src={slide.src}
          style={{
            opacity: index === activeIndex ? 1 : 0,
            pointerEvents: index === activeIndex ? "auto" : "none",
          }}
          title={slide.title}
        />
      ))}

      {normalizedSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-3 py-1.5">
          {normalizedSlides.map((slide, index) => (
            <div
              aria-label={slide.title}
              className="h-1.5 rounded-full transition-all duration-300"
              key={`${slide.title}-${index}`}
              style={{
                background: index === activeIndex ? "white" : "rgba(255,255,255,0.35)",
                width: index === activeIndex ? 20 : 8,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
