import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel = "vs mois dernier",
  color = "purple",
  prefix = "",
  suffix = ""
}) {
  const colorClasses = {
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    pink: "bg-pink-100 text-pink-600",
    red: "bg-red-100 text-red-600"
  };

  const getTrendIcon = () => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (change > 0) return "text-green-600 bg-green-50";
    if (change < 0) return "text-red-600 bg-red-50";
    return "text-neutral-500 bg-neutral-50";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="text-sm text-neutral-500 mb-1">{title}</p>
              <p className="text-2xl font-bold">
                {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
              </p>
            </div>
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        {changeLabel && change !== undefined && (
          <p className="text-xs text-neutral-400 mt-3">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}