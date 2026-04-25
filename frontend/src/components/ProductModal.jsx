// src/components/ProductModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductName, getCategoryLabel } from '../services/api';

const CATEGORY_EMOJI = {
  Electronics: '💻', Fashion: '👕', Home: '🛋️', Appliances: '🍳',
  Sports: '⚽', Kids: '🧸', Beauty: '💄', Accessories: '⌚',
  Auto: '🚗', Health: '💊', Garden: '🌿', Food: '🍕', Pets: '🐾',
};

export default function ProductModal({ item, isOpen, onClose }) {
  if (!item) return null;

  const name = getProductName(item);
  const catLabel = getCategoryLabel(item.category);
  const emoji = CATEGORY_EMOJI[catLabel] || '📦';
  const parts = (item.category || '').split('.');
  const price = Number(item.price);
  const score = item.score !== undefined ? (Number(item.score) * 100) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[71] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-dark-700/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Product Header / Hero */}
              <div className="relative h-56 bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-pink-600/10 flex items-center justify-center overflow-hidden">
                {/* Floating particles in modal header */}
                <div className="absolute w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl -top-10 -left-10 animate-float" />
                <div className="absolute w-24 h-24 rounded-full bg-purple-500/10 blur-2xl -bottom-8 -right-8 animate-float-delay" />

                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="text-7xl drop-shadow-2xl select-none"
                >
                  {emoji}
                </motion.span>

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold backdrop-blur-sm">
                    {catLabel}
                  </span>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
                >
                  ✕
                </button>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-700/95 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Content */}
              <div className="p-6 -mt-8 relative z-10">
                {/* Name */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-extrabold text-white mb-1"
                >
                  {name}
                </motion.h2>

                <p className="text-white/40 text-xs font-mono mb-4">Product ID: {item.product_id}</p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-dark-600/60 border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Brand</p>
                    <p className="text-sm text-white font-bold mt-0.5">
                      {item.brand && item.brand !== 'no_brand' ? item.brand : 'Unbranded'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-600/60 border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Category</p>
                    <p className="text-sm text-white font-bold mt-0.5">{parts.join(' → ')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-600/60 border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Price</p>
                    <p className="text-sm font-bold mt-0.5 bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">
                      ${price.toFixed(2)}
                    </p>
                  </div>
                  {score !== null && (
                    <div className="p-3 rounded-xl bg-dark-600/60 border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Match Score</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-sm font-bold ${score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-indigo-400' : 'text-amber-400'}`}>
                          {score.toFixed(1)}%
                        </p>
                        <div className="flex-1 h-1.5 bg-dark-400 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-dark-600/60 border border-white/5 text-center">
                  <p className="text-xs text-white/40">Product details preview</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
