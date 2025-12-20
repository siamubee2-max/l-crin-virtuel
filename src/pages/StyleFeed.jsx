import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ArrowRight, Lightbulb, TrendingUp, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StyleFeed() {
  const { t } = useLanguage();
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

  // Fetch Feedback History
  const { data: feedbackHistory } = useQuery({
    queryKey: ['recommendationFeedback'],
    queryFn: () => base44.entities.RecommendationFeedback.list(),
  });

  // Fetch Wishlist for toggle status
  const { data: myWishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => base44.entities.WishlistItem.list()
  });

  const feedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.RecommendationFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendationFeedback'] });
    }
  });

  const handleFeedback = (e, item, type, feedbackType) => {
    e.preventDefault();
    if (!user) return;
    
    // Optimistic check to prevent double submission locally if needed, 
    // but React Query invalidation handles it well enough for this scale.
    feedbackMutation.mutate({
      user_id: user.id,
      item_id: item.id,
      item_type: type,
      feedback_type: feedbackType
    });
  };

  const getFeedbackStatus = (itemId) => {
    const feedback = feedbackHistory?.find(f => f.item_id === itemId);
    return feedback ? feedback.feedback_type : null;
  };

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

  // 3. Generate AI Daily Tip
  useEffect(() => {
    const generateTip = async () => {
      if (!user) return;
      
      const prefs = user.style_preferences || {};
      const colors = prefs.favorite_colors?.join(", ") || "neutrals";
      const occasions = prefs.frequent_occasions?.join(", ") || "everyday life";
      const types = prefs.favorite_jewelry_types?.join(", ") || "jewelry";
      
      const aesthetics = prefs.aesthetics?.join(", ") || "general";
      const styleType = prefs.jewelry_preference_type || "balanced";
      const metals = prefs.preferred_metals?.join(", ") || "any metal";

      const prompt = `
        You are a high-end fashion editor.
        User Profile:
        - Favorite Colors: ${colors}
        - Occasions: ${occasions}
        - Loves: ${types}
        - Aesthetics: ${aesthetics}
        - Preference: ${styleType}
        - Metals: ${metals}
        - Bio: ${user.bio || "Fashion enthusiast"}

        Generate a short, inspiring "Daily Style Tip" (max 2 sentences) and a "Trend Alert" (1 sentence) relevant to this user's specific aesthetics and style.
        Format as JSON: { "tip": "...", "trend": "..." }
      `;

      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          response_json_schema: {
            type: "object",
            properties: {
              tip: { type: "string" },
              trend: { type: "string" }
            }
          }
        });
        setDailyTip(response);
      } catch (err) {
        console.error("Tip generation failed", err);
        setDailyTip({
          tip: "Elegance is the only beauty that never fades.",
          trend: "Gold layering is back in season."
        });
      } finally {
        setTipLoading(false);
      }
    };

    generateTip();
  }, [user]);

  // Advanced Recommendation Logic
  const calculateScore = (item, type) => {
    if (!user) return 0;
    const prefs = user.style_preferences || {};
    let score = 0;

    // 1. History Filter (Disliked items get negative score)
    const feedback = feedbackHistory?.find(f => f.item_id === item.id);
    if (feedback?.feedback_type === 'dislike') return -100;
    if (feedback?.feedback_type === 'like') score += 5; // Boost liked items slightly so they stay? Or maybe hide them? Let's keep them but lower priority if we want discovery? No, usually you want to see what you liked or similar. Let's just not filter them out.

    // 2. Wishlist Boost
    if (isWishlisted(item.id)) score += 10;

    // 3. Jewelry Specific Scoring
    if (type === 'jewelry') {
      const favTypes = prefs.favorite_jewelry_types || [];
      const prefMetals = prefs.preferred_metals || [];
      const aesthetics = prefs.aesthetics || [];
      const prefGemCuts = prefs.preferred_gemstone_cuts || [];
      
      // Type Match
      if (favTypes.length > 0) {
        const typeMatch = favTypes.some(t => 
          t.toLowerCase().includes(item.type) || 
          (item.type === 'necklace' && t.includes('Colliers')) ||
          (item.type === 'earrings' && t.includes('Boucles')) ||
          (item.type === 'ring' && t.includes('Bagues')) ||
          (item.type === 'bracelet' && t.includes('Bracelets'))
        );
        if (typeMatch) score += 5;
      }

      // Metal Match
      if (prefMetals.length > 0 && item.metal_type) {
         if (prefMetals.includes(item.metal_type)) score += 5;
      }

      // Aesthetic/Tags Match
      if (aesthetics.length > 0 && item.tags) {
         const tagMatches = item.tags.filter(tag => aesthetics.some(a => tag.toLowerCase().includes(a.toLowerCase()))).length;
         score += tagMatches * 2;
      }

      // Gemstone Cut Match (Loose string matching)
      if (prefGemCuts.length > 0 && item.description) {
         if (prefGemCuts.some(cut => item.description.toLowerCase().includes(cut.toLowerCase()))) score += 3;
      }
    }

    // 4. Clothing Specific Scoring
    if (type === 'clothing') {
       const favColors = prefs.favorite_colors || [];
       const aesthetics = prefs.aesthetics || [];
       
       // Color Match
       if (favColors.length > 0 && item.color) {
          if (favColors.some(c => item.color.toLowerCase().includes(c.toLowerCase()))) score += 5;
       }
       
       // Aesthetic Match (via Description or Type)
       if (aesthetics.length > 0) {
          if (aesthetics.some(a => item.description?.toLowerCase().includes(a.toLowerCase()))) score += 3;
       }
    }

    return score;
  };

  const getRecommendedJewelry = () => {
    if (!jewelryItems || !user) return [];
    return jewelryItems
      .map(item => ({ ...item, score: calculateScore(item, 'jewelry') }))
      .filter(item => item.score > -50) // Filter out disliked
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  };

  const getRecommendedClothing = () => {
    if (!clothingItems || !user) return [];
    return clothingItems
      .map(item => ({ ...item, score: calculateScore(item, 'clothing') }))
      .filter(item => item.score > -50)
      .sort((a, b) => b.score - a.score)
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
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-400 hover:text-red-500 transition-colors shadow-sm"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted(item.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                  
                  {/* Feedback Actions */}
                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => handleFeedback(e, item, 'jewelry', 'dislike')}
                        className={`p-2 rounded-full shadow-sm transition-colors ${getFeedbackStatus(item.id) === 'dislike' ? 'bg-red-100 text-red-500' : 'bg-white/90 text-neutral-400 hover:bg-white hover:text-red-500'}`}
                     >
                        <ThumbsDown className="w-3 h-3" />
                     </button>
                     <button 
                        onClick={(e) => handleFeedback(e, item, 'jewelry', 'like')}
                        className={`p-2 rounded-full shadow-sm transition-colors ${getFeedbackStatus(item.id) === 'like' ? 'bg-green-100 text-green-500' : 'bg-white/90 text-neutral-400 hover:bg-white hover:text-green-500'}`}
                     >
                        <ThumbsUp className="w-3 h-3" />
                     </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-neutral-900 truncate flex-1">{item.name}</h3>
                    {item.score > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 whitespace-nowrap ml-2">Match {(item.score/20 * 100).toFixed(0)}%</span>}
                  </div>
                  <p className="text-xs text-neutral-500 capitalize mb-3">{item.type}</p>
                  <Link to={createPageUrl("Studio")}>
                    <Button size="sm" className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
                      {t.feed.viewItem}
                    </Button>
                  </Link>
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
                   {/* Feedback Actions */}
                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => handleFeedback(e, item, 'clothing', 'dislike')}
                        className={`p-2 rounded-full shadow-sm transition-colors ${getFeedbackStatus(item.id) === 'dislike' ? 'bg-red-100 text-red-500' : 'bg-white/90 text-neutral-400 hover:bg-white hover:text-red-500'}`}
                     >
                        <ThumbsDown className="w-3 h-3" />
                     </button>
                     <button 
                        onClick={(e) => handleFeedback(e, item, 'clothing', 'like')}
                        className={`p-2 rounded-full shadow-sm transition-colors ${getFeedbackStatus(item.id) === 'like' ? 'bg-green-100 text-green-500' : 'bg-white/90 text-neutral-400 hover:bg-white hover:text-green-500'}`}
                     >
                        <ThumbsUp className="w-3 h-3" />
                     </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                     <h3 className="font-medium text-neutral-900 truncate flex-1">{item.name}</h3>
                     {item.score > 0 && <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded whitespace-nowrap ml-2">Match</span>}
                  </div>
                  <p className="text-xs text-neutral-500 capitalize mb-3">{item.type} • {item.color}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Suggérer un look
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}