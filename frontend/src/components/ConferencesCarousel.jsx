import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const AUTOPLAY_MS = 5000;
const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

/* ---------- helpers (unchanged) ---------- */
function normalize(c) {
  return {
    id: c.id,
    title: c.title ?? c.name ?? "Untitled conference",
    blurb: c.description ?? c.summary ?? "",
    location: c.location ?? c.destination ?? c.city ?? "",
    format: c.format ?? "",
    startsAt: c.start_date ?? c.starts_at ?? null,
    endsAt: c.end_date ?? c.ends_at ?? null,
    submissionOpens:
      c.submission_open_date ?? c.submission_opens_at ?? null,
    submissionCloses:
      c.submission_close_date ??
      c.submission_deadline ??
      c.submission_closes_at ??
      null,
    cover: c.cover_image_url ?? c.image_url ?? null,
  };
}

function isLive(conf, now = Date.now()) {
  const opens = conf.submissionOpens ? Date.parse(conf.submissionOpens) : null;
  const closes = conf.submissionCloses ? Date.parse(conf.submissionCloses) : null;
  const ends = conf.endsAt ? Date.parse(conf.endsAt) : null;
  const submissionsOpen =
    (opens === null || opens <= now) && (closes === null || closes >= now);
  const eventNotOver = ends === null || ends >= now;
  return submissionsOpen && eventNotOver;
}

function usePerView() {
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    const mqSm = matchMedia("(min-width: 640px)");
    const mqLg = matchMedia("(min-width: 1024px)");
    const update = () =>
      setPerView(mqLg.matches ? 3 : mqSm.matches ? 2 : 1);
    update();
    mqSm.addEventListener("change", update);
    mqLg.addEventListener("change", update);
    return () => {
      mqSm.removeEventListener("change", update);
      mqLg.removeEventListener("change", update);
    };
  }, []);
  return perView;
}

