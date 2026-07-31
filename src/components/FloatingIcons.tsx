"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { gsap } from "@/lib/gsap";
import { floatingIcons, type FloatingIconData } from "@/data/floating-icons";

const heading = Bricolage_Grotesque({ subsets: ["latin"], weight: "800" });

// Deterministic PRNG (mulberry32) so scattered positions match between
// server and client render — Math.random() here would cause a hydration
// mismatch since this runs during SSR too.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Position = { top: number; left: number };

// Scatters icons across the full stage on a jittered grid, reserving the
// top-left cell (row 0, col 0) so nothing lands under the heading there.
function scatterPositions(count: number, seed = 42): Position[] {
  const rng = mulberry32(seed);
  const cols = 4;
  const rows = Math.ceil((count + 1) / cols);
  const cells = Array.from({ length: cols * rows }, (_, i) => i).filter((cell) => cell !== 0);
  // Fisher-Yates shuffle with the seeded RNG.
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const top0 = 8;
  const top1 = 94;
  const left0 = 8;
  const left1 = 92;
  const cellH = (top1 - top0) / rows;
  const cellW = (left1 - left0) / cols;

  return cells.slice(0, count).map((cell) => {
    const row = Math.floor(cell / cols);
    const col = cell % cols;
    const jitterY = (rng() - 0.5) * cellH * 0.6;
    const jitterX = (rng() - 0.5) * cellW * 0.6;
    return {
      top: top0 + row * cellH + cellH / 2 + jitterY,
      left: left0 + col * cellW + cellW / 2 + jitterX,
    };
  });
}

const sizeClasses = [
  "h-[4.5rem] w-[4.5rem] sm:h-[5.5rem] sm:w-[5.5rem]",
  "h-[5.5rem] w-[5.5rem] sm:h-[6.5rem] sm:w-[6.5rem]",
  "h-[6.5rem] w-[6.5rem] sm:h-[7.5rem] sm:w-[7.5rem]",
  "h-[7.5rem] w-[7.5rem] sm:h-[8.5rem] sm:w-[8.5rem]",
];

function IconGlyph({ file, alt }: { file: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    // The <img> is present in the server-rendered HTML, so the browser can
    // start (and, for a fast local 404, finish) the request before this
    // effect attaches a listener — check the already-settled state first.
    if (el.complete && el.naturalWidth === 0) {
      setBroken(true);
      return;
    }
    const handleError = () => setBroken(true);
    el.addEventListener("error", handleError);
    return () => el.removeEventListener("error", handleError);
  }, []);

  if (broken) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-full border border-dashed border-neutral-400/60 bg-black/5 p-2 text-center">
        <span className="text-[0.6rem] uppercase tracking-wide text-neutral-500">
          {file}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={`/icons/${file}`}
      alt={alt}
      draggable={false}
      className="h-full w-full select-none object-contain drop-shadow-md"
    />
  );
}

function Tooltip({ icon, placement }: { icon: FloatingIconData; placement: { vertical: "above" | "below"; horizontal: "left" | "center" | "right" } }) {
  const vertical = placement.vertical === "below" ? "top-full mt-3" : "bottom-full mb-3";
  const horizontal =
    placement.horizontal === "left"
      ? "left-0"
      : placement.horizontal === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <div
      role="status"
      className={`absolute ${vertical} ${horizontal} z-20 w-56 rounded-2xl border border-neutral-900/10 bg-white p-4 text-center shadow-lg`}
    >
      <p className="mb-1 text-xs uppercase tracking-[0.2em] text-neutral-500">{icon.title}</p>
      <p className="text-sm leading-snug text-neutral-800">{icon.blurb}</p>
    </div>
  );
}

const CONFETTI_COLORS = ["#204C32", "#E8A33D", "#E0674B", "#3D8B7D", "#F2C9C2"];

