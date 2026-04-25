// src/components/SkeletonCard.jsx
import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-dark-600/60 border border-white/10">
      {/* Image area */}
      <div className="skeleton h-44 w-full rounded-none" />

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Product name */}
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-3/4 rounded-lg" />
          <div className="skeleton h-3 w-1/3 rounded-lg" />
        </div>

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="skeleton w-6 h-6 rounded-md" />
          <div className="skeleton h-3 w-24 rounded-lg" />
        </div>

        <div className="border-t border-white/5" />

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 w-8 rounded-lg" />
          <div className="skeleton h-6 w-20 rounded-lg" />
        </div>

        {/* Score bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="skeleton h-3 w-16 rounded-lg" />
            <div className="skeleton h-3 w-10 rounded-lg" />
          </div>
          <div className="skeleton h-1 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
