"use client";

import { useEffect, useRef, useState } from "react";

const AUTOPLAY_MS = 4000;
const SWIPE_PX = 40;

// Centre-stage carousel: the active image is large in the middle, its neighbours sit
// smaller and faded behind it, and it loops endlessly.
export default function OfferCarousel({
  images,
  accentColor,
}: {
  images: string[];
  accentColor: string;
}) {
  const count = images.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);

  const go = (index: number) => setActive(((index % count) + count) % count);

  useEffect(() => {
    if (paused || count < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const timer = window.setTimeout(() => go(active + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  });

  if (!count) return null;

  // Signed distance from the active slide, wrapped so the strip loops both ways.
  const offsetOf = (index: number) => {
    let offset = (index - active + count) % count;
    if (offset > count / 2) offset -= count;
    return offset;
  };

  return (
    <div
      className="offer-carousel relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @keyframes offer-carousel-progress { from { width: 0% } to { width: 100% } }
      `}</style>

      <div
        className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl sm:aspect-[16/10] md:aspect-[16/8]"
        style={{
          background:
            "radial-gradient(ellipse at center, #ffffff 0%, #f1f5f9 70%, #e2e8f0 100%)",
        }}
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return;
          const moved = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (Math.abs(moved) > SWIPE_PX) go(active + (moved < 0 ? 1 : -1));
        }}
      >
        {images.map((src, index) => {
          const offset = count > 1 ? offsetOf(index) : 0;
          const distance = Math.abs(offset);
          const visible = distance <= 2;
          return (
            <button
              key={`${src}-${index}`}
              type="button"
              tabIndex={offset === 0 ? 0 : -1}
              aria-label={`Slide ${index + 1}`}
              onClick={() => offset !== 0 && go(index)}
              className="absolute left-1/2 top-1/2 aspect-square h-[82%] overflow-hidden rounded-2xl bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: `translate(calc(-50% + ${offset * 58}%), -50%) scale(${1 - distance * 0.16})`,
                opacity: visible ? 1 - distance * 0.35 : 0,
                zIndex: 10 - distance,
                filter: distance ? "saturate(0.85)" : "none",
                boxShadow:
                  offset === 0
                    ? "0 24px 48px -12px rgba(15,23,42,0.35), 0 0 0 1px rgba(15,23,42,0.06)"
                    : "0 10px 24px -10px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.05)",
                pointerEvents: visible ? "auto" : "none",
                cursor: offset === 0 ? "default" : "pointer",
              }}
            >
              <img
                src={src}
                alt={`Slide ${index + 1}`}
                draggable={false}
                className="h-full w-full object-contain p-2 md:p-3"
                loading={distance > 1 ? "lazy" : undefined}
              />
            </button>
          );
        })}

        {count > 1 ? (
          <>
            <ArrowButton side="left" onClick={() => go(active - 1)} />
            <ArrowButton side="right" onClick={() => go(active + 1)} />
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            {images.map((_, index) => {
              const current = index === active;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => go(index)}
                  aria-label={`Slide ${index + 1}`}
                  className="relative h-1.5 overflow-hidden rounded-full bg-slate-200 transition-all duration-300"
                  style={{ width: current ? 36 : 10 }}
                >
                  {current ? (
                    <span
                      key={`${active}-${paused}`}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        backgroundColor: accentColor,
                        width: paused ? "100%" : undefined,
                        animation: paused
                          ? undefined
                          : `offer-carousel-progress ${AUTOPLAY_MS}ms linear forwards`,
                      }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <span className="text-xs font-semibold tabular-nums text-slate-400">
            <span style={{ color: accentColor }}>
              {String(active + 1).padStart(2, "0")}
            </span>{" "}
            / {String(count).padStart(2, "0")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ArrowButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      className={`absolute top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:h-10 sm:w-10 md:h-12 md:w-12 ${side === "left" ? "left-1.5 sm:left-3 md:left-5" : "right-1.5 sm:right-3 md:right-5"}`}
    >
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path d={side === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  );
}
