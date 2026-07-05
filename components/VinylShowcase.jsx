import { useState, useEffect, useRef } from "react";

// ─── Sample data (replace with your real Supabase fetch) ────────────────────
const DEMO_ALBUMS = [
  { id: "1", title: "Abbey Road", artist: "The Beatles", genre: "Rock", year: 1969, spineColor: "#2a9d8f", coverUrl: null },
  { id: "2", title: "The Dark Side of the Moon", artist: "Pink Floyd", genre: "Progressive Rock", year: 1973, spineColor: "#e76f51", coverUrl: null },
  { id: "3", title: "Rumours", artist: "Fleetwood Mac", genre: "Soft Rock", year: 1977, spineColor: "#e9c46a", coverUrl: null },
  { id: "4", title: "Kind of Blue", artist: "Miles Davis", genre: "Jazz", year: 1959, spineColor: "#457b9d", coverUrl: null },
  { id: "5", title: "Thriller", artist: "Michael Jackson", genre: "Pop", year: 1982, spineColor: "#a8dadc", coverUrl: null },
  { id: "6", title: "Back to Black", artist: "Amy Winehouse", genre: "Soul", year: 2006, spineColor: "#c77dff", coverUrl: null },
  { id: "7", title: "Nevermind", artist: "Nirvana", genre: "Grunge", year: 1991, spineColor: "#f4a261", coverUrl: null },
  { id: "8", title: "Purple Rain", artist: "Prince", genre: "Funk", year: 1984, spineColor: "#9b5de5", coverUrl: null },
];

// ─── Vinyl Record SVG Component ──────────────────────────────────────────────
function VinylDisc({ color, size = 400, spinning = true, coverUrl, imgError, onImgError }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        animation: spinning ? "spin 4s linear infinite" : "none",
      }}
    >
      {/* Outer record */}
      <svg viewBox="0 0 400 400" width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="recordGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="40%" stopColor="#0a0a0a" />
            <stop offset="100%" stopColor="#222" />
          </radialGradient>
          <radialGradient id="grooveSheen" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          {/* Groove rings */}
          {Array.from({ length: 18 }, (_, i) => {
            const r = 185 - i * 8;
            return (
              <circle key={i} cx="200" cy="200" r={r} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
            );
          })}
        </defs>

        {/* Record body */}
        <circle cx="200" cy="200" r="198" fill="url(#recordGrad)" />
        <circle cx="200" cy="200" r="198" fill="url(#grooveSheen)" />

        {/* Groove rings rendered */}
        {Array.from({ length: 18 }, (_, i) => {
          const r = 185 - i * 8;
          return (
            <circle key={i} cx="200" cy="200" r={r} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          );
        })}

        {/* Label area */}
        <circle cx="200" cy="200" r="68" fill={color} />

        {/* Label sheen */}
        <ellipse cx="180" cy="180" rx="40" ry="30" fill="rgba(255,255,255,0.12)" />

        {/* Center hole */}
        <circle cx="200" cy="200" r="7" fill="#111" />
        <circle cx="200" cy="200" r="4" fill="#000" />

        {/* Thin highlight ring */}
        <circle cx="200" cy="200" r="197" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      </svg>

      {/* Cover art in label area */}
      {coverUrl && !imgError && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: size * 0.34,
            height: size * 0.34,
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid rgba(0,0,0,0.4)",
          }}
        >
          <img
            src={coverUrl}
            alt="cover"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={onImgError}
          />
        </div>
      )}
    </div>
  );
}

// ─── Particle Field ───────────────────────────────────────────────────────────
function ParticleField({ count = 60 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.1,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 6,
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "white",
            opacity: p.opacity,
            animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Track Progress Bar ───────────────────────────────────────────────────────
function ProgressBar({ duration = 12000 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / duration) * 100, 100));
    }, 50);
    return () => clearInterval(id);
  }, [duration]);

  return (
    <div
      style={{
        width: "100%",
        height: 2,
        background: "rgba(255,255,255,0.12)",
        borderRadius: 99,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.8))",
          borderRadius: 99,
          transition: "width 0.1s linear",
          boxShadow: "0 0 8px rgba(255,255,255,0.4)",
        }}
      />
    </div>
  );
}

