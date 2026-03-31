"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroSection } from "../components/landing/HeroSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { OpenSourceSection } from "../components/landing/OpenSourceSection";
import { PlaygroundCtaSection } from "../components/landing/PlaygroundCtaSection";
import { ProblemSection } from "../components/landing/ProblemSection";
import { SiteFooter } from "../components/landing/SiteFooter";
import { StoryModeSection } from "../components/landing/StoryModeSection";
import { TerminalDemo } from "../components/landing/TerminalDemo";

const playgroundUrl = "https://agentura-playground.vercel.app";
const githubUrl = "https://github.com/SyntheticSynaptic/agentura";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-root">
      <nav className={`site-nav ${scrolled ? "site-nav-scrolled" : ""}`}>
        <div className="site-nav-inner">
          <p className="brand">agentura</p>
          <div className="site-nav-links">
            <a href="#how-it-works">How It Works</a>
            <Link href="/docs">Docs</Link>
            <a href={playgroundUrl} target="_blank" rel="noreferrer">
              Playground
            </a>
          </div>
          <div className="site-nav-actions">
            <a href={githubUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a className="star-button" href={githubUrl} target="_blank" rel="noreferrer">
              ★ Star
            </a>
          </div>
        </div>
      </nav>

      <main className="page-wrap">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <PlaygroundCtaSection />
        <TerminalDemo />
        <StoryModeSection />
        <OpenSourceSection />
        <SiteFooter />
      </main>

      <style jsx>{`
        .landing-root {
          background:
            radial-gradient(1200px 540px at 50% -10%, rgba(59, 130, 246, 0.16), transparent 58%),
            radial-gradient(900px 420px at 78% 6%, rgba(20, 184, 166, 0.1), transparent 56%),
            var(--bg);
          color: var(--text);
        }

        .site-nav {
          position: sticky;
          inset: 0 0 auto 0;
          z-index: 50;
          background: rgba(8, 13, 26, 0.92);
          transition: border-color 180ms ease, backdrop-filter 180ms ease, background 180ms ease;
        }

        .site-nav-scrolled {
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(8px);
        }

        .site-nav-inner {
          margin: 0 auto;
          display: flex;
          max-width: 1240px;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          padding: 18px 32px;
        }

        .brand {
          margin: 0;
          font-family: var(--display);
          font-size: 21px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--text);
        }

        .site-nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .site-nav-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .site-nav-links :global(a),
        .site-nav-actions a {
          font-family: var(--body);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
        }

        .site-nav-links :global(a:hover),
        .site-nav-actions a:hover {
          color: var(--text);
        }

        .star-button {
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 9px 14px;
          font-size: 13px;
          color: var(--text) !important;
        }

        .page-wrap {
          margin: 0 auto;
          max-width: 1240px;
          padding: 0 32px 88px;
        }

        @media (max-width: 768px) {
          .site-nav-inner,
          .page-wrap {
            padding-left: 18px;
            padding-right: 18px;
          }

          .site-nav-inner {
            flex-wrap: wrap;
            padding-top: 16px;
            padding-bottom: 16px;
            gap: 12px;
          }

          .site-nav-links {
            order: 3;
            width: 100%;
            justify-content: center;
            gap: 16px;
          }

          .site-nav-actions {
            margin-left: auto;
          }
        }
      `}</style>
    </div>
  );
}
