import React from 'react';
import { Percent, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale'; // Import locales if needed, defaulting to generic for now

export default function SalesBadge({ price, salePrice, endDate, className }) {
  if (!salePrice || !price || salePrice >= price) return null;

  const discount = Math.round(((price - salePrice) / price) * 100);
  const isEndingSoon = endDate && new Date(endDate) < new Date(Date.now() + 86400000 * 3); // 3 days

  return (
    <div className={`absolute top-2 left-2 flex flex-col gap-1 items-start ${className}`}>
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
        <Percent className="w-3 h-3" />
        -{discount}%
      </span>
      {isEndingSoon && (
        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
          <Clock className="w-3 h-3" />
          Ending soon
        </span>
      )}
    </div>
  );
}