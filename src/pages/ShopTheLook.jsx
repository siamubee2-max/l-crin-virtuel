import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Heart, ShoppingBag, ArrowLeft, Sparkles, Share2, Bookmark, Check, ExternalLink, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/cart/CartProvider';

export default function ShopTheLook() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  
  const urlParams = new URLSearchParams(window.location.search);
  const collectionId = urlParams.get('id');
  const shareToken = urlParams.get('token'); // For private collection access
  const creatorRef = urlParams.get('ref'); // For affiliate tracking
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [addedAll, setAddedAll] = useState(false);

  // Fetch collection (by ID or share token)
  const { data: collection, isLoading } = useQuery({
    queryKey: ['collection', collectionId, shareToken],
    queryFn: async () => {
      if (shareToken) {
        const collections = await base44.entities.CuratedCollection.filter({ share_token: shareToken });
        return collections[0];
      }
      const collections = await base44.entities.CuratedCollection.filter({ id: collectionId });
      return collections[0];
    },
    enabled: !!collectionId || !!shareToken
  });

  // Increment view count
  useEffect(() => {
    if (collection) {
      base44.entities.CuratedCollection.update(collectionId, {
        views: (collection.views || 0) + 1
      }).catch(() => {});
    }
  }, [collection?.id]);

  // Fetch creator
  const { data: creator } = useQuery({
    queryKey: ['creator', collection?.creator_id],
    queryFn: async () => {
      const creators = await base44.entities.CreatorProfile.filter({ id: collection.creator_id });
      return creators[0];
    },
    enabled: !!collection?.creator_id
  });

  // Fetch items
  const { data: jewelryItems } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list()
  });

  const { data: clothingItems } = useQuery({
    queryKey: ['clothingItems'],
    queryFn: () => base44.entities.ClothingItem.list()
  });

  // Track affiliate click
  const trackClick = useMutation({
    mutationFn: (itemData) => base44.entities.AffiliateClick.create({
      creator_id: creatorRef || collection?.creator_id,
      item_id: itemData.id,
      item_type: itemData.itemType,
      collection_id: collectionId
    })
  });

  // Get full item details
  const getItems = () => {
    if (!collection?.items) return [];
    return collection.items.map(item => {
      const fullItem = item.item_type === 'jewelry'
        ? jewelryItems?.find(j => j.id === item.item_id)
        : clothingItems?.find(c => c.id === item.item_id);
      
      return fullItem ? {
        ...fullItem,
        itemType: item.item_type,
        stylingNote: item.styling_note
      } : null;
    }).filter(Boolean);
  };

  const items = getItems();
  const totalValue = items.reduce((sum, item) => sum + (item.sale_price || item.price || 0), 0);
  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.sale_price || item.price || 0), 0);

  const toggleItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const handleAddSelected = () => {
    items.filter(item => selectedItems.includes(item.id)).forEach(item => {
      addToCart(item);
      trackClick.mutate(item);
    });
    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2000);
  };

  const handleSaveCollection = async () => {
    if (collection) {
      await base44.entities.CuratedCollection.update(collectionId, {
        saves: (collection.saves || 0) + 1
      });
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Collection not found</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-6 pl-0 hover:bg-transparent text-neutral-500"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Collection Info & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image */}
          <div className="aspect-[4/5] bg-neutral-100 rounded-2xl overflow-hidden relative">
            {collection.cover_image || items[0]?.image_url ? (
              <img 
                src={collection.cover_image || items[0]?.image_url} 
                alt={collection.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-neutral-300" />
              </div>
            )}
            
            {collection.featured && (
              <Badge className="absolute top-4 left-4 bg-amber-500 text-white">
                ✨ Featured
              </Badge>
            )}
          </div>

          {/* Collection Details */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-serif text-neutral-900">{collection.title}</h1>
              {collection.description && (
                <p className="text-neutral-600 mt-2">{collection.description}</p>
              )}
            </div>

            {/* Creator */}
            {creator && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden">
                  {creator.profile_image ? (
                    <img src={creator.profile_image} alt={creator.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                      {creator.display_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center gap-1">
                    {creator.display_name}
                    {creator.verified && <Badge className="bg-blue-500 text-white text-[8px] px-1">✓</Badge>}
                  </p>
                  <p className="text-xs text-neutral-500">{creator.specialties?.slice(0, 2).join(', ')}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {collection.occasion && (
                <Badge variant="secondary">{collection.occasion}</Badge>
              )}
              {collection.season && collection.season !== 'all' && (
                <Badge variant="secondary" className="capitalize">{collection.season}</Badge>
              )}
              {collection.tags?.map((tag, i) => (
                <Badge key={i} variant="outline">{tag}</Badge>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-neutral-500 pt-2">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {collection.views || 0} views</span>
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {collection.saves || 0} saves</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleSaveCollection}>
                <Bookmark className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Items List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">{items.length} Items in this Look</h2>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => {
              const isSelected = selectedItems.includes(item.id);
              const price = item.sale_price || item.price || 0;
              const isOnSale = item.sale_price && item.sale_price < item.price;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex gap-4 p-4 rounded-xl border transition-all ${
                    isSelected ? 'bg-amber-50 border-amber-200' : 'bg-white hover:border-neutral-300'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                  </div>

                  {/* Image */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="secondary" className="text-[10px] mb-1 capitalize">
                          {item.itemType}
                        </Badge>
                        <h3 className="font-medium text-neutral-900">{item.name}</h3>
                        <p className="text-sm text-neutral-500">{item.brand || item.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${price.toFixed(2)}</p>
                        {isOnSale && (
                          <p className="text-sm text-neutral-400 line-through">${item.price.toFixed(2)}</p>
                        )}
                      </div>
                    </div>

                    {item.stylingNote && (
                      <p className="text-xs text-amber-700 bg-amber-100/50 px-2 py-1 rounded mt-2 italic">
                        💡 {item.stylingNote}
                      </p>
                    )}

                    {/* Item Actions */}
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => {
                          trackClick.mutate(item);
                          navigate(createPageUrl(`ProductDetail?id=${item.id}&type=${item.itemType}`));
                        }}
                      >
                        View Details
                      </Button>
                      {item.affiliate_link && (
                        <a 
                          href={item.affiliate_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={() => trackClick.mutate(item)}
                        >
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" /> Shop
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-4 bg-white border rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">
                  {selectedItems.length} of {items.length} items selected
                </p>
                <p className="text-2xl font-bold">
                  ${selectedTotal.toFixed(2)}
                  {selectedItems.length === items.length && (
                    <span className="text-sm text-neutral-400 font-normal ml-2">complete look</span>
                  )}
                </p>
              </div>
              <Button
                onClick={handleAddSelected}
                disabled={selectedItems.length === 0 || addedAll}
                className={`h-12 px-8 ${addedAll ? 'bg-green-600' : 'bg-neutral-900'}`}
              >
                {addedAll ? (
                  <><Check className="w-5 h-5 mr-2" /> Added to Cart</>
                ) : (
                  <><ShoppingBag className="w-5 h-5 mr-2" /> Add Selected to Cart</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}