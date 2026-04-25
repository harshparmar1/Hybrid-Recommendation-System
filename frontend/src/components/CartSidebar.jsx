// src/components/CartSidebar.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductName, getCategoryLabel } from '../services/api';

export default function CartSidebar({ isOpen, onClose, cartItems, onRemove, onClear, onUpdateQty }) {
  const total = cartItems.reduce((sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-dark-800/95 backdrop-blur-xl border-l border-white/10 z-[61] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Shopping Cart</h2>
                  <p className="text-xs text-white/40">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-3">🛒</div>
                  <p className="text-white/40 text-sm font-medium">Your cart is empty</p>
                  <p className="text-white/20 text-xs mt-1">Add products to get started</p>
                </div>
              ) : (
                <AnimatePresence>
                  {cartItems.map((item, i) => (
                    <motion.div
                      key={item.product_id}
                      layout
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-dark-600/60 border border-white/8 hover:border-indigo-500/20 transition-all"
                    >
                      {/* Category emoji */}
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                        {getCategoryLabel(item.category) === 'Electronics' ? '💻' :
                         getCategoryLabel(item.category) === 'Fashion' ? '👕' :
                         getCategoryLabel(item.category) === 'Home' ? '🛋️' :
                         getCategoryLabel(item.category) === 'Sports' ? '⚽' :
                         getCategoryLabel(item.category) === 'Beauty' ? '💄' : '📦'}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{getProductName(item)}</p>
                        <p className="text-xs text-white/35">{item.brand || 'No Brand'}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-1 bg-dark-400/60 rounded-lg border border-white/10">
                            <button
                              onClick={() => onUpdateQty(item.product_id, Math.max(1, (item.qty || 1) - 1))}
                              className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white text-xs transition-colors"
                            >−</button>
                            <span className="text-xs text-white/70 font-mono w-5 text-center">{item.qty || 1}</span>
                            <button
                              onClick={() => onUpdateQty(item.product_id, (item.qty || 1) + 1)}
                              className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white text-xs transition-colors"
                            >+</button>
                          </div>
                        </div>
                      </div>

                      {/* Price & Remove */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-indigo-300">
                          ${(Number(item.price) * (item.qty || 1)).toFixed(2)}
                        </p>
                        <button
                          onClick={() => onRemove(item.product_id)}
                          className="text-[10px] text-red-400/60 hover:text-red-400 mt-1 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-white/10 p-5 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Subtotal ({itemCount} items)</span>
                  <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {/* Checkout button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full btn-primary text-sm py-3.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Checkout · ${total.toFixed(2)}
                </motion.button>

                {/* Clear cart */}
                <button
                  onClick={onClear}
                  className="w-full text-center text-xs text-white/30 hover:text-red-400 transition-colors py-1"
                >
                  Clear entire cart
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
