// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Dashboard', sectionId: 'hero-section'          },
  { label: 'System',    sectionId: 'system-section'        },
  { label: 'Metrics',   sectionId: 'metrics-section'       },
  { label: 'Trending',  sectionId: 'trending-section'      },
  { label: 'Analytics', sectionId: 'analytics-section'     },
];

export default function Navbar() {
  const [scrolled,       setScrolled]       = useState(false);
  const [activeItem,     setActiveItem]     = useState('Dashboard');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      // Scroll progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (window.scrollY / docHeight) : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollToSection(sectionId, label) {
    setActiveItem(label);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <>
      {/* Scroll Progress Bar */}
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-[3px] inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-dark-800/80 backdrop-blur-xl border-b border-white/10 shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ── Logo ── */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                  </svg>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-800 animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-white text-lg leading-none">RecoAI</span>
                <p className="text-white/35 text-[10px] leading-none mt-0.5">Hybrid Recommendation Engine</p>
              </div>
            </div>

            {/* ── Center Navigation ── */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(({ label, sectionId }) => (
                <button
                  key={label}
                  onClick={() => scrollToSection(sectionId, label)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeItem === label
                      ? 'text-white bg-indigo-500/15 border border-indigo-500/25'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {label}
                  {activeItem === label && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-x-3 -bottom-px h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* ── Right Side ── */}
            <div className="hidden sm:flex items-center">
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/45 text-xs font-medium">
                Personalization Active
              </span>
            </div>

          </div>
        </div>

        {/* ── Mobile nav (bottom strip) ── */}
        <div className="flex md:hidden items-center justify-around px-4 pb-2 border-t border-white/5 mt-1">
          {NAV_ITEMS.map(({ label, sectionId }) => (
            <button
              key={label}
              onClick={() => scrollToSection(sectionId, label)}
              className={`text-xs font-medium py-1 px-3 rounded-lg transition-all duration-200
                ${activeItem === label ? 'text-indigo-300 bg-indigo-500/10' : 'text-white/45 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.header>
    </>
  );
}
