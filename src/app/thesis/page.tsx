"use client";

import { useEffect, useRef } from "react";

// Self-contained Imprevista portfolio/thesis page
// Ported from the original imprevista.com static HTML site

export default function ThesisPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Animated hero canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w: number, h: number;
    let animId: number;
    const NODE_COUNT = 60;
    const CONNECT_DIST = 150;
    const mouse = { x: -1000, y: -1000 };

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
    }

    let nodes: Node[] = [];

    function resize() {
      w = canvas!.width = canvas!.offsetWidth;
      h = canvas!.height = canvas!.offsetHeight;
    }

    function initNodes() {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 2 + 1.5,
          color: Math.random() > 0.6 ? "#7209b7" : "#4361ee",
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.15;
            ctx!.strokeStyle = `rgba(67, 97, 238, ${alpha})`;
            ctx!.lineWidth = 0.8;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx!.fillStyle = n.color;
        ctx!.globalAlpha = 0.6;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          n.vx += dx * 0.0003;
          n.vy += dy * 0.0003;
        }
        n.vx *= 0.999;
        n.vy *= 0.999;
      }
      animId = requestAnimationFrame(draw);
    }

    const handleResize = () => resize();
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    resize();
    initNodes();
    draw();

    // Intersection observer for reveal animations
    const revealEls = document.querySelectorAll(".thesis-reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("thesis-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // Graph connection animation
    const graphEl = document.getElementById("graphContainer");
    if (graphEl) {
      const graphObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) graphEl.classList.add("connected");
          });
        },
        { threshold: 0.4 }
      );
      graphObserver.observe(graphEl);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      revealObserver.disconnect();
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .thesis-page {
          --t-bg: #fafafa;
          --t-fg: #1a1a2e;
          --t-accent: #4361ee;
          --t-accent-purple: #7209b7;
          --t-muted: #6b7280;
          --t-card-bg: #ffffff;
          --t-card-border: #e5e7eb;
          --t-tag-bg: #f3f4f6;
          --t-max-w: 1200px;
          --t-green: #10b981;
          --t-amber: #f59e0b;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--t-bg);
          color: var(--t-fg);
        }
        .thesis-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .thesis-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .thesis-stagger > .thesis-reveal:nth-child(1) { transition-delay: 0s; }
        .thesis-stagger > .thesis-reveal:nth-child(2) { transition-delay: 0.12s; }
        .thesis-stagger > .thesis-reveal:nth-child(3) { transition-delay: 0.24s; }
        .thesis-stagger > .thesis-reveal:nth-child(4) { transition-delay: 0.36s; }
        .thesis-stagger > .thesis-reveal:nth-child(5) { transition-delay: 0.12s; }
        .thesis-stagger > .thesis-reveal:nth-child(6) { transition-delay: 0.24s; }
        .thesis-stagger > .thesis-reveal:nth-child(7) { transition-delay: 0.36s; }
        .graph-edge {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          transition: stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        #graphContainer.connected .graph-edge { stroke-dashoffset: 0; }
        .graph-label { opacity: 0; transition: opacity 0.8s ease 1s; }
        #graphContainer.connected .graph-label { opacity: 1; }
      `}</style>

      <div className="thesis-page">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{ background: "#0a0a1a" }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.5 }}
          />
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(10,10,26,0.3) 0%, rgba(10,10,26,0.8) 70%)",
            }}
          />
          <div className="relative z-[2] text-center px-6 max-w-[900px]">
            <div
              className="inline-block mb-8 px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-widest"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "rgba(67, 97, 238, 0.9)",
                background: "rgba(67, 97, 238, 0.12)",
                border: "1px solid rgba(67, 97, 238, 0.2)",
              }}
            >
              Product Studio
            </div>
            <h1
              className="font-extrabold leading-[1.05] mb-7"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                letterSpacing: "-2px",
                color: "#fff",
              }}
            >
              <span
                style={{
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                10x
              </span>{" "}
              data. 10x skill. 10x niche.
            </h1>
            <p
              className="mx-auto leading-[1.7]"
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "rgba(255, 255, 255, 0.6)",
                maxWidth: 640,
              }}
            >
              The data exists. The knowledge exists. The need is specific. We
              build tools that synthesize overlooked data, accelerate mastery
              through structure, and solve narrow problems with surgical
              precision.
            </p>
          </div>
        </section>

        {/* Thesis */}
        <section className="py-36 relative" style={{ background: "var(--t-bg)" }}>
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div className="thesis-reveal">
                <h2
                  className="font-bold leading-[1.2] mb-6"
                  style={{ fontSize: 32, letterSpacing: "-0.5px" }}
                >
                  The data is there.
                  <br />
                  Nobody&apos;s connecting it.
                </h2>
                <p
                  className="mb-4 leading-[1.8]"
                  style={{ fontSize: 16, color: "var(--t-muted)" }}
                >
                  Every domain is drowning in information&mdash;books, podcasts,
                  field data, APIs, public records. But it sits in silos. Nobody
                  synthesizes it. The tools are generic. The skill paths are
                  invisible.
                </p>
                <p
                  className="mb-4 leading-[1.8]"
                  style={{ fontSize: 16, color: "var(--t-muted)" }}
                >
                  The result: people plateau because they can&apos;t see what to
                  work on next. They miss opportunities because the data is
                  scattered across 17 sources. They use bloated platforms when
                  they need a scalpel.
                </p>
                <p
                  className="leading-[1.8]"
                  style={{ fontSize: 16, color: "var(--t-muted)" }}
                >
                  We build the opposite: tools that harness the data nobody else
                  combines, structure knowledge into walkable skill paths, and
                  solve very specific problems with very specific products.
                </p>
              </div>
              <div className="thesis-reveal flex justify-center">
                <div
                  id="graphContainer"
                  className="w-full"
                  style={{ maxWidth: 460, aspectRatio: "1" }}
                >
                  <svg
                    viewBox="0 0 400 400"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    <line className="graph-edge" x1="120" y1="80" x2="200" y2="55" stroke="#4361ee" strokeWidth="1.5" opacity="0.35" />
                    <line className="graph-edge" x1="200" y1="55" x2="290" y2="85" stroke="#4361ee" strokeWidth="1.5" opacity="0.35" />
                    <line className="graph-edge" x1="120" y1="80" x2="100" y2="180" stroke="#4361ee" strokeWidth="1.5" opacity="0.3" />
                    <line className="graph-edge" x1="200" y1="55" x2="200" y2="175" stroke="#7209b7" strokeWidth="1.5" opacity="0.4" />
                    <line className="graph-edge" x1="290" y1="85" x2="300" y2="185" stroke="#4361ee" strokeWidth="1.5" opacity="0.3" />
                    <line className="graph-edge" x1="100" y1="180" x2="200" y2="175" stroke="#7209b7" strokeWidth="1.5" opacity="0.35" />
                    <line className="graph-edge" x1="200" y1="175" x2="300" y2="185" stroke="#4361ee" strokeWidth="1.5" opacity="0.35" />
                    <line className="graph-edge" x1="100" y1="180" x2="80" y2="290" stroke="#4361ee" strokeWidth="1.5" opacity="0.25" />
                    <line className="graph-edge" x1="200" y1="175" x2="200" y2="300" stroke="#7209b7" strokeWidth="1.5" opacity="0.35" />
                    <line className="graph-edge" x1="300" y1="185" x2="320" y2="290" stroke="#4361ee" strokeWidth="1.5" opacity="0.25" />
                    <line className="graph-edge" x1="80" y1="290" x2="200" y2="300" stroke="#4361ee" strokeWidth="1.5" opacity="0.3" />
                    <line className="graph-edge" x1="200" y1="300" x2="320" y2="290" stroke="#7209b7" strokeWidth="1.5" opacity="0.3" />
                    <circle cx="120" cy="80" r="8" fill="#4361ee" opacity="0.7" />
                    <circle cx="200" cy="55" r="11" fill="#4361ee" opacity="0.9" />
                    <circle cx="290" cy="85" r="7" fill="#4361ee" opacity="0.6" />
                    <circle cx="100" cy="180" r="9" fill="#7209b7" opacity="0.7" />
                    <circle cx="200" cy="175" r="13" fill="#7209b7" opacity="0.9" />
                    <circle cx="300" cy="185" r="8" fill="#4361ee" opacity="0.7" />
                    <circle cx="80" cy="290" r="6" fill="#4361ee" opacity="0.5" />
                    <circle cx="200" cy="300" r="10" fill="#7209b7" opacity="0.7" />
                    <circle cx="320" cy="290" r="7" fill="#4361ee" opacity="0.5" />
                    <text className="graph-label" x="200" y="28" textAnchor="middle" fill="#6b7280" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="500">FOUNDATIONS</text>
                    <text className="graph-label" x="200" y="155" textAnchor="middle" fill="#6b7280" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="500">CORE SKILLS</text>
                    <text className="graph-label" x="200" y="345" textAnchor="middle" fill="#6b7280" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="500">MASTERY</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-[1200px] mx-auto px-6">
          <hr style={{ border: "none", borderTop: "1px solid var(--t-card-border)" }} />
        </div>

        {/* Three Multipliers */}
        <section className="py-36" style={{ background: "var(--t-bg)" }}>
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-18 thesis-reveal">
              <div
                className="flex items-center justify-center gap-4 mb-3.5"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--t-accent)",
                }}
              >
                <span className="w-8 h-px" style={{ background: "var(--t-card-border)" }} />
                The Thesis
                <span className="w-8 h-px" style={{ background: "var(--t-card-border)" }} />
              </div>
              <h2 className="font-bold" style={{ fontSize: 36, letterSpacing: "-0.5px" }}>
                Three multipliers
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 thesis-stagger">
              {[
                {
                  num: "01",
                  title: "10x Data",
                  desc: "The data already exists\u2014public APIs, geo datasets, market feeds, community signals. Nobody combines it. We synthesize scattered sources into a single decision surface, so you see what everyone else misses.",
                  iconColor: "rgba(67, 97, 238, 0.1)",
                },
                {
                  num: "02",
                  title: "10x Skill",
                  desc: "Scaffolded mastery. Extract knowledge graphs from raw content\u2014books, transcripts, field notes. Map what correct and incorrect look like at every level. Make the path from novice to expert visible and walkable.",
                  iconColor: "rgba(114, 9, 183, 0.1)",
                },
                {
                  num: "03",
                  title: "10x Niche",
                  desc: "Not platforms\u2014surgical instruments. Hyper-specific tools for hyper-specific needs. One job, done better than anything general-purpose could. The user walks away knowing what to do, not just seeing data.",
                  iconColor: "rgba(16, 185, 129, 0.1)",
                },
              ].map((card) => (
                <div
                  key={card.num}
                  className="thesis-reveal rounded-xl p-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: "var(--t-card-bg)",
                    border: "1px solid var(--t-card-border)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-[11px] flex items-center justify-center mb-5"
                    style={{ background: card.iconColor }}
                  />
                  <div
                    className="mb-4"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--t-accent)",
                    }}
                  >
                    {card.num}
                  </div>
                  <h3
                    className="font-semibold mb-3"
                    style={{ fontSize: 18, letterSpacing: "-0.3px" }}
                  >
                    {card.title}
                  </h3>
                  <p className="leading-[1.7]" style={{ fontSize: 14, color: "var(--t-muted)" }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-[1200px] mx-auto px-6">
          <hr style={{ border: "none", borderTop: "1px solid var(--t-card-border)" }} />
        </div>

        {/* Portfolio */}
        <section className="py-36" style={{ background: "var(--t-bg)" }}>
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-18 thesis-reveal">
              <div
                className="flex items-center justify-center gap-4 mb-3.5"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--t-accent)",
                }}
              >
                <span className="w-8 h-px" style={{ background: "var(--t-card-border)" }} />
                Portfolio
                <span className="w-8 h-px" style={{ background: "var(--t-card-border)" }} />
              </div>
              <h2 className="font-bold" style={{ fontSize: 36, letterSpacing: "-0.5px" }}>
                The thesis in practice
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 thesis-stagger">
              {[
                {
                  tag: "Wildlife & Hunting",
                  title: "CritterScout",
                  desc: "17 geospatial data sources synthesized into scored hunting locations. Probability, suitability, and pressure in a single decision surface\u2014so you see what others miss.",
                  detail: "10x Data \u2014 17 sources nobody else combines",
                  accent: "var(--t-green)",
                },
                {
                  tag: "Education",
                  title: "Jebbix",
                  desc: "Canvas API data transformed into engagement drift detection. Submission timing patterns and leading indicators surface disengagement before grades drop.",
                  detail: "10x Skill \u2014 leading indicators surface disengagement early",
                  accent: "var(--t-accent)",
                  href: "/",
                },
                {
                  tag: "E-Commerce",
                  title: "GunDealAlerts",
                  desc: "Reddit noise filtered into curated weekly deal digests. Price history, community signal, and market context\u2014delivered as a clear buy/skip decision.",
                  detail: "10x Niche \u2014 one job: best deal of the week",
                  accent: "var(--t-amber)",
                  href: "https://www.gundealalerts.com",
                },
                {
                  tag: "Sports Analytics",
                  title: "Sports Dashboard",
                  desc: "Three independent models (MI Bivariate Poisson, Dixon-Coles, Elo) plus xG and odds data converge on a single picks page. Framework-driven edge finding.",
                  detail: "10x Data \u2014 3 models converge on one picks page",
                  accent: "var(--t-accent-purple)",
                },
                {
                  tag: "Skill Acquisition",
                  title: "Mastery Graph",
                  desc: "Domain-agnostic knowledge graph extraction. Ingests books, podcast transcripts, and training notes to produce structured skill trees with prerequisites, diagnostic branches, and progression paths.",
                  detail: "10x Skill \u2014 36 skills extracted from books + 60 transcripts",
                  accent: "var(--t-accent-purple)",
                },
                {
                  tag: "Price Tracking",
                  title: "ToolPulse",
                  desc: 'Harbor Freight price tracker. Scrapes product prices, tracks history, and surfaces current sales\u2014so you know whether that "sale" is actually a deal or just marketing.',
                  detail: "10x Niche \u2014 price history reveals real deals from fake ones",
                  accent: "var(--t-amber)",
                  href: "https://charlesrogers.github.io/toolpulse/",
                },
                {
                  tag: "Options Trading",
                  title: "Options Edge Finder",
                  desc: "GARCH volatility forecasting versus implied volatility to find mispriced options. When the model says vol is wrong, that's the edge\u2014surfaced as a clear trade or pass decision.",
                  detail: "10x Data \u2014 GARCH forecast vs. IV = mispricing signal",
                  accent: "var(--t-accent)",
                },
              ].map((card) => {
                const Tag = card.href ? "a" : "div";
                const linkProps = card.href
                  ? card.href.startsWith("/")
                    ? { href: card.href }
                    : { href: card.href, target: "_blank", rel: "noopener" }
                  : {};
                return (
                  <Tag
                    key={card.title}
                    {...linkProps}
                    className="thesis-reveal rounded-xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg no-underline"
                    style={{
                      background: "var(--t-card-bg)",
                      border: "1px solid var(--t-card-border)",
                      borderLeft: `3px solid ${card.accent}`,
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span
                        className="px-2.5 py-1 rounded-full w-fit"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 11,
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--t-accent)",
                          background: "var(--t-tag-bg)",
                        }}
                      >
                        {card.tag}
                      </span>
                    </div>
                    <h3
                      className="font-semibold mb-2"
                      style={{ fontSize: 20, letterSpacing: "-0.3px" }}
                    >
                      {card.title}
                    </h3>
                    <p
                      className="mb-4 leading-[1.65]"
                      style={{ fontSize: 14, color: "var(--t-muted)" }}
                    >
                      {card.desc}
                    </p>
                    <div
                      className="mt-auto pt-4"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        color: "var(--t-muted)",
                        borderTop: "1px solid var(--t-card-border)",
                      }}
                    >
                      {card.detail}
                    </div>
                  </Tag>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="max-w-[1200px] mx-auto px-6">
          <hr style={{ border: "none", borderTop: "1px solid var(--t-card-border)" }} />
        </div>
        <footer className="py-24 text-center px-6">
          <div className="font-bold mb-2.5" style={{ fontSize: 20, letterSpacing: "-0.5px" }}>
            Imprevista
          </div>
          <p className="mb-7" style={{ fontSize: 15, color: "var(--t-muted)" }}>
            Better data. Faster mastery. Sharper tools.
          </p>
          <a
            href="mailto:hello@imprevista.com"
            className="no-underline hover:underline"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              color: "var(--t-accent)",
            }}
          >
            hello@imprevista.com
          </a>
          <p className="mt-14 opacity-50" style={{ fontSize: 12, color: "var(--t-muted)" }}>
            &copy; 2026 Imprevista
          </p>
        </footer>
      </div>
    </>
  );
}
