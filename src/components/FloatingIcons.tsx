"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

// Actual box size (not a CSS transform) so the tooltip, which anchors to
// this element's real edges via top-full/bottom-full, clears the enlarged
// hover media instead of overlapping it.
const hoverMediaSizeClasses = "h-[12rem] w-[12rem] sm:h-[15rem] sm:w-[15rem]";

function HoverVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Try with sound first — browsers allow unmuted autoplay once the user
    // has interacted with the page at all (not necessarily this element),
    // so this succeeds for most hovers after the first click anywhere on
    // the site. Fall back to muted so the video still plays visually on a
    // cold first hover, then retry unmuted once on the next real gesture
    // (hover itself never counts as one) so sound kicks in instead of
    // staying silent for the rest of that hover.
    let retryCleanup: (() => void) | undefined;
    let armTimer: number | undefined;
    el.play().catch(() => {
      el.muted = true;
      el.play().catch(() => {});
      const retry = () => {
        el.muted = false;
        el.play().catch(() => {});
      };
      // On mobile, the tap that just activated this hover is itself a
      // multi-part gesture (touchstart/touchend/mouseover/mousedown/click);
      // onMouseEnter fires early in that sequence, so arming immediately
      // could catch that same tap's own trailing mousedown/click — unmuting
      // and re-calling play() on a video that's already mid-decode, which
      // stalls it the same way the old Web Audio setup did. Wait a beat so
      // only a genuinely later gesture can trigger the retry.
      armTimer = window.setTimeout(() => {
        document.addEventListener("pointerdown", retry, { once: true });
        document.addEventListener("keydown", retry, { once: true });
        retryCleanup = () => {
          document.removeEventListener("pointerdown", retry);
          document.removeEventListener("keydown", retry);
        };
      }, 500);
    });

    return () => {
      window.clearTimeout(armTimer);
      retryCleanup?.();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      playsInline
      className="h-full w-full select-none rounded-full object-cover drop-shadow-md"
    />
  );
}

