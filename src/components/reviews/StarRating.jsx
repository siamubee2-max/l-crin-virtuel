import React from 'react';
import { Star } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function StarRating({ rating, max = 5, size = 16, onRate, readonly = false, className }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const value = i + 1;
        const isFilled = value <= rating;
        
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onRate && onRate(value)}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
          >
            <Star 
              size={size} 
              className={cn(
                isFilled ? "fill-amber-400 text-amber-400" : "fill-neutral-100 text-neutral-300"
              )} 
            />
          </button>
        );
      })}
    </div>
  );
}