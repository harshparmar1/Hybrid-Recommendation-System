// src/components/ProductCard.jsx
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getProductName, getCategoryLabel, getProductImage } from '../services/api';

const CATEGORY_STYLES = {
  Electronics:  { bg: 'bg-indigo-500/15',  text: 'text-indigo-300',  dot: 'bg-indigo-400',  border: 'border-indigo-500/20'  },
  Fashion:      { bg: 'bg-pink-500/15',    text: 'text-pink-300',    dot: 'bg-pink-400',    border: 'border-pink-500/20'    },
  Home:         { bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    dot: 'bg-cyan-400',    border: 'border-cyan-500/20'    },
  Appliances:   { bg: 'bg-blue-500/15',    text: 'text-blue-300',    dot: 'bg-blue-400',    border: 'border-blue-500/20'    },
  Sports:       { bg: 'bg-emerald-500/15', text: 'text-emerald-300', dot: 'bg-emerald-400', border: 'border-emerald-500/20' },
  Kids:         { bg: 'bg-yellow-500/15',  text: 'text-yellow-300',  dot: 'bg-yellow-400',  border: 'border-yellow-500/20'  },
  Beauty:       { bg: 'bg-rose-500/15',    text: 'text-rose-300',    dot: 'bg-rose-400',    border: 'border-rose-500/20'    },
  Accessories:  { bg: 'bg-orange-500/15',  text: 'text-orange-300',  dot: 'bg-orange-400',  border: 'border-orange-500/20'  },
  Auto:         { bg: 'bg-red-500/15',     text: 'text-red-300',     dot: 'bg-red-400',     border: 'border-red-500/20'     },
  Health:       { bg: 'bg-teal-500/15',    text: 'text-teal-300',    dot: 'bg-teal-400',    border: 'border-teal-500/20'    },
  default:      { bg: 'bg-gray-500/15',    text: 'text-gray-300',    dot: 'bg-gray-400',    border: 'border-gray-500/20'    },
};

const SCORE_STYLES = {
  high:    { bar: 'from-emerald-500 to-teal-400',   text: 'text-emerald-400' },
  mid:     { bar: 'from-indigo-500 to-purple-400',  text: 'text-indigo-400'  },
  low:     { bar: 'from-amber-500 to-orange-400',   text: 'text-amber-400'   },
  default: { bar: 'from-gray-600 to-gray-500',      text: 'text-gray-400'    },
};

const CATEGORY_EMOJI = {
  Electronics: '💻', Fashion: '👕', Home: '🛋️', Appliances: '🍳',
  Sports: '⚽', Kids: '🧸', Beauty: '💄', Accessories: '⌚',
  Auto: '🚗', Health: '💊', Garden: '🌿', Food: '🍕', Pets: '🐾',
};

function formatPrice(price) {
  const v = Number(price);
  if (Number.isNaN(v)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);
}

function getScoreInfo(raw) {
  const n = Number(raw);
  if (Number.isNaN(n)) return { pct: 0, label: 'N/A', tier: 'default' };
  const clamped = Math.min(1, Math.max(0, n));
  return {
    pct: clamped * 100,
    label: n.toFixed(3),
    tier: clamped >= 0.7 ? 'high' : clamped >= 0.4 ? 'mid' : 'low',
  };
}

export default function ProductCard({
  item, index, badge = 'Recommended', trending = null,
  onOpenModal
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const productName = getProductName(item);
  const catLabel    = getCategoryLabel(item.category);
  const catStyle    = CATEGORY_STYLES[catLabel] || CATEGORY_STYLES.default;
  const imgSrc      = getProductImage(item);
  const hasImage    = imgSrc !== null;
  const score       = item.score !== undefined ? getScoreInfo(item.score) : null;
  const scoreStyle  = score ? SCORE_STYLES[score.tier] : null;

  // Fallback gradient when image fails / unavailable
  const fallbackGradients = [
    'from-indigo-600/30 via-purple-600/20 to-dark-600/80',
    'from-pink-600/30 via-rose-500/20 to-dark-600/80',
    'from-cyan-600/30 via-blue-600/20 to-dark-600/80',
    'from-amber-600/30 via-orange-500/20 to-dark-600/80',
    'from-emerald-600/30 via-teal-500/20 to-dark-600/80',
  ];
  const fallbackGrad = fallbackGradients[index % fallbackGradients.length];

  // 3D Tilt effect
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpenModal?.(item)}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-dark-600/60 backdrop-blur-md border border-white/10 shadow-card hover:shadow-card-hover hover:border-indigo-500/30 transition-all duration-300 cursor-pointer gradient-border"
    >
      {/* ── Product Image / No Photo Placeholder ── */}
      <div className="relative h-44 overflow-hidden">
        {(!hasImage || imgError) && (
          <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGrad} flex flex-col items-center justify-center gap-2`}>
            <span className="text-4xl select-none drop-shadow-lg">
              {CATEGORY_EMOJI[catLabel] || '📦'}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-[10px] text-white/30 font-medium tracking-wide uppercase">No Photo</span>
            </div>
          </div>
        )}

        {hasImage && !imgError && (
          <>
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={imgSrc}
              alt={productName}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-dark-700/90 via-dark-700/20 to-transparent pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className={`tag text-[11px] ${catStyle.bg} ${catStyle.text} border ${catStyle.border} flex items-center gap-1.5 backdrop-blur-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
            {catLabel}
          </span>
          <span className="tag text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-sm whitespace-nowrap">
            ✦ {badge}
          </span>
        </div>

        {/* Trending badge */}
        {trending && (
          <div className="absolute bottom-3 right-3">
            <span className="tag text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
              📈 {trending}
            </span>
          </div>
        )}

      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-1 group-hover:text-indigo-300 transition-colors duration-200">
            {productName}
          </h3>
          <p className="text-white/35 text-xs font-mono mt-0.5">ID: {item.product_id}</p>
        </div>

        {/* Brand row */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-indigo-300">
              {(item.brand || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-white/55 truncate" title={item.brand}>
            {item.brand && item.brand !== 'no_brand' ? item.brand : 'No Brand'}
          </span>
        </div>

        <div className="border-t border-white/5" />

        {/* Price */}
        <div>
          <div>
            <span className="text-white/40 text-xs block">Price</span>
            <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">
              {formatPrice(item.price)}
            </span>
          </div>
        </div>

        {/* Score bar */}
        {score && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/35">Match Score</span>
              <span className={`text-xs font-mono font-semibold ${scoreStyle.text}`}>
                {score.pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-1 bg-dark-300 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${scoreStyle.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${score.pct}%` }}
                transition={{ duration: 0.7, delay: index * 0.05 + 0.2, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}