// ─── Album Stack (side queue) ─────────────────────────────────────────────────
function AlbumQueue({ albums, currentIndex }) {
  const upcoming = [...albums.slice(currentIndex + 1), ...albums.slice(0, currentIndex)].slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4, fontFamily: "'Courier New', monospace" }}>
        Up Next
      </div>
      {upcoming.map((album, i) => (
        <div
          key={album.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            opacity: 1 - i * 0.15,
            transition: "all 0.4s",
          }}
        >
          {/* Mini vinyl */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#111",
              border: `3px solid ${album.spineColor}`,
              flexShrink: 0,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: album.spineColor }} />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Playfair Display', Georgia, serif" }}>
              {album.title}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2, fontFamily: "'Courier New', monospace" }}>
              {album.artist}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Showcase Component ──────────────────────────────────────────────────
export default function VinylShowcase({ albums, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [imgErrors, setImgErrors] = useState({});
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const timerRef = useRef(null);
  const INTERVAL = 12000;

  const current = albums[currentIndex];

  const goTo = (idx) => {
    if (transitioning || idx === currentIndex) return;
    setPrevIndex(currentIndex);
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setTransitioning(false);
      setPrevIndex(null);
    }, 600);
  };

  const goNext = () => goTo((currentIndex + 1) % albums.length);
  const goPrev = () => goTo((currentIndex - 1 + albums.length) % albums.length);

  useEffect(() => {
    if (paused) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(goNext, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [currentIndex, paused]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") setPaused((p) => !p);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex]);

  // Derive a background color from spine color
  const bgAccent = current.spineColor + "18";
  const bgGlow = current.spineColor + "30";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #050508; overflow: hidden; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes float {
          from { transform: translateY(0px) translateX(0px); opacity: var(--op, 0.3); }
          to { transform: translateY(-20px) translateX(6px); opacity: calc(var(--op, 0.3) * 0.4); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes waveEq {
          0%, 100% { height: 6px; }
          50% { height: 22px; }
        }

        .showcase-root {
          width: 100vw;
          height: 100vh;
          background: #050508;
          position: relative;
          overflow: hidden;
          cursor: none;
          font-family: 'Space Mono', monospace;
        }

        .showcase-root:hover { cursor: default; }

        /* Animated gradient BG */
        .bg-gradient {
          position: absolute;
          inset: 0;
          transition: all 1.2s ease;
        }

        /* Vinyl enter/exit */
        .vinyl-enter {
          animation: vinylEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .vinyl-exit {
          animation: vinylExit 0.6s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        @keyframes vinylEnter {
          from { opacity: 0; transform: scale(0.75) rotate(-15deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes vinylExit {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(1.15) rotate(10deg); }
        }

        /* Text slide */
        .text-enter {
          animation: fadeInLeft 0.7s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Equalizer bars */
        .eq-bar {
          width: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.5);
          animation: waveEq var(--dur, 0.8s) var(--delay, 0s) ease-in-out infinite alternate;
        }

        /* Hover controls */
        .controls-overlay {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 16px;
          align-items: center;
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px 24px;
          border-radius: 50px;
          backdrop-filter: blur(12px);
          transition: opacity 0.4s;
          z-index: 100;
        }

        .ctrl-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.7);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .ctrl-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          border-color: rgba(255,255,255,0.5);
        }
      `}</style>

      <div
        className="showcase-root"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* ── Dynamic background ─────────────────────────────── */}
        <div
          className="bg-gradient"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 60% 50%, ${current.spineColor}22, transparent),
              radial-gradient(ellipse 60% 80% at 20% 80%, ${current.spineColor}15, transparent),
              radial-gradient(ellipse 40% 40% at 80% 20%, rgba(255,255,255,0.03), transparent),
              #050508
            `,
          }}
        />

        {/* ── Noise texture overlay ──────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />

        {/* ── Particles ──────────────────────────────────────── */}
        <ParticleField count={50} />

        {/* ── Horizontal scan line ───────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* ── Giant ambient disc shadow ───────────────────────── */}
        <div
          style={{
            position: "absolute",
            right: "-5%",
            top: "50%",
            transform: "translateY(-50%)",
            width: "65vh",
            height: "65vh",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${current.spineColor}25 0%, transparent 70%)`,
            transition: "background 1.2s ease",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ── MAIN LAYOUT ─────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "1fr auto 280px",
            gridTemplateRows: "1fr",
            alignItems: "center",
            padding: "0 60px",
            gap: 60,
          }}
        >
          {/* ── LEFT: Info Panel ──────────────────────────────── */}
          <div
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 480 }}
            key={`info-${currentIndex}`}
            className="text-enter"
          >
            {/* Genre tag */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                alignSelf: "flex-start",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: current.spineColor,
                  animation: "pulseGlow 2s ease-in-out infinite",
                  boxShadow: `0 0 12px ${current.spineColor}`,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.25em",
                  color: current.spineColor,
                  textTransform: "uppercase",
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                }}
              >
                {current.genre}
              </span>
            </div>

            {/* Album title */}
            <h1
              style={{
                fontSize: "clamp(2.2rem, 4.5vw, 4rem)",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 900,
                lineHeight: 1.05,
                color: "#ffffff",
                marginBottom: 16,
                textShadow: `0 0 60px ${current.spineColor}40`,
                letterSpacing: "-0.01em",
              }}
            >
              {current.title}
            </h1>

            {/* Artist */}
            <h2
              style={{
                fontSize: "clamp(1rem, 2vw, 1.5rem)",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.45)",
                marginBottom: 40,
                letterSpacing: "0.02em",
              }}
            >
              {current.artist}
            </h2>

            {/* Year + collection number */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                marginBottom: 32,
              }}
            >
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4 }}>Year</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "'Space Mono', monospace" }}>{current.year}</div>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.1)" }} />
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4 }}>Collection</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "'Space Mono', monospace" }}>
                  {String(currentIndex + 1).padStart(2, "0")} / {String(albums.length).padStart(2, "0")}
                </div>
              </div>
            </div>

            {/* Equalizer animation */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 28, marginBottom: 24 }}>
              {Array.from({ length: 14 }, (_, i) => (
                <div
                  key={i}
                  className="eq-bar"
                  style={{
                    "--dur": `${0.4 + Math.random() * 0.6}s`,
                    "--delay": `${Math.random() * 0.4}s`,
                    height: `${Math.random() * 20 + 6}px`,
                    background: `${current.spineColor}99`,
                  }}
                />
              ))}
            </div>

            {/* Progress */}
            {!paused && <ProgressBar duration={INTERVAL} key={`prog-${currentIndex}`} />}
            {paused && (
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
                ⏸ Paused — press Space to resume
              </div>
            )}
          </div>

          {/* ── CENTER: Vinyl Record ─────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Glow halo behind record */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${current.spineColor}35 0%, transparent 65%)`,
                filter: "blur(40px)",
                transform: "scale(1.1)",
                transition: "background 1.2s ease",
                animation: "pulseGlow 3s ease-in-out infinite",
              }}
            />

            {/* The record */}
            <div
              key={`vinyl-${currentIndex}`}
              className="vinyl-enter"
            >
              <VinylDisc
                color={current.spineColor}
                size={Math.min(window.innerHeight * 0.65, 520)}
                spinning={!paused}
                coverUrl={current.coverUrl}
                imgError={imgErrors[current.id]}
                onImgError={() => setImgErrors((p) => ({ ...p, [current.id]: true }))}
              />
            </div>
          </div>

          {/* ── RIGHT: Queue ─────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 24,
            }}
          >
            {/* Index dots */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8 }}>
              {albums.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === currentIndex ? 20 : 6,
                    height: 6,
                    borderRadius: 99,
                    background: i === currentIndex ? current.spineColor : "rgba(255,255,255,0.2)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    boxShadow: i === currentIndex ? `0 0 8px ${current.spineColor}` : "none",
                  }}
                />
              ))}
            </div>

            <AlbumQueue albums={albums} currentIndex={currentIndex} />
          </div>
        </div>

          <button
              onClick={onExit}
              style={{
                  position: "absolute",
                  top: 24,
                  right: 32,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.4)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "'Space Mono', monospace",
                  zIndex: 100,
                  transition: "all 0.2s",
              }}
              onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.9)"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}
          >
              ✕ Exit
          </button>

        {/* ── BOTTOM watermark ─────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 60,
            fontSize: 9,
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.12)",
            textTransform: "uppercase",
            fontFamily: "'Space Mono', monospace",
            zIndex: 20,
          }}
        >
          KeepingRecord Collection Showcase
        </div>

        {/* ── Hover controls ───────────────────────────────────── */}
        {showControls && (
          <div className="controls-overlay">
            <button className="ctrl-btn" onClick={goPrev} title="Previous (←)">←</button>
            <button
              className="ctrl-btn"
              onClick={() => setPaused((p) => !p)}
              title="Pause/Play (Space)"
              style={{ width: 44, height: 44, fontSize: 16 }}
            >
              {paused ? "▶" : "⏸"}
            </button>
            <button className="ctrl-btn" onClick={goNext} title="Next (→)">→</button>
          </div>
        )}
      </div>
    </>
  );
}