function IconGlyph({
  file,
  alt,
  hoverVideo,
  hoverImage,
  playVideo,
}: {
  file: string;
  alt: string;
  hoverVideo?: string;
  hoverImage?: string;
  playVideo?: boolean;
}) {
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

  if (hoverVideo && playVideo) {
    return <HoverVideo src={`/${hoverVideo}`} />;
  }

  if (hoverImage && playVideo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/${hoverImage}`}
        alt={alt}
        draggable={false}
        className="h-full w-full select-none rounded-full object-cover drop-shadow-md"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={`/icons/${file}`}
      alt={alt}
      draggable={false}
      loading="lazy"
      className="h-full w-full select-none object-contain drop-shadow-md"
    />
  );
}

function Tooltip({
  icon,
  placement,
  shift,
  circleOverride,
}: {
  icon: FloatingIconData;
  placement: { vertical: "above" | "below"; horizontal: "left" | "center" | "right" };
  shift: { x: number; y: number };
  // For icons whose enlarged circle is a separate, independently-positioned
  // decorative element (see driftsToCenter in IconItem) rather than this
  // button's own box — the button/tooltip's shared "relative" ancestor
  // stays small, so top-full/bottom-full below can't be used to clear it.
  // Anchors with explicit pixel math against that circle instead.
  circleOverride?: { size: number; shift: { x: number; y: number } };
}) {
  const style = circleOverride
    ? {
        // top:50%/left:50% here lands on the small button's own center (the
        // shared anchor point the decorative circle also offsets from — see
        // driftsToCenter in IconItem). X is centered on the circle
        // (-50% of the tooltip's own width); Y is deliberately NOT
        // centered — it's pinned to the circle's actual bottom edge
        // (radius + gap below that anchor), not the circle's center.
        top: "50%",
        left: "50%",
        transform: `translate(calc(-50% + ${circleOverride.shift.x}px), ${circleOverride.shift.y + circleOverride.size / 2 + 12}px)`,
      }
    : {
        transform: `translate(calc(${placement.horizontal === "center" ? "-50%" : "0px"} + ${shift.x}px), ${shift.y}px)`,
      };
  const className = circleOverride
    ? "absolute z-20 w-56 rounded-2xl border border-neutral-900/10 bg-white p-4 text-center shadow-lg"
    : `absolute ${placement.vertical === "below" ? "top-full mt-3" : "bottom-full mb-3"} ${
        placement.horizontal === "left" ? "left-0" : placement.horizontal === "right" ? "right-0" : "left-1/2"
      } z-20 w-56 rounded-2xl border border-neutral-900/10 bg-white p-4 text-center shadow-lg`;

  return (
    <div role="status" style={style} className={className}>
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
  stageRef,
}: {
  icon: FloatingIconData;
  position: Position;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  reduceMotion: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const floatRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const revealingRef = useRef(false);
  const [revealing, setRevealing] = useState(false);
  const hasHoverMedia = Boolean(icon.hoverVideo || icon.hoverImage);
  // The disco icon's circle drifts all the way toward the stage center
  // (see the centering vs. edge-avoidance-only logic below), which can move
  // it out from under the user's actual cursor — moving the interactive
  // button itself caused a mouseleave/re-enter/mouseleave flicker loop. So
  // for this icon only, the button stays put at its normal size (stable
  // hit target) and a separate, pointer-events-none decorative element
  // shows the enlarged, drifted video instead.
  const driftsToCenter = Boolean(icon.discoOnHover);
  const [hoverSize, setHoverSize] = useState<number | null>(null);
  const [hoverShift, setHoverShift] = useState({ x: 0, y: 0 });

  // Size the hover-media circle the same everywhere (so e.g. sunglasses
  // isn't noticeably smaller than the others just for sitting near a
  // corner), and instead nudge its position toward whichever side has
  // room — near a screen edge (common on narrow/mobile viewports) a fixed
  // centered size would get clipped by the stage's overflow-hidden.
  useLayoutEffect(() => {
    // No cleanup-to-null needed on deactivation: the render below only
    // reads hoverSize/hoverShift while isActive && hasHoverMedia, so a
    // stale value sitting unused between hovers is harmless, and this
    // effect recomputes a fresh one synchronously before paint next time.
    if (!isActive || !hasHoverMedia) return;
    const el = floatRef.current;
    const stage = stageRef.current;
    if (!el || !stage) return;
    const iconRect = el.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const centerX = iconRect.left + iconRect.width / 2 - stageRect.left;
    const centerY = iconRect.top + iconRect.height / 2 - stageRect.top;
    const margin = 16;
    const preferred = window.innerWidth < 640 ? 192 : 240; // 12rem / 15rem
    const size = Math.max(96, Math.min(preferred, stageRect.width - margin * 2, stageRect.height - margin * 2));

    // Every icon settles wherever keeps it on-screen (clamped as close to
    // its own position as possible), except the disco icon: it's the one
    // hover with sound + a beat effect worth actually watching, so it grows
    // from the icon's spot but settles toward center instead of wherever it
    // happens to be sitting (often a corner). "Center" here means the
    // middle of whatever's currently visible on screen, not the stage's own
    // total height — the stage can be taller than the viewport (mobile uses
    // 130vh so there's room to scroll), so centering on the stage's middle
    // could land below the fold entirely.
    const visibleLeft = Math.max(0, -stageRect.left);
    const visibleRight = Math.min(stageRect.width, window.innerWidth - stageRect.left);
    const visibleTop = Math.max(0, -stageRect.top);
    const visibleBottom = Math.min(stageRect.height, window.innerHeight - stageRect.top);

    const desiredCenterX = icon.discoOnHover ? (visibleLeft + visibleRight) / 2 : centerX;
    const desiredCenterY = icon.discoOnHover ? (visibleTop + visibleBottom) / 2 : centerY;

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
    const clampedCenterX = clamp(desiredCenterX, margin + size / 2, stageRect.width - margin - size / 2);
    const clampedCenterY = clamp(desiredCenterY, margin + size / 2, stageRect.height - margin - size / 2);

    setHoverSize(size);
    setHoverShift({ x: clampedCenterX - centerX, y: clampedCenterY - centerY });
  }, [isActive, hasHoverMedia, stageRef, icon.discoOnHover]);

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
        {/* Separate from floatRef below (which GSAP drives directly via its
            own inline transform) so the disco beat-pulse — driven by
            DiscoConductor writing --beat-scale on the stage — can scale
            independently without the two fighting over the same inline
            style. Skipped for the actively-hovered icon so e.g. sunglasses
            itself doesn't pulse against its own beat. */}
        <div style={isActive ? undefined : { transform: "scale(var(--beat-scale, 1))" }}>
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
              style={
                isActive && hasHoverMedia && !driftsToCenter && hoverSize
                  ? { width: hoverSize, height: hoverSize, transform: `translate(${hoverShift.x}px, ${hoverShift.y}px)` }
                  : undefined
              }
              className={`${
                isActive && hasHoverMedia && !driftsToCenter
                  ? hoverMediaSizeClasses
                  : `${sizeClasses[icon.size]} hover:scale-110 focus:scale-110`
              } cursor-pointer rounded-full transition-all duration-300 ease-out focus:outline-none`}
            >
              <IconGlyph
                file={icon.file}
                alt={icon.alt}
                hoverVideo={icon.hoverVideo}
                hoverImage={icon.hoverImage}
                playVideo={isActive && !driftsToCenter}
              />
            </button>
          </div>
        </div>
        {isActive && hasHoverMedia && driftsToCenter && hoverSize && (
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 overflow-hidden rounded-full transition-all duration-300 ease-out"
            style={{
              width: hoverSize,
              height: hoverSize,
              transform: `translate(-50%, -50%) translate(${hoverShift.x}px, ${hoverShift.y}px)`,
            }}
          >
            <IconGlyph file={icon.file} alt={icon.alt} hoverVideo={icon.hoverVideo} hoverImage={icon.hoverImage} playVideo />
          </div>
        )}
        {isActive && !icon.special && (
          <Tooltip
            icon={icon}
            placement={placement}
            shift={hoverShift}
            circleOverride={driftsToCenter && hoverSize ? { size: hoverSize, shift: hoverShift } : undefined}
          />
        )}
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
            src="/camnjonlogosavethedate.webp"
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

const DISCO_COLORS = ["#FF3CAC", "#784BA0", "#2B86C5", "#F9D923", "#EB5B00"];

// Two large, blurred, counter-rotating conic gradients blended over the
// stage — opacity riding on --beat-glow (written by DiscoConductor) so the
// lights flare brighter on each detected beat instead of just spinning at a
// constant brightness.
function DiscoOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      aria-hidden="true"
      // Isolate this subtree onto its own compositor layer so animating/
      // repainting it (blur + mix-blend-mode are both expensive) doesn't
      // force the browser to repaint siblings — the hover video included —
      // on every frame.
      style={{ isolation: "isolate", willChange: "opacity" }}
    >
      <div
        className="animate-disco-sweep absolute"
        style={{
          inset: "-15%",
          background: `conic-gradient(from 0deg, ${DISCO_COLORS.join(", ")}, ${DISCO_COLORS[0]})`,
          opacity: "calc(0.22 + var(--beat-glow, 0) * 0.55)",
          mixBlendMode: "screen",
          filter: "blur(20px) saturate(1.6)",
          animationDuration: "16s",
          willChange: "transform",
        }}
      />
      <div
        className="animate-disco-sweep absolute"
        style={{
          inset: "-15%",
          background: `conic-gradient(from 180deg, ${DISCO_COLORS[2]}, ${DISCO_COLORS[4]}, ${DISCO_COLORS[1]}, ${DISCO_COLORS[3]}, ${DISCO_COLORS[2]})`,
          opacity: "calc(0.18 + var(--beat-glow, 0) * 0.5)",
          mixBlendMode: "screen",
          filter: "blur(24px) saturate(1.6)",
          animationDirection: "reverse",
          animationDuration: "20s",
          willChange: "transform",
        }}
      />
    </div>
  );
}

// Drives --beat-scale/--beat-glow with a fixed ~120bpm simulated pulse —
// every icon's pulse wrapper and DiscoOverlay just read those custom
// properties, so this is the only place doing per-frame work. This used to
// tap the hover video's actual audio via the Web Audio API for real beat
// detection, but attaching a MediaElementAudioSourceNode to the video was
// causing it to hang before starting. Not worth it; a simulated pulse reads
// the same to a viewer and never touches the video at all.
//
// Starting used to also wait on detecting the video's actual first
// composited frame (MutationObserver + requestVideoFrameCallback), so the
// video was guaranteed to be the first thing that visibly happens. That
// detection machinery was itself extra work competing for the main thread
// right as the video tries to decode its first frames on constrained
// devices — simplified to a flat delay instead. Slightly less precise
// (disco could rarely start a beat early/late relative to the video) but
// removes the piece most likely to compound lag.
const DISCO_START_DELAY_MS = 400;

function DiscoConductor({ active, stageRef }: { active: boolean; stageRef: React.RefObject<HTMLDivElement | null> }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    const stage = stageRef.current;
    if (!stage) return;

    let cancelled = false;
    let rafId: number | null = null;

    const applyPulse = (p: number) => {
      stage.style.setProperty("--beat-scale", (1 + p * 0.16).toFixed(4));
      stage.style.setProperty("--beat-glow", p.toFixed(4));
    };

    // Writing --beat-scale/--beat-glow forces a style recalc across every
    // icon's pulse wrapper plus the two blurred disco layers, so this is
    // throttled to ~30fps rather than every rAF (~60fps) — still reads as
    // a smooth pulse.
    const FRAME_INTERVAL_MS = 1000 / 30;
    let lastFrameAt = 0;

    const tick = (now: number) => {
      if (cancelled) return;
      if (now - lastFrameAt >= FRAME_INTERVAL_MS) {
        lastFrameAt = now;
        const phase = (now % 500) / 500;
        applyPulse(Math.max(0, 1 - phase * 2));
      }
      rafId = requestAnimationFrame(tick);
    };

    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      setReady(true);
      rafId = requestAnimationFrame(tick);
    }, DISCO_START_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      stage.style.setProperty("--beat-scale", "1");
      stage.style.setProperty("--beat-glow", "0");
      setReady(false);
    };
  }, [active, stageRef]);

  if (!active || !ready) return null;
  return <DiscoOverlay />;
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

  // The reveal image only renders once the suitcase's shake animation
  // finishes (~0.4s) — quietly fetch it into cache as soon as the page
  // loads instead, so by the time anyone triggers the reveal it's instant.
  useEffect(() => {
    const img = new Image();
    img.src = "/camnjonlogosavethedate.webp";
  }, []);

  const activeIcon = floatingIcons.find((icon) => icon.id === activeId);

  useEffect(() => {
    if (!activeId) return;
    // The special reveal owns its own (animated) close — see SpecialReveal —
    // so this generic "click outside" handler should leave it alone rather
    // than yanking it out of the DOM instantly.
    if (activeIcon?.special) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!stageRef.current?.contains(event.target as Node)) return;
      const target = event.target as HTMLElement;
      if (!target.closest("button")) setActiveId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeId, activeIcon?.special]);

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
          stageRef={stageRef}
        />
      ))}

      <DiscoConductor active={!reduceMotion && Boolean(activeIcon?.discoOnHover)} stageRef={stageRef} />

      {activeIcon?.special && <SpecialReveal icon={activeIcon} onClose={() => setActiveId(null)} />}
    </main>
  );
}
