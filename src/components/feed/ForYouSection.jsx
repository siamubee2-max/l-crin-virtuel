import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, Sparkles, ShoppingBag, Eye, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ForYouSection({ user }) {
  const queryClient = useQueryClient();

  // Fetch all data needed for personalization
  const { data: jewelryItems, isLoading: jewelryLoading } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const { data: clothingItems, isLoading: clothingLoading } = useQuery({
    queryKey: ['clothingItems'],
    queryFn: () => base44.entities.ClothingItem.list(),
  });

  // User's order history for purchase-based recommendations
  const { data: orders } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => base44.entities.Order.list(),
    enabled: !!user
  });

  // User's wishlist for interest signals
  const { data: wishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => base44.entities.WishlistItem.list(),
  });

  // User's creations for browsing history
  const { data: creations } = useQuery({
    queryKey: ['myCreations'],
    queryFn: () => base44.entities.Creation.list('-created_date', 20),
    enabled: !!user
  });

  const toggleWishlist = async (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    const existing = wishlist?.find(w => w.jewelry_item_id === itemId);
    if (existing) {
      await base44.entities.WishlistItem.delete(existing.id);
    } else {
      await base44.entities.WishlistItem.create({ jewelry_item_id: itemId });
    }
    queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
  };

  const isWishlisted = (itemId) => wishlist?.some(w => w.jewelry_item_id === itemId);

  // Advanced scoring algorithm
  const scoreJewelryItem = (item) => {
    let score = 0;
    const prefs = user?.style_preferences || {};
    const text = `${item.name} ${item.description || ''} ${item.tags?.join(' ') || ''} ${item.material || ''} ${item.metal_type || ''} ${item.gemstone_type || ''}`.toLowerCase();

    // 1. Direct preference matches (high weight)
    if (prefs.preferred_metals?.some(m => text.includes(m.toLowerCase()))) score += 15;
    if (prefs.favorite_colors?.some(c => text.includes(c.toLowerCase()))) score += 10;
    if (prefs.favorite_jewelry_types?.some(t => item.type?.toLowerCase().includes(t.toLowerCase()))) score += 12;
    if (prefs.aesthetics?.some(a => text.includes(a.toLowerCase()))) score += 8;

    // 2. Purchase history signals
    const purchasedTypes = orders?.map(o => {
      const purchased = jewelryItems?.find(j => j.id === o.item_id);
      return purchased?.type;
    }).filter(Boolean) || [];
    if (purchasedTypes.includes(item.type)) score += 20;

    // 3. Wishlist similarity
    const wishlistTypes = wishlist?.map(w => {
      const wished = jewelryItems?.find(j => j.id === w.jewelry_item_id);
      return wished?.type;
    }).filter(Boolean) || [];
    if (wishlistTypes.includes(item.type)) score += 15;

    // 4. Browsing/Try-on history
    const triedTypes = creations?.map(c => c.jewelry_type).filter(Boolean) || [];
    if (triedTypes.includes(item.type)) score += 10;

    // 5. On sale boost
    if (item.sale_price && item.sale_price < item.price) score += 8;

    // 6. Affiliate boost (monetization)
    if (item.affiliate_link) score += 5;

    // 7. Recency boost for new items
    const daysSinceCreation = (Date.now() - new Date(item.created_date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) score += 10;
    else if (daysSinceCreation < 30) score += 5;

    return score;
  };

  const scoreClothingItem = (item) => {
    let score = 0;
    const prefs = user?.style_preferences || {};
    const text = `${item.name} ${item.description || ''} ${item.color || ''} ${item.material || ''} ${item.brand || ''}`.toLowerCase();

    // Color preference match
    if (prefs.favorite_colors?.some(c => text.includes(c.toLowerCase()))) score += 12;

    // Aesthetic match
    if (prefs.aesthetics?.some(a => text.includes(a.toLowerCase()))) score += 10;

    // Material preference (if user prefers natural materials, etc.)
    if (prefs.preferred_materials?.some(m => text.includes(m.toLowerCase()))) score += 8;

    // Affiliate boost
    if (item.affiliate_link) score += 5;

    // On sale
    if (item.price && item.price < 100) score += 3; // Budget-friendly boost

    // Recency
    const daysSinceCreation = (Date.now() - new Date(item.created_date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 14) score += 5;

    return score;
  };

  // Get personalized recommendations
  const getPersonalizedJewelry = () => {
    if (!jewelryItems) return [];
    return [...jewelryItems]
      .map(item => ({ ...item, score: scoreJewelryItem(item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  };

  const getPersonalizedClothing = () => {
    if (!clothingItems) return [];
    return [...clothingItems]
      .map(item => ({ ...item, score: scoreClothingItem(item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  };

  const personalizedJewelry = getPersonalizedJewelry();
  const personalizedClothing = getPersonalizedClothing();

  const isLoading = jewelryLoading || clothingLoading;

  // Determine why items are recommended
  const getRecommendationReason = (item, isJewelry = true) => {
    const prefs = user?.style_preferences || {};
    
    if (isJewelry) {
      if (prefs.preferred_metals?.some(m => item.metal_type?.toLowerCase().includes(m.toLowerCase()))) {
        return `Matches your love for ${item.metal_type}`;
      }
      if (orders?.some(o => jewelryItems?.find(j => j.id === o.item_id)?.type === item.type)) {
        return "Similar to your past purchases";
      }
      if (wishlist?.some(w => jewelryItems?.find(j => j.id === w.jewelry_item_id)?.type === item.type)) {
        return "Based on your wishlist";
      }
    }
    
    if (prefs.aesthetics?.length > 0) {
      return `Fits your ${prefs.aesthetics[0]} style`;
    }
    
    if (item.sale_price && item.sale_price < item.price) {
      return "On sale now";
    }
    
    return "Trending pick";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-serif text-neutral-900">For You</h2>
          <p className="text-sm text-neutral-500">
            {user?.style_preferences ? "Curated based on your style profile" : "Trending picks you'll love"}
          </p>
        </div>
      </div>

      {/* Personalized Jewelry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {personalizedJewelry.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white rounded-xl border border-neutral-100 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all duration-300"
          >
            <div className="aspect-square bg-neutral-50 relative overflow-hidden">
              <img 
                src={item.image_url} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              
              {/* Wishlist button */}
              <button
                onClick={(e) => toggleWishlist(e, item.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-neutral-400 hover:text-red-500 transition-all shadow-sm z-10"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted(item.id) ? "fill-red-500 text-red-500" : ""}`} />
              </button>

              {/* Sale badge */}
              {item.sale_price && item.sale_price < item.price && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-1.5">
                  -{Math.round((1 - item.sale_price / item.price) * 100)}%
                </Badge>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Link to={createPageUrl("Studio")}>
                  <Button size="sm" variant="secondary" className="h-8 text-xs">
                    <Eye className="w-3 h-3 mr-1" /> Try On
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-3">
              <h3 className="font-medium text-sm text-neutral-900 truncate">{item.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {item.sale_price && item.sale_price < item.price ? (
                  <>
                    <span className="text-sm font-semibold text-red-600">${item.sale_price}</span>
                    <span className="text-xs text-neutral-400 line-through">${item.price}</span>
                  </>
                ) : item.price ? (
                  <span className="text-sm font-semibold">${item.price}</span>
                ) : (
                  <span className="text-xs text-neutral-400 capitalize">{item.type}</span>
                )}
              </div>
              
              {/* Recommendation reason */}
              <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {getRecommendationReason(item, true)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Clothing Recommendations */}
      {personalizedClothing.length > 0 && (
        <div className="pt-6">
          <h3 className="text-lg font-medium text-neutral-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-400" />
            Complete Your Look
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {personalizedClothing.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="group bg-white rounded-xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[3/4] bg-neutral-50 relative overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <Badge className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px]">
                    {item.brand || item.type}
                  </Badge>
                  
                  {item.affiliate_link && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={item.affiliate_link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="w-full h-7 text-xs bg-white text-black hover:bg-neutral-100">
                          Shop Now
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-neutral-900 truncate">{item.name}</h3>
                  <p className="text-xs text-neutral-500">{item.color} • {item.material}</p>
                  <p className="text-[10px] text-amber-600 mt-1">
                    {getRecommendationReason(item, false)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}