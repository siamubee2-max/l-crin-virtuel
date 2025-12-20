import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ArrowRight, Lightbulb, TrendingUp, Heart, User } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ForYouSection from '@/components/feed/ForYouSection';

export default function StyleFeed() {
  const { t, preferences, setPreference } = useLanguage();
  const queryClient = useQueryClient();
  const [dailyTip, setDailyTip] = useState(null);
  const [tipLoading, setTipLoading] = useState(true);

  // 1. Fetch User Data & Preferences
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // 2. Fetch Items for recommendations
  const { data: jewelryItems, isLoading: jewelryLoading } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const { data: clothingItems, isLoading: clothingLoading } = useQuery({
    queryKey: ['clothingItems'],
    queryFn: () => base44.entities.ClothingItem.list(),
  });

  // Fetch Wishlist for toggle status
  const { data: myWishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => base44.entities.WishlistItem.list()
  });

  const toggleWishlist = async (e, itemId) => {
    e.preventDefault(); 
    e.stopPropagation();
    const existing = myWishlist?.find(w => w.jewelry_item_id === itemId);
    
    if (existing) {
      await base44.entities.WishlistItem.delete(existing.id);
    } else {
      await base44.entities.WishlistItem.create({ jewelry_item_id: itemId });
    }
    queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
  };

  const isWishlisted = (itemId) => myWishlist?.some(w => w.jewelry_item_id === itemId);

  // 3. Generate AI Daily Tip with Caching
  useEffect(() => {
    const generateTip = async () => {
      const today = new Date().toDateString();
      const cached = preferences.daily_tip;

      // Use cache if valid and matches today (and user matches if logged in, but simple date check is fine for feed)
      if (cached && cached.date === today && cached.content) {
        setDailyTip(cached.content);
        setTipLoading(false);
        return;
      }

      // Determine context (User or Local)
      const context = user?.style_preferences || preferences.style_context || {
        favorite_colors: ["Classic"],
        aesthetics: ["Timeless"],
        jewelry_preference_type: "Elegant"
      };

      const prompt = `
        You are a high-end fashion editor.
        User Profile:
        - Colors: ${context.favorite_colors?.join(", ") || "neutral"}
        - Aesthetics: ${context.aesthetics?.join(", ") || "chic"}
        - Vibe: ${context.jewelry_preference_type || "balanced"}

        1. Generate a "Daily Style Tip" (max 2 sentences).
        2. Generate a "Trend Alert" (1 sentence).
        3. Suggest 3 specific visual keywords/attributes for items to wear (e.g. "gold hoop", "red silk", "chunky silver").

        Format as JSON: { 
          "tip": "...", 
          "trend": "...",
          "keywords": ["...", "...", "..."]
        }
      `;

      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          response_json_schema: {
            type: "object",
            properties: {
              tip: { type: "string" },
              trend: { type: "string" },
              keywords: { type: "array", items: { type: "string" } }
            }
          }
        });
        
        if (response) {
          setDailyTip(response);
          setPreference('daily_tip', { date: today, content: response });
        }
      } catch (err) {
        console.error("Tip generation failed", err);
        setDailyTip({
          tip: "Elegance is the only beauty that never fades.",
          trend: "Gold layering is back in season.",
          keywords: ["gold", "classic", "minimalist"]
        });
      } finally {
        setTipLoading(false);
      }
    };

    generateTip();
  }, [user, preferences.daily_tip?.date]);

  // Recommendation Logic
  const scoreItem = (item) => {
    let score = 0;
    const text = `${item.name} ${item.description || ''} ${item.tags?.join(" ") || ''} ${item.material || ''} ${item.color || ''}`.toLowerCase();
    
    // Keyword match from AI
    dailyTip?.keywords?.forEach(k => {
      if (text.includes(k.toLowerCase())) score += 3;
    });

    // User preference match (if logged in)
    if (user?.style_preferences) {
      const prefs = user.style_preferences;
      if (prefs.favorite_colors?.some(c => text.includes(c.toLowerCase()))) score += 1;
      if (item.type && prefs.favorite_jewelry_types?.some(t => t.toLowerCase().includes(item.type))) score += 2;
    }

    // Affiliate Boost
    if (item.affiliate_link) score += 5;

    return score;
  };

  const getRecommendedJewelry = () => {
    if (!jewelryItems) return [];
    return [...jewelryItems]
      .map(item => ({ item, score: scoreItem(item) }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.item)
      .slice(0, 4);
  };

  const getRecommendedClothing = () => {
    if (!clothingItems) return [];
    return [...clothingItems]
      .map(item => ({ item, score: scoreItem(item) }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.item)
      .slice(0, 4);
  };

  const recommendedJewelry = getRecommendedJewelry();
  const recommendedClothing = getRecommendedClothing();

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif text-neutral-900">{t.feed.title}</h1>
        <p className="text-neutral-500 max-w-2xl mx-auto">{t.feed.subtitle}</p>
      </div>

      {/* User Style Profile Summary */}
      {user?.style_preferences && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-medium">Welcome back, {user.full_name?.split(' ')[0] || 'Stylist'}</p>
              <p className="text-neutral-400 text-sm">
                {user.style_preferences.aesthetics?.slice(0, 2).join(' • ') || 'Classic'} style
                {user.style_preferences.preferred_metals?.length > 0 && ` • ${user.style_preferences.preferred_metals[0]} lover`}
              </p>
            </div>
          </div>
          <Link to={createPageUrl("Profile")}>
            <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white">
              Edit Style
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Hero: AI Daily Tip */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-8 md:p-12 relative overflow-hidden border border-amber-100"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-amber-600 mb-4 font-medium tracking-wide text-sm uppercase">
            <Lightbulb className="w-4 h-4" />
            {t.feed.dailyTip}
          </div>
          
          {tipLoading ? (
             <div className="flex items-center gap-2 text-neutral-500 italic">
               <Loader2 className="w-4 h-4 animate-spin" /> {t.feed.loadingTip}
             </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl md:text-4xl font-serif text-neutral-800 leading-tight">
                "{dailyTip?.tip}"
              </h2>
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-neutral-700 border border-white">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{t.feed.trendAlert}:</span> {dailyTip?.trend}
              </div>
            </div>
          )}
        </div>
        <Sparkles className="absolute top-10 right-10 text-amber-200 w-32 h-32 opacity-20" />
      </motion.div>

      {/* FOR YOU SECTION - Personalized Recommendations */}
      <ForYouSection user={user} />

      {/* Recommended Jewelry */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-neutral-900">{t.feed.recommendedJewelry}</h2>
          <Link to={createPageUrl("JewelryBox")}>
            <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
              Voir tout <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {jewelryLoading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-neutral-300" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedJewelry.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white rounded-xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button
                    onClick={(e) => toggleWishlist(e, item.id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-400 hover:text-red-500 transition-colors shadow-sm z-10"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted(item.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                  {item.affiliate_link && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                       <a 
                          href={item.affiliate_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" className="w-full bg-white text-neutral-900 hover:bg-neutral-100 font-medium">
                            Shop Now
                          </Button>
                        </a>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-neutral-900 truncate">{item.name}</h3>
                  <p className="text-xs text-neutral-500 capitalize mb-3">{item.type}</p>
                  {!item.affiliate_link ? (
                    <Link to={createPageUrl("Studio")}>
                      <Button size="sm" className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
                        {t.feed.viewItem}
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex gap-2">
                       <Link to={createPageUrl("Studio")} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">Try On</Button>
                       </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Clothing */}
      <section className="space-y-6">
        <h2 className="text-2xl font-serif text-neutral-900">{t.feed.recommendedClothing}</h2>
        
        {clothingLoading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-neutral-300" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {recommendedClothing.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="group bg-white rounded-xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[3/4] bg-neutral-50 relative overflow-hidden">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs">
                      {item.brand || "Brand"}
                    </Badge>
                  </div>
                  {item.affiliate_link && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={item.affiliate_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full block"
                      >
                         <Button size="sm" className="w-full bg-white text-neutral-900 hover:bg-neutral-100 font-medium">
                            Buy Now
                         </Button>
                      </a>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-neutral-900 truncate">{item.name}</h3>
                  <p className="text-xs text-neutral-500 capitalize mb-3">{item.type} • {item.color}</p>
                  {!item.affiliate_link && (
                    <Button variant="outline" size="sm" className="w-full">
                      Suggérer un look
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}