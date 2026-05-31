"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const hasMultiple = total > 1;

  useEffect(() => {
    if (!hasMultiple) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setIndex((i) => (i - 1 + total) % total);
      } else if (e.key === "ArrowRight") {
        setIndex((i) => (i + 1) % total);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasMultiple, total]);

  if (total === 0) {
    return (
      <div className="aspect-square overflow-hidden rounded-3xl bg-sand" />
    );
  }

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }
  function next() {
    setIndex((i) => (i + 1) % total);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="group relative overflow-hidden rounded-3xl bg-sand">
        <div className="aspect-square">
          <Image
            key={images[index]}
            src={images[index]}
            alt={`${alt} — image ${index + 1} of ${total}`}
            width={1000}
            height={1000}
            className="h-full w-full object-cover animate-in fade-in duration-200"
            priority={index === 0}
          />
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-ink shadow-md backdrop-blur transition-all hover:bg-cream hover:scale-105 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-ink shadow-md backdrop-blur transition-all hover:bg-cream hover:scale-105 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-cream backdrop-blur md:hidden">
              {index + 1} / {total}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-pressed={i === index}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sand ring-2 ring-transparent transition-all hover:opacity-90",
                i === index
                  ? "ring-sage-deep"
                  : "ring-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={src}
                alt=""
                width={120}
                height={120}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
