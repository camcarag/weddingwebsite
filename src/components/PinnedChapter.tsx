"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type Tone = "warm" | "dusk" | "blush";
type Align = "left" | "right" | "center";

type PinnedChapterProps = {
  eyebrow: string;
  heading: string;
  body: string;
  mediaLabel: string;
  tone?: Tone;
  align?: Align;
};

const alignClasses: Record<Align, string> = {
  left: "items-start text-left",
  right: "items-end text-right",
  center: "items-center text-center",
};

/**
 * The core NYT-style beat: a photo/video pinned via `position: sticky`
 * while the reader scrolls through it, panning/zooming (Ken Burns) tied
 * to scroll progress, with the caption crossfading in over it.
 *
 * Swap the placeholder div for a real <img>/<video> — the same refs and
 * scroll-scrubbed transform will apply unchanged.
 */
export default function PinnedChapter({
  eyebrow,
  heading,
  body,
  mediaLabel,
  tone = "warm",
  align = "left",
}: PinnedChapterProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        mediaRef.current,
        { scale: 1.15, yPercent: -4 },
        {
          scale: 1,
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );

      gsap.fromTo(
        textRef.current,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            end: "top 25%",
            scrub: true,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[220vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div ref={mediaRef} className={`placeholder placeholder-${tone} absolute inset-0`}>
          <span className="placeholder-label">{mediaLabel}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />
        <div
          ref={textRef}
          className={`relative z-10 flex h-full flex-col justify-end p-8 text-white md:p-16 ${alignClasses[align]}`}
        >
          <div className="max-w-xl">
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/70">{eyebrow}</p>
            <h2 className="font-serif text-4xl leading-tight md:text-6xl">{heading}</h2>
            <p className="mt-4 max-w-md text-lg text-white/85">{body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