export default function ConferencesCarousel({ mode = "live" }) {
  const [conferences, setConferences] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error | empty
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [playing, setPlaying] = useState(false);

  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const progressRef = useRef(null);
  const hoveringRef = useRef(false);
  const visibleRef = useRef(true);

  const perView = usePerView();
  const reduceMotion = useMemo(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  /* ---------- fetch ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/v1/conferences`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows = Array.isArray(json) ? json : json.data ?? [];
        if (cancelled) return;
        setConferences(rows.map(normalize));
        setState(rows.length ? "ready" : "empty");
      } catch (err) {
        if (!cancelled) {
          console.error("ConferencesCarousel:", err);
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- which items show ---------- */
  const items = useMemo(() => {
    const rows =
      mode === "all" ? conferences : conferences.filter((c) => isLive(c));
    return rows.sort((a, b) => {
      const ax = a.startsAt ? Date.parse(a.startsAt) : Infinity;
      const bx = b.startsAt ? Date.parse(b.startsAt) : Infinity;
      return ax - bx;
    });
  }, [conferences, mode]);

  const maxIndex = Math.max(0, items.length - perView);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  /* ---------- measure & translate ---------- */
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const first = track?.firstElementChild;
      if (!track || !first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      setOffset(index * (first.getBoundingClientRect().width + gap));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [index, perView, items.length]);

  /* ---------- navigation ---------- */
  const go = useCallback(
    (next, userInitiated = false) => {
      if (maxIndex === 0) return;
      const wrapped =
        ((next % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
      setIndex(wrapped);
      if (userInitiated) startRef.current = performance.now();
    },
    [maxIndex]
  );

  /* ---------- autoplay ---------- */
  const stop = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
    if (progressRef.current) progressRef.current.style.width = "0%";
  }, []);

  const start = useCallback(() => {
    if (reduceMotion || maxIndex === 0) return;
    setPlaying(true);
    startRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      if (hoveringRef.current || !visibleRef.current) {
        startRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const pct = Math.min(1, (now - startRef.current) / AUTOPLAY_MS);
      if (progressRef.current) {
        progressRef.current.style.width = `${(pct * 100).toFixed(1)}%`;
      }
      if (pct >= 1) {
        startRef.current = now;
        setIndex((i) => (i >= maxIndex ? 0 : i + 1));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [maxIndex, reduceMotion]);

  useEffect(() => {
    if (state !== "ready" || items.length <= perView) return stop();
    start();
    return stop;
  }, [state, items.length, perView, start, stop]);

  /* pause off-screen */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* pause hidden tab */
  useEffect(() => {
    const onVis = () => {
      visibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* keyboard */
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1, true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1, true);
    }
  };

  /* swipe */
  const touchX = useRef(null);
  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
    touchX.current = null;
  };

  /* ---------- states ---------- */
  if (state === "loading") {
    return (
      <div className="flex gap-5" aria-busy="true" aria-label="Loading conferences">
        {Array.from({ length: perView }).map((_, i) => (
          <div
            key={i}
            className="h-[280px] flex-1 animate-pulse rounded-2xl bg-slate-800"
          />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-dashed border-rose-900 px-5 py-7 text-center text-rose-300"
      >
        Couldn&apos;t load conferences. Check that the API is running on{" "}
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">
          {API}
        </code>
        .
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 px-5 py-7 text-center text-slate-400">
        {mode === "live"
          ? "No conferences are live right now — check back soon."
          : "No conferences yet."}
      </div>
    );
  }

  const multi = maxIndex > 0;

  return (
    <section
      ref={stageRef}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Live conferences"
      onMouseEnter={() => (hoveringRef.current = true)}
      onMouseLeave={() => (hoveringRef.current = false)}
      onFocusCapture={() => (hoveringRef.current = true)}
      onBlurCapture={() => (hoveringRef.current = false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative rounded-2xl outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-blue-500"
    >
      <div className="relative overflow-hidden rounded-2xl">
        <ul
          ref={trackRef}
          style={{ transform: `translateX(-${offset}px)` }}
          className="flex gap-5 transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none"
        >
          {items.map((c, i) => (
            <li
              key={c.id}
              aria-hidden={i < index || i >= index + perView}
              className="min-w-0 flex-[0_0_calc((100%-1.25rem)/2)] sm:flex-[0_0_calc((100%-1.25rem)/2)] lg:flex-[0_0_calc((100%-2.5rem)/3)]"
            >
              <a
                href={`/conferences/${c.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800 text-inherit no-underline transition hover:-translate-y-0.5 hover:border-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-slate-800 to-slate-900">
                  {c.cover ? (
                    <img
                      src={c.cover}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="text-4xl font-bold text-slate-600"
                    >
                      {c.title.charAt(0)}
                    </span>
                  )}
                  <span className="absolute left-2.5 top-2.5 rounded-full border border-emerald-500 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-emerald-400">
                    Live
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 px-4 pb-[18px] pt-3.5">
                  <h3 className="m-0 text-base font-semibold leading-snug">
                    {c.title}
                  </h3>
                  {c.blurb && (
                    <p className="m-0 line-clamp-2 text-[13px] text-slate-400">
                      {c.blurb}
                    </p>
                  )}
                  <p className="m-0 text-xs text-slate-400">
                    {[c.format, c.location].filter(Boolean).join(" · ")}
                  </p>
                  {c.submissionCloses && (
                    <p className="m-0 text-xs text-slate-400">
                      Submissions close{" "}
                      <time
                        dateTime={c.submissionCloses}
                        className="text-slate-100"
                      >
                        {new Date(c.submissionCloses).toLocaleDateString()}
                      </time>
                    </p>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>

        {multi && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1, true)}
              aria-label="Previous conferences"
              className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-slate-700/60 bg-slate-800/90 text-xl leading-none text-slate-100 backdrop-blur transition hover:border-blue-500 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(index + 1, true)}
              aria-label="Next conferences"
              className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-slate-700/60 bg-slate-800/90 text-xl leading-none text-slate-100 backdrop-blur transition hover:border-blue-500 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              ›
            </button>
          </>
        )}
      </div>

      {multi && (
        <div className="flex items-center gap-3.5 pt-3.5">
          <div className="h-[3px] flex-1 overflow-hidden rounded bg-slate-700">
            <i
              ref={progressRef}
              className="block h-full w-0 bg-blue-500"
            />
          </div>

          <div className="flex gap-2" role="tablist" aria-label="Go to slide">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1} of ${maxIndex + 1}`}
                onClick={() => go(i, true)}
                className="h-2.5 w-2.5 rounded-full bg-slate-600 transition aria-selected:scale-125 aria-selected:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => (playing ? stop() : start())}
            aria-label={playing ? "Pause autoplay" : "Start autoplay"}
            className="rounded-lg border border-slate-700/60 bg-slate-800 px-3 py-1.5 text-[13px] text-slate-100 transition hover:border-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      )}
    </section>
  );
}