// src/App.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

import Navbar        from './components/Navbar';
import ProductCard   from './components/ProductCard';
import SkeletonCard  from './components/SkeletonCard';
import Loader        from './components/Loader';
import ProductModal  from './components/ProductModal';

import {
  fetchRecommendations,
  fetchSampleUsers,
  fetchMetrics,
  getProductName,
  getCategoryLabel,
  TRENDING_PRODUCTS,
  ALSO_BOUGHT,
  CATEGORIES,
} from './services/api';

const SKELETON_COUNT = 8;
const CHART_COLORS = ['#6366f1','#a855f7','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#f97316'];

// ── Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Dice: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/>
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/>
    </svg>
  ),
  Zap: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  BarChart2: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Package: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-20">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
};

// ── Count-Up Animation Hook ──────────────────────────────────────────────
function useCountUp(target, duration = 1200, decimals = 1) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || target === 0) return;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(+(target * eased).toFixed(decimals));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration, decimals]);

  return { value, ref };
}

function CountUpValue({ target, suffix = '%', decimals = 1, className = '' }) {
  const { value, ref } = useCountUp(target, 1200, decimals);
  return <span ref={ref} className={className}>{value}{suffix}</span>;
}

// ── Floating Particles ───────────────────────────────────────────────────
function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 15,
      opacity: Math.random() * 0.3 + 0.1,
      color: ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981'][Math.floor(Math.random() * 5)],
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -150 - Math.random() * 200, 0],
            x: [0, (Math.random() - 0.5) * 200, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Stat Chip ─────────────────────────────────────────────────────────────
function StatChip({ icon, label, value, color = 'indigo' }) {
  const c = {
    indigo:  'from-indigo-500/15 to-purple-500/10 border-indigo-500/20 text-indigo-300',
    emerald: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/20 text-emerald-300',
    pink:    'from-pink-500/15 to-rose-500/10 border-pink-500/20 text-pink-300',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r border ${c[color]}`}>
      <span className="opacity-70">{icon}</span>
      <span className="text-xs text-white/45">{label}</span>
      <span className="text-xs font-bold">{value}</span>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, badge }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className="tag text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 hidden sm:inline-flex">
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Mini Also-Bought Row ──────────────────────────────────────────────────
function MiniProductRow({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-dark-600/60 backdrop-blur-md border border-white/10 hover:border-indigo-500/30 transition-all duration-200 cursor-default"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0 text-lg">
        {getProductName(item).charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{getProductName(item)}</p>
        <p className="text-xs text-white/35 truncate">{item.brand} · {getCategoryLabel(item.category)}</p>
      </div>
      <span className="text-sm font-bold text-white/70 flex-shrink-0">
        ${Number(item.price).toFixed(2)}
      </span>
    </motion.div>
  );
}

// ── Custom Tooltip for Charts ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-600/95 backdrop-blur-md border border-white/15 rounded-xl p-3 shadow-2xl text-sm">
      {label && <p className="text-white/50 text-xs mb-1.5">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="font-semibold" style={{ color: entry.color || entry.fill }}>
          {entry.name}: <span className="text-white">{
            typeof entry.value === 'number'
              ? entry.value % 1 === 0 ? entry.value : entry.value.toFixed(2)
              : entry.value
          }</span>
        </p>
      ))}
    </div>
  );
}

// ── Analytics Section ─────────────────────────────────────────────────────
function AnalyticsSection({ recommendations }) {
  // Derive analytics data from current recommendations
  const hasData = recommendations.length > 0;

  // Category distribution
  const catData = useMemo(() => {
    const map = {};
    recommendations.forEach(r => {
      const label = getCategoryLabel(r.category);
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [recommendations]);

  // Price distribution buckets
  const priceData = useMemo(() => {
    const buckets = { '<$50': 0, '$50-100': 0, '$100-250': 0, '$250-500': 0, '$500-1000': 0, '>$1000': 0 };
    recommendations.forEach(r => {
      const p = Number(r.price);
      if (p < 50) buckets['<$50']++;
      else if (p < 100) buckets['$50-100']++;
      else if (p < 250) buckets['$100-250']++;
      else if (p < 500) buckets['$250-500']++;
      else if (p < 1000) buckets['$500-1000']++;
      else buckets['>$1000']++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [recommendations]);

  // Score trend (sorted by index)
  const scoreData = useMemo(() => {
    return recommendations.slice(0, 12).map((r, i) => ({
      name: `#${i + 1}`,
      score: +(Number(r.score) * 100).toFixed(2),
      price: Number(r.price),
    }));
  }, [recommendations]);

  // Top brands
  const brandData = useMemo(() => {
    const map = {};
    recommendations.forEach(r => {
      if (r.brand && r.brand !== 'no_brand') {
        map[r.brand] = (map[r.brand] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [recommendations]);

  // Summary stats
  const stats = useMemo(() => {
    if (!hasData) return null;
    const prices = recommendations.map(r => Number(r.price)).filter(Boolean);
    const scores = recommendations.map(r => Number(r.score)).filter(v => !isNaN(v));
    return {
      total:    recommendations.length,
      avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      maxScore: scores.length ? Math.max(...scores) * 100 : 0,
      categories: catData.length,
    };
  }, [recommendations, catData, hasData]);

  return (
    <section id="analytics-section" className="mt-24 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <SectionHeader
          icon={<Icons.BarChart2 />}
          title="Analytics Dashboard"
          subtitle={hasData ? `Insights from ${recommendations.length} recommendations` : 'Load recommendations to see insights'}
          badge="Live Data"
        />

        {/* Summary stat cards */}
        {hasData && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Products',   value: stats.total,                              suffix: '',    color: 'from-indigo-500/20 to-purple-500/10',  textColor: 'text-indigo-300' },
              { label: 'Avg Price',        value: `$${stats.avgPrice.toFixed(2)}`,          suffix: '',    color: 'from-cyan-500/20 to-blue-500/10',      textColor: 'text-cyan-300'   },
              { label: 'Top Score',        value: `${stats.maxScore.toFixed(1)}%`,          suffix: '',    color: 'from-emerald-500/20 to-teal-500/10',   textColor: 'text-emerald-300'},
              { label: 'Categories',       value: stats.categories,                         suffix: '',    color: 'from-pink-500/20 to-rose-500/10',      textColor: 'text-pink-300'   },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-4 rounded-2xl bg-gradient-to-br ${s.color} border border-white/10 backdrop-blur-md`}
              >
                <p className="text-white/40 text-xs mb-2">{s.label}</p>
                <p className={`text-2xl font-extrabold ${s.textColor}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Charts grid */}
        {hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category distribution bar */}
            <div className="bg-dark-600/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="value" name="Products" radius={[6, 6, 0, 0]}>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Score trend line */}
            <div className="bg-dark-600/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Match Score Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={scoreData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone" dataKey="score" name="Score %" stroke="#6366f1"
                    strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5, fill: '#a855f7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Price distribution */}
            <div className="bg-dark-600/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Price Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priceData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(16,185,129,0.08)' }} />
                  <Bar dataKey="value" name="Products" fill="#10b981" radius={[6, 6, 0, 0]}>
                    {priceData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? '#10b981' : '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Brands Pie */}
            <div className="bg-dark-600/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Top Brands</h3>
              {brandData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={brandData} dataKey="count" nameKey="name"
                        cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                        paddingAngle={3} stroke="none"
                      >
                        {brandData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    {brandData.map((b, i) => (
                      <div key={b.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-white/55 truncate">{b.name}</span>
                        <span className="text-white/35 ml-auto flex-shrink-0">{b.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-white/30 text-sm text-center py-16">No brand data</p>
              )}
            </div>
          </div>
        ) : (
          /* Empty analytics state */
          <div className="bg-dark-600/40 border border-white/8 rounded-2xl p-12 text-center">
            <Icons.BarChart2 />
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <h3 className="text-white/50 font-semibold mb-2">No Analytics Data Yet</h3>
            <p className="text-white/25 text-sm">Enter a User ID and get recommendations to see live analytics and charts.</p>
          </div>
        )}
      </motion.div>
    </section>
  );
}

// ── Recommendation System Section ─────────────────────────────────────────
function RecommendationSystemSection() {
  const steps = [
    {
      icon: '📊',
      title: 'Data Collection',
      desc: 'User interactions (view, cart, purchase) are collected and weighted (1, 3, 5) to build behavioral profiles.',
      color: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-300',
    },
    {
      icon: '🧮',
      title: 'User-Item Matrix',
      desc: 'A sparse matrix of users × products is constructed, aggregating interaction scores for each user-product pair.',
      color: 'from-indigo-500/20 to-purple-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-300',
    },
    {
      icon: '🔬',
      title: 'KMeans Clustering',
      desc: 'Users are grouped into K clusters based on interaction patterns. Similar users fall into the same cluster.',
      color: 'from-purple-500/20 to-pink-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-300',
    },
    {
      icon: '📐',
      title: 'Cosine Similarity',
      desc: 'Within each cluster, cosine similarity measures how alike two users\' interaction vectors are (0 to 1 scale).',
      color: 'from-pink-500/20 to-rose-500/10',
      border: 'border-pink-500/20',
      text: 'text-pink-300',
    },
    {
      icon: '⚡',
      title: 'Score Aggregation',
      desc: 'Products from similar users are ranked by weighted score: similarity × interaction value, summed across neighbors.',
      color: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-300',
    },
    {
      icon: '🎯',
      title: 'Diverse Selection',
      desc: 'Top-N products are selected with category diversity caps to ensure varied, high-quality recommendations.',
      color: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-300',
    },
  ];

  const features = [
    { label: 'Collaborative Filtering', desc: 'Leverages behavior of similar users', icon: '👥' },
    { label: 'KMeans Clustering', desc: 'Groups users into behavioral clusters', icon: '🔮' },
    { label: 'Cosine Similarity', desc: 'Measures vector similarity between users', icon: '📐' },
    { label: 'Diversity Control', desc: 'Limits same-category recommendations', icon: '🎨' },
    { label: 'Popularity Fallback', desc: 'Uses trending items for cold-start users', icon: '📈' },
    { label: 'Real-time API', desc: 'FastAPI backend with instant inference', icon: '⚡' },
  ];

  return (
    <section id="system-section" className="mt-24 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <SectionHeader
          icon={<Icons.Zap />}
          title="Recommendation System"
          subtitle="How our hybrid KMeans + Cosine Similarity engine works"
          badge="Architecture"
        />

        {/* System overview card */}
        <div className="bg-dark-600/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20 flex items-center justify-center text-xl">🧠</div>
            <div>
              <h3 className="text-lg font-bold text-white">Hybrid Recommendation Engine</h3>
              <p className="text-xs text-white/40">Collaborative Filtering with KMeans Clustering & Cosine Similarity</p>
            </div>
          </div>

          <p className="text-sm text-white/50 leading-relaxed mb-6">
            Our system combines <span className="text-indigo-300 font-semibold">KMeans clustering</span> to group users with similar behavior patterns, then applies <span className="text-purple-300 font-semibold">cosine similarity</span> within clusters to find the most relevant product recommendations. This hybrid approach reduces computation while maintaining high accuracy.
          </p>

          {/* Tech stack badges */}
          <div className="flex flex-wrap gap-2">
            {['Python', 'FastAPI', 'scikit-learn', 'Pandas', 'React', 'Recharts'].map(tech => (
              <span key={tech} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Pipeline Steps */}
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Processing Pipeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative p-5 rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} backdrop-blur-md`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{step.icon}</span>
                <div>
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Step {i + 1}</span>
                  <h4 className={`text-sm font-bold ${step.text}`}>{step.title}</h4>
                </div>
              </div>
              <p className="text-xs text-white/45 leading-relaxed">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-white/15 text-lg">→</div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Key Features */}
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Key Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-dark-600/60 border border-white/8 hover:border-indigo-500/25 transition-all duration-200"
            >
              <span className="text-xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs text-white/35 mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ── Evaluation Metrics Section ────────────────────────────────────────────
function EvaluationMetricsSection() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldLoad, setShouldLoad] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchMetrics(100, 10);
        setMetrics(data);
      } catch (err) {
        setError(err.message || 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    })();
  }, [shouldLoad]);

  const metricCards = metrics ? [
    { label: 'Precision@K',  raw: +(metrics.metrics.precision_at_k * 100).toFixed(1), value: (metrics.metrics.precision_at_k * 100).toFixed(1) + '%',  desc: 'Relevant items in top-K', color: 'from-indigo-500/20 to-purple-500/10', text: 'text-indigo-300', icon: '🎯' },
    { label: 'Recall@K',     raw: +(metrics.metrics.recall_at_k * 100).toFixed(1),    value: (metrics.metrics.recall_at_k * 100).toFixed(1) + '%',     desc: 'Coverage of relevant items', color: 'from-cyan-500/20 to-blue-500/10', text: 'text-cyan-300', icon: '📡' },
    { label: 'F1 Score',     raw: +(metrics.metrics.f1_score * 100).toFixed(1),       value: (metrics.metrics.f1_score * 100).toFixed(1) + '%',        desc: 'Harmonic mean of P & R', color: 'from-emerald-500/20 to-teal-500/10', text: 'text-emerald-300', icon: '⚖️' },
    { label: 'NDCG@K',       raw: +(metrics.metrics.ndcg_at_k * 100).toFixed(1),     value: (metrics.metrics.ndcg_at_k * 100).toFixed(1) + '%',      desc: 'Ranking quality measure', color: 'from-purple-500/20 to-pink-500/10', text: 'text-purple-300', icon: '📊' },
    { label: 'Hit Rate',     raw: +(metrics.metrics.hit_rate * 100).toFixed(1),       value: (metrics.metrics.hit_rate * 100).toFixed(1) + '%',       desc: 'Users with ≥1 relevant hit', color: 'from-pink-500/20 to-rose-500/10', text: 'text-pink-300', icon: '🔥' },
    { label: 'Coverage',     raw: +(metrics.metrics.coverage * 100).toFixed(1),       value: (metrics.metrics.coverage * 100).toFixed(1) + '%',       desc: 'Catalog items recommended', color: 'from-amber-500/20 to-orange-500/10', text: 'text-amber-300', icon: '🌐' },
    { label: 'MAP Score',    raw: +(metrics.metrics.map_score * 100).toFixed(2),      value: (metrics.metrics.map_score * 100).toFixed(2) + '%',      desc: 'Mean Average Precision', color: 'from-rose-500/20 to-red-500/10', text: 'text-rose-300', icon: '📈' },
  ] : [];

  const barData = metrics ? [
    { name: 'Precision', value: +(metrics.metrics.precision_at_k * 100).toFixed(1) },
    { name: 'Recall',    value: +(metrics.metrics.recall_at_k * 100).toFixed(1) },
    { name: 'F1',        value: +(metrics.metrics.f1_score * 100).toFixed(1) },
    { name: 'NDCG',      value: +(metrics.metrics.ndcg_at_k * 100).toFixed(1) },
    { name: 'Hit Rate',  value: +(metrics.metrics.hit_rate * 100).toFixed(1) },
    { name: 'Coverage',  value: +(metrics.metrics.coverage * 100).toFixed(1) },
  ] : [];

  const modelStats = metrics ? [
    { label: 'Total Users',       value: metrics.model_stats.total_users?.toLocaleString() },
    { label: 'Total Products',    value: metrics.model_stats.total_products?.toLocaleString() },
    { label: 'Interactions',      value: metrics.model_stats.total_interactions?.toLocaleString() },
    { label: 'Sparsity',          value: (metrics.model_stats.sparsity * 100).toFixed(1) + '%' },
    { label: 'Clusters (K)',      value: metrics.model_stats.n_clusters },
    { label: 'Avg Int/User',      value: metrics.model_stats.avg_interactions_per_user },
    { label: 'Avg Int/Product',   value: metrics.model_stats.avg_interactions_per_product },
    { label: 'Eval Sample',       value: metrics.config.sample_size },
  ] : [];

  return (
    <section id="metrics-section" className="mt-24 scroll-mt-24" ref={sectionRef}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <SectionHeader
          icon={<Icons.BarChart2 />}
          title="Evaluation Metrics"
          subtitle={metrics ? `Evaluated on ${metrics.config.sample_size} users with K=${metrics.config.k}` : 'Computing metrics...'}
          badge="Live Evaluation"
        />

        {loading ? (
          <div className="bg-dark-600/40 border border-white/8 rounded-2xl p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40 text-sm">Computing evaluation metrics...</p>
            <p className="text-white/20 text-xs mt-1">This may take a moment</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-6 text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        ) : metrics ? (
          <>
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {metricCards.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${m.color} border border-white/10 backdrop-blur-md`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{m.icon}</span>
                    <p className="text-white/40 text-xs font-medium">{m.label}</p>
                  </div>
                  <CountUpValue target={m.raw} suffix="%" decimals={m.label === 'MAP Score' ? 2 : 1} className={`text-2xl font-extrabold ${m.text}`} />
                  <p className="text-white/25 text-[10px] mt-1">{m.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart of Metrics */}
              <div className="bg-dark-600/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Metrics Comparison</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                    <Bar dataKey="value" name="Score %" radius={[6, 6, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Model Statistics */}
              <div className="bg-dark-600/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Model Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {modelStats.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className="p-3 rounded-xl bg-dark-500/50 border border-white/5"
                    >
                      <p className="text-white/30 text-[10px] font-medium uppercase tracking-wider">{s.label}</p>
                      <p className="text-white text-lg font-bold mt-1">{s.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Evaluation Method Info */}
            <div className="bg-dark-600/40 border border-white/8 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/50 mb-3">📋 Evaluation Methodology</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/40 leading-relaxed">
                <div>
                  <p className="text-white/60 font-semibold mb-1">Protocol</p>
                  <p>Leave-one-out evaluation on a random sample of {metrics.config.sample_size} users. For each user, recommendations are generated and compared against their actual interaction history.</p>
                </div>
                <div>
                  <p className="text-white/60 font-semibold mb-1">Metrics Explained</p>
                  <p><span className="text-indigo-300">Precision@K</span> measures how many recommended items are relevant. <span className="text-cyan-300">Recall@K</span> measures coverage. <span className="text-purple-300">NDCG</span> evaluates ranking quality considering position.</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </motion.div>
    </section>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [userId,         setUserId]         = useState('');
  const [sampleIds,      setSampleIds]      = useState([]);
  const [recommendations,setRecommendations]= useState([]);
  const [category,       setCategory]       = useState('All');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [loading,        setLoading]        = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [error,          setError]          = useState('');
  const [hasSearched,    setHasSearched]    = useState(false);

  // ── Recently Viewed ──
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recoai_recent') || '[]'); } catch { return []; }
  });

  // ── Product Modal ──
  const [modalItem, setModalItem] = useState(null);

  // ── Mouse Spotlight ──
  const heroRef = useRef(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: -1000, y: -1000 });

  const handleHeroMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // Persist recently viewed
  useEffect(() => { localStorage.setItem('recoai_recent', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);

  // ── Recently Viewed handler ──
  function openProductModal(item) {
    setModalItem(item);
    setRecentlyViewed(prev => {
      const filtered = prev.filter(r => r.product_id !== item.product_id);
      return [item, ...filtered].slice(0, 12);
    });
  }

  // Filter recommendations by category AND search query
  const filtered = useMemo(() => {
    let list = recommendations;
    if (category !== 'All') {
      list = list.filter(r => getCategoryLabel(r.category) === category);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => {
        const name  = getProductName(r).toLowerCase();
        const brand = (r.brand || '').toLowerCase();
        const cat   = getCategoryLabel(r.category).toLowerCase();
        const id    = String(r.product_id).toLowerCase();
        return name.includes(q) || brand.includes(q) || cat.includes(q) || id.includes(q);
      });
    }
    return list;
  }, [recommendations, category, searchQuery]);

  // Load sample IDs on mount
  useEffect(() => {
    (async () => {
      setLoadingSamples(true);
      try { setSampleIds(await fetchSampleUsers(12)); } catch { /* silent */ }
      finally { setLoadingSamples(false); }
    })();
  }, []);

  // On first load, auto-fetch one sample user's recommendations.
  useEffect(() => {
    if (hasSearched || loading || sampleIds.length === 0) return;
    const firstId = sampleIds[0];
    handleGetRecommendations(null, firstId);
  }, [sampleIds, hasSearched, loading]);

  async function handleGetRecommendations(e, forcedUserId = null) {
    e?.preventDefault();
    const trimmed = (forcedUserId ?? userId).trim();
    if (!trimmed) { setError('Please enter a valid User ID.'); return; }
    if (forcedUserId !== null) setUserId(trimmed);
    setError('');
    setRecommendations([]);
    setLoading(true);
    setHasSearched(true);
    try {
      const recs = await fetchRecommendations(trimmed);
      setRecommendations(recs);
      if (recs.length === 0) setError('No recommendations found for this user.');
    } catch (err) {
      setError(err.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRandomUser() {
    let ids = sampleIds;
    if (!ids.length) {
      try {
        const fetchedIds = await fetchSampleUsers(12);
        if (fetchedIds.length) {
          ids = fetchedIds;
          setSampleIds(fetchedIds);
        }
      } catch {
        setError('Unable to load sample users. Please try again.');
        return;
      }
    }

    if (!ids.length) {
      setError('No sample users available right now.');
      return;
    }

    const id = ids[Math.floor(Math.random() * ids.length)];
    setError('');
    await handleGetRecommendations(null, id);
  }
  const hasResults    = !loading && filtered.length > 0;
  const showEmpty     = hasSearched && !loading && filtered.length === 0 && !error;

  // Shared ProductCard props
  const cardProps = (item, i, badge, trending = null) => ({
    item, index: i, badge, trending,
    onOpenModal: openProductModal,
  });

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-x-hidden">
      {/* Floating Particles */}
      <FloatingParticles />

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/12 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl animate-float-delay" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-pink-500/8 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Product Detail Modal */}
      <ProductModal
        item={modalItem}
        isOpen={!!modalItem}
        onClose={() => setModalItem(null)}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">

        {/* ══ HERO with Mouse Spotlight ══════════════════════════════════ */}
        <section id="hero-section" className="scroll-mt-20">
          <motion.div
            ref={heroRef}
            onMouseMove={handleHeroMouseMove}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14 relative spotlight-container"
          >
            {/* Mouse spotlight glow */}
            <div
              className="spotlight"
              style={{ left: spotlightPos.x, top: spotlightPos.y }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-6 relative z-10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-Powered · Real-time · Hybrid KMeans + Cosine Similarity
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 relative z-10">
              <span className="text-white">Hybrid </span>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Recommendation
              </span>
              <span className="text-white"> Engine</span>
            </h1>

            {/* Typewriter subtitle */}
            <div className="max-w-xl mx-auto relative z-10">
              <p className="text-white/45 text-lg typewriter-text inline-block">
                Discover personalized products powered by machine learning.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8 relative z-10">
              <StatChip icon={<Icons.Zap />}     label="Model"   value="Hybrid KMeans"     color="indigo"  />
              <StatChip icon={<Icons.TrendUp />} label="Metric"  value="Cosine Similarity" color="emerald" />
              <StatChip icon={<Icons.Users />}   label="Source"  value="Live API"          color="pink"    />
            </div>
          </motion.div>

          {/* ══ INPUT PANEL ═════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-dark-600/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-card max-w-3xl mx-auto mb-10"
          >
            <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">
              Find Recommendations
            </p>

            <form onSubmit={handleGetRecommendations} className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <Icons.Search />
                </span>
                <input
                  id="user-id-input"
                  className="input-field pl-10 text-sm"
                  type="text"
                  value={userId}
                  onChange={e => { setUserId(e.target.value); setError(''); }}
                  placeholder="Enter User ID — e.g. 460216566"
                  aria-label="User ID"
                  autoComplete="off"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                id="get-recommendations-btn"
                disabled={loading}
                className="btn-primary whitespace-nowrap text-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading…
                  </>
                ) : 'Get Recommendations'}
              </motion.button>
            </form>

            {/* Inline search/filter for results */}
            {recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col sm:flex-row gap-3 mb-4"
              >
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                    <Icons.Search />
                  </span>
                  <input
                    id="product-search-input"
                    className="input-field pl-10 text-sm"
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, brand, category…"
                    aria-label="Search products"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  id="category-filter"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="bg-dark-500/80 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 cursor-pointer sm:w-40"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </motion.div>
            )}

            {/* Sample IDs */}
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                id="random-user-btn"
                onClick={handleRandomUser}
                disabled={loadingSamples || !sampleIds.length}
                className="btn-ghost text-sm"
              >
                <Icons.Dice />
                {loadingSamples ? 'Loading…' : 'Random User'}
              </motion.button>

              {sampleIds.slice(0, 5).map(id => (
                <button
                  key={id}
                  onClick={() => { setUserId(id); setError(''); }}
                  className="px-2.5 py-1 rounded-lg bg-dark-400/60 border border-white/8 text-white/45 text-xs font-mono hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-indigo-300 transition-all duration-200"
                >
                  {id}
                </button>
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm"
                  role="alert"
                >
                  <span className="flex-shrink-0 mt-0.5"><Icons.AlertCircle /></span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ══ RESULTS ═════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                {Array.from({ length: SKELETON_COUNT }, (_, i) => <SkeletonCard key={i} />)}
              </div>
            </motion.div>
          ) : hasResults ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Your Recommendations</h2>
                  <p className="text-white/35 text-sm mt-0.5">
                    {filtered.length} {searchQuery ? 'matching' : 'personalized'} picks for User <span className="font-mono text-indigo-300">{userId}</span>
                    {searchQuery && <span className="text-white/25"> · search: "<span className="text-white/50">{searchQuery}</span>"</span>}
                  </p>
                </div>
                <span className="tag bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 hidden sm:inline-flex">
                  {filtered.length} results
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-live="polite">
                {filtered.map((item, i) => (
                  <ProductCard key={item.product_id} {...cardProps(item, i, 'Recommended')} />
                ))}
              </div>
            </motion.div>
          ) : showEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 rounded-2xl bg-dark-400/60 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Icons.Package />
              </div>
              <h3 className="text-lg font-semibold text-white/50 mb-2">No products found</h3>
              <p className="text-white/25 text-sm">Try a different search term or remove the category filter.</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-4 btn-ghost text-sm">
                  Clear search
                </button>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ══ RECENTLY VIEWED ════════════════════════════════════════════ */}
        {recentlyViewed.length > 0 && (
          <section className="mt-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-sm">🕐</div>
                <div>
                  <h3 className="text-base font-bold text-white">Recently Viewed</h3>
                  <p className="text-[11px] text-white/30">{recentlyViewed.length} products</p>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
                {recentlyViewed.map((item, i) => (
                  <motion.div
                    key={item.product_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => openProductModal(item)}
                    className="flex-shrink-0 w-40 p-3 rounded-xl bg-dark-600/60 border border-white/8 hover:border-indigo-500/25 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="text-2xl mb-2">
                      {getCategoryLabel(item.category) === 'Electronics' ? '💻' :
                       getCategoryLabel(item.category) === 'Fashion' ? '👕' : '📦'}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{getProductName(item)}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">${Number(item.price).toFixed(2)}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* ══ RECOMMENDATION SYSTEM SECTION ═════════════════════════════ */}
        <RecommendationSystemSection />

        {/* ══ EVALUATION METRICS SECTION ════════════════════════════════ */}
        <EvaluationMetricsSection />

        {/* ══ TRENDING SECTION ════════════════════════════════════════════ */}
        <section id="trending-section" className="mt-24 scroll-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <SectionHeader
              icon={<Icons.TrendUp />}
              title="Trending Products"
              subtitle="Most popular picks across all users right now"
              badge="🔥 Hot"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRENDING_PRODUCTS.map((item, i) => (
                <ProductCard key={item.product_id} {...cardProps(item, i, 'Trending', item.trend)} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══ USERS LIKE YOU ══════════════════════════════════════════════ */}
        <section className="mt-20">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <SectionHeader
              icon={<Icons.Users />}
              title="Users Like You Also Bought"
              subtitle="Collaborative picks from similar users"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALSO_BOUGHT.map((item, i) => (
                <MiniProductRow key={item.product_id} item={item} index={i} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══ ANALYTICS SECTION ═══════════════════════════════════════════ */}
        <AnalyticsSection recommendations={recommendations} />

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-white/15 text-sm">
          RecoAI · Hybrid Recommendation Engine · React + Recharts + FastAPI
        </p>
      </footer>
    </div>
  );
}
