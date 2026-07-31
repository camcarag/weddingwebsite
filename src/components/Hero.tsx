"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax drift on the background as the hero scrolls out of view.
      // Replace .placeholder-night below with a real <video> or <img> and
      // this same scrub will still apply to it.
      gsap.to(bgRef.current, {
        yPercent: 20,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden">
      <div ref={bgRef} className="placeholder placeholder-night absolute inset-0">
        <span className="placeholder-label">
          hero-video.mp4 (or hero-photo.jpg) — drop into /public/story
        </span>
      </div>
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <p className="mb-6 text-sm uppercase tracking-[0.4em] text-white/70">Save the Date</p>
        <h1 className="font-serif text-5xl leading-none md:text-8xl">Cam &amp; Partner</h1>
        <p className="mt-6 text-xl text-white/85 md:text-2xl">Month DD, YYYY · City, State</p>
        <div className="absolute bottom-10 flex flex-col items-center gap-2 text-white/70">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <span className="block h-8 w-px animate-pulse bg-white/50" />
        </div>
      </div>
    </section>
  );
}
