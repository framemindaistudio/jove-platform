"use client";

import { useEffect } from "react";
import { useInView, useMediaQuery } from "./hooks";

/**
 * Muted, looping, silent background video that only plays while on screen
 * (and never autoplays for reduced-motion users — they get the poster frame).
 */
export function LazyVideo({
  src,
  srcSm,
  poster,
  className,
  label,
  rootMargin = "150px 0px",
  onPlaying,
}: {
  src: string;
  /** smaller encode served below 1024px */
  srcSm?: string;
  poster: string;
  className?: string;
  /** accessible description; omit for purely decorative footage */
  label?: string;
  rootMargin?: string;
  /** fires once frames are actually being shown (e.g. to fade out a still underneath) */
  onPlaying?: () => void;
}) {
  const [ref, inView] = useInView<HTMLVideoElement>(rootMargin);
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (inView && !reduce) {
      v.muted = true;
      v.play().catch(() => {
        /* autoplay refused — the poster stays visible */
      });
    } else {
      v.pause();
    }
  }, [inView, reduce, ref]);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      onPlaying={onPlaying}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      disablePictureInPicture
      disableRemotePlayback
    >
      {srcSm && <source src={srcSm} type="video/mp4" media="(max-width: 1023px)" />}
      <source src={src} type="video/mp4" />
    </video>
  );
}