function Confetti() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const particles = containerRef.current?.querySelectorAll<HTMLSpanElement>("[data-particle]");
    particles?.forEach((el) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 36 + Math.random() * 56;
      gsap.fromTo(
        el,
        { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
        {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance + 30,
          opacity: 0,
          scale: 0.6,
          rotation: (Math.random() - 0.5) * 360,
          duration: 0.6 + Math.random() * 0.3,
          delay: Math.random() * 0.1,
          ease: "power2.out",
        },
      );
    });
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute top-1/2 left-1/2 z-40 h-0 w-0">
      {CONFETTI_COLORS.flatMap((color, ci) =>
        Array.from({ length: 3 }).map((_, i) => (
          <span
            key={`${ci}-${i}`}
            data-particle
            className="absolute top-0 left-0 h-2 w-2 rounded-sm"
            style={{ backgroundColor: color }}
          />
        )),
      )}
    </div>
  );
}

function IconItem({
  icon,
  position,
  isActive,
  onActivate,
  onDeactivate,
  reduceMotion,
}: {
  icon: FloatingIconData;
  position: Position;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  reduceMotion: boolean;
}) {
  const floatRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const revealingRef = useRef(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    if (reduceMotion || !floatRef.current) return;
    const driftX = 10 + Math.random() * 12;
    const driftY = 8 + Math.random() * 10;
    const rotation = 3 + Math.random() * 4;
    const duration = 3 + Math.random() * 3;

    const tween = gsap.to(floatRef.current, {
      x: `+=${driftX}`,
      y: `+=${driftY}`,
      rotation: Math.random() > 0.5 ? rotation : -rotation,
      duration,
      delay: Math.random() * 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    tweenRef.current = tween;

    return () => {
      tween.kill();
      tweenRef.current = null;
    };
  }, [reduceMotion]);

  // Freeze the drift while a user is hovering/focused so the icon doesn't
  // wander out from under the pointer and slam the tooltip shut mid-read.
  useEffect(() => {
    if (isActive) {
      tweenRef.current?.pause();
    } else {
      tweenRef.current?.play();
    }
  }, [isActive]);

  // For the special icon: shake + confetti first, then hand off to the real
  // reveal — a plain hover feels anticlimactic for the actual save-the-date.
  const triggerSpecialReveal = () => {
    if (revealingRef.current || isActive) return;
    revealingRef.current = true;
    setRevealing(true);
    tweenRef.current?.pause();

    const el = floatRef.current;
    const tl = gsap.timeline({
      onComplete: () => {
        revealingRef.current = false;
        setRevealing(false);
        onActivate();
      },
    });
    if (el) {
      tl.to(el, { x: "+=8", rotation: 5, duration: 0.05 })
        .to(el, { x: "-=16", rotation: -5, duration: 0.07 })
        .to(el, { x: "+=16", rotation: 5, duration: 0.07 })
        .to(el, { x: "-=16", rotation: -4, duration: 0.07 })
        .to(el, { x: "+=16", rotation: 3, duration: 0.07 })
        .to(el, { x: "-=8", rotation: 0, duration: 0.06 });
    } else {
      tl.to({}, { duration: 0.4 });
    }
  };

  const placement = {
    vertical: (position.top < 55 ? "below" : "above") as "above" | "below",
    horizontal: (position.left < 25 ? "left" : position.left > 75 ? "right" : "center") as "left" | "center" | "right",
  };

  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${isActive || revealing ? "z-30" : "z-0"}`}
      style={{ top: `${position.top}%`, left: `${position.left}%` }}
    >
      <div className="relative">
        <div ref={floatRef}>
          <button
            type="button"
            aria-label={icon.alt}
            aria-expanded={isActive}
            onMouseEnter={icon.special ? triggerSpecialReveal : onActivate}
            onMouseLeave={onDeactivate}
            onFocus={icon.special ? triggerSpecialReveal : onActivate}
            onBlur={onDeactivate}
            // Tapping on mobile synthesizes mouseover (which activates via
            // onActivate) immediately followed by click — wiring this to a
            // toggle would see it as "already active" and instantly close
            // it again. Always activating keeps a tap idempotent.
            onClick={icon.special ? triggerSpecialReveal : onActivate}
            className={`${sizeClasses[icon.size]} cursor-pointer rounded-full transition-transform duration-300 ease-out hover:scale-110 focus:scale-110 focus:outline-none`}
          >
            <IconGlyph file={icon.file} alt={icon.alt} />
          </button>
        </div>
        {isActive && !icon.special && <Tooltip icon={icon} placement={placement} />}
        {revealing && <Confetti />}
      </div>
    </div>
  );
}

const FLOWER_IMAGES = [
  "/flowers/FlowerRed.png",
  "/flowers/FlowerPink.png",
  "/flowers/leaf.png",
  "/flowers/whiteflower.png",
  "/flowers/FlowerYellow.png",
];

type FlowerSpec = {
  id: number;
  left: number;
  size: number;
  file: string;
  drift: number;
  duration: number;
  delay: number;
};

function FloatingFlowers() {
  // A useState lazy initializer runs exactly once per mount (unlike
  // useMemo, which React may re-invoke), so it's the sanctioned spot for
  // this one-time random layout — this component only ever mounts
  // client-side (in response to a hover/click), so there's no SSR pass to
  // mismatch against either.
  const [flowers] = useState<FlowerSpec[]>(() =>
    Array.from({ length: 26 }).map((_, i) => {
      const duration = 6 + Math.random() * 6;
      return {
        id: i,
        left: Math.random() * 100,
        size: 16 + Math.random() * 22,
        file: FLOWER_IMAGES[i % FLOWER_IMAGES.length],
        drift: 20 + Math.random() * 60,
        duration,
        // Negative delay starts each piece already mid-fall, so they don't
        // all begin stacked at the top together.
        delay: -Math.random() * duration,
      };
    }),
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {flowers.map((f) => (
        <div
          key={f.id}
          className="animate-flower-float absolute top-0"
          style={
            {
              left: `${f.left}%`,
              width: f.size,
              height: f.size * 1.5,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              "--drift": `${f.drift}px`,
            } as React.CSSProperties
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.file} alt="" className="h-full w-full object-contain" draggable={false} />
        </div>
      ))}
    </div>
  );
}

const REVEAL_TRANSITION_MS = 300;

// All-day event: iCal/Google both expect an exclusive end date (the day
// after), even though it only spans the one day.
const WEDDING_EVENT = {
  title: "Cam & Jon's Wedding",
  location: "Shangri-La Boracay, Boracay Island, Malay, 5608 Aklan, Philippines",
  startDate: "20271129",
  endDate: "20271130",
};

function buildGoogleCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: WEDDING_EVENT.title,
    dates: `${WEDDING_EVENT.startDate}/${WEDDING_EVENT.endDate}`,
    location: WEDDING_EVENT.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsDataUrl() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cam & Jon//Wedding//EN",
    "BEGIN:VEVENT",
    "UID:cam-and-jon-wedding@camnjon",
    "DTSTAMP:20260101T000000Z",
    `DTSTART;VALUE=DATE:${WEDDING_EVENT.startDate}`,
    `DTEND;VALUE=DATE:${WEDDING_EVENT.endDate}`,
    `SUMMARY:${WEDDING_EVENT.title}`,
    `LOCATION:${WEDDING_EVENT.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function SpecialReveal({ icon, onClose }: { icon: FloatingIconData; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Mount in the "hidden" state first, then flip on the next frame so the
    // browser actually has something to transition from.
    const id = requestAnimationFrame(() => setVisible(true));
    const audioEl = audioRef.current;

    // Autoplay-with-sound is only reliably allowed off a real gesture
    // (click/tap/key) — a hover alone doesn't qualify, so if this is the
    // very first interaction with the page, the browser silently blocks
    // it. Rather than stay silent for the rest of the session, retry once
    // on the next real gesture anywhere on the page.
    let retryCleanup: (() => void) | undefined;
    audioEl?.play().catch(() => {
      const retry = () => {
        audioEl.play().catch(() => {});
      };
      document.addEventListener("pointerdown", retry, { once: true });
      document.addEventListener("keydown", retry, { once: true });
      retryCleanup = () => {
        document.removeEventListener("pointerdown", retry);
        document.removeEventListener("keydown", retry);
      };
    });

    return () => {
      cancelAnimationFrame(id);
      audioEl?.pause();
      retryCleanup?.();
    };
  }, []);

  // Play the fade/scale-down first, then unmount once it's actually
  // finished — otherwise the close is an instant cut despite the CSS
  // transition classes below.
  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    setTimeout(onClose, REVEAL_TRANSITION_MS);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-6 transition-opacity ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "#F5BC3F", transitionDuration: `${REVEAL_TRANSITION_MS}ms` }}
      onClick={requestClose}
    >
      <FloatingFlowers />
      <audio ref={audioRef} src="/the-white-lotus-hbo.mp3" />
      <div
        className={`relative z-10 max-h-[90vh] max-w-[90vw] transition-all duration-300 ease-out ${
          visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <p className="mb-3 text-center text-xs uppercase tracking-[0.35em] text-neutral-900">{icon.title}</p>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/camnjonlogosavethedate.png"
            alt="Cam and Jon save the date"
            className="max-h-[80vh] max-w-full rounded-[2rem] shadow-2xl"
          />
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-neutral-600 backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-900"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-4 flex justify-center gap-3 text-xs">
          <a
            href={buildGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#204C32] px-3 py-1.5 font-medium text-white shadow-sm transition-colors hover:bg-[#183a26]"
          >
            Add to Google Calendar
          </a>
          <a
            href={buildIcsDataUrl()}
            download="cam-and-jon-wedding.ics"
            className="rounded-full bg-[#204C32] px-3 py-1.5 font-medium text-white shadow-sm transition-colors hover:bg-[#183a26]"
          >
            Apple / Outlook (.ics)
          </a>
        </div>
      </div>
    </div>
  );
}

export default function FloatingIcons() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const stageRef = useRef<HTMLDivElement>(null);

  const positions = useMemo(() => scatterPositions(floatingIcons.length), []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    // The special reveal owns its own (animated) close — see SpecialReveal —
    // so this generic "click outside" handler should leave it alone rather
    // than yanking it out of the DOM instantly.
    const activeIcon = floatingIcons.find((icon) => icon.id === activeId);
    if (activeIcon?.special) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!stageRef.current?.contains(event.target as Node)) return;
      const target = event.target as HTMLElement;
      if (!target.closest("button")) setActiveId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeId]);

  return (
    <main
      ref={stageRef}
      className="relative min-h-[130vh] w-full overflow-hidden bg-[#f6efe1] sm:min-h-screen"
    >
      <div className="absolute top-8 left-6 z-10 max-w-xs text-left sm:top-10 sm:left-10">
        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">Save the Date</p>
        <h1 className={`${heading.className} text-3xl tracking-tight sm:text-4xl`} style={{ color: "#204C32" }}>Cam &amp; Jon</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Hover (or tap) around. One of these is hiding&nbsp;something.
        </p>
      </div>

      {floatingIcons.map((icon, i) => (
        <IconItem
          key={icon.id}
          icon={icon}
          position={positions[i]}
          isActive={activeId === icon.id}
          onActivate={() => setActiveId(icon.id)}
          onDeactivate={() =>
            setActiveId((current) => (current === icon.id && !icon.special ? null : current))
          }
          reduceMotion={reduceMotion}
        />
      ))}

      {(() => {
        const activeIcon = floatingIcons.find((icon) => icon.id === activeId);
        if (!activeIcon?.special) return null;
        return <SpecialReveal icon={activeIcon} onClose={() => setActiveId(null)} />;
      })()}
    </main>
  );
}
