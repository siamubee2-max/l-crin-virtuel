import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Crown, Sparkles, ExternalLink, Search, Heart, Eye, Bookmark, ChevronRight, Star, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BrandPartnerships() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("featured");

  // Fetch data
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['brandPartnerships'],
    queryFn: () => base44.entities.BrandPartnership.filter({ status: 'active' })
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['curatedCollections'],
    queryFn: () => base44.entities.CuratedCollection.list('-created_date')
  });

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ['creatorProfiles'],
    queryFn: () => base44.entities.CreatorProfile.filter({ status: 'approved' })
  });

  const { data: jewelryItems } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list()
  });

  const { data: clothingItems } = useQuery({
    queryKey: ['clothingItems'],
    queryFn: () => base44.entities.ClothingItem.list()
  });

  // Get featured brands
  const featuredBrands = brands?.filter(b => b.featured) || [];
  const featuredCollections = collections?.filter(c => c.featured) || [];

  // Get items for a collection
  const getCollectionItems = (collection) => {
    if (!collection?.items) return [];
    return collection.items.map(item => {
      if (item.item_type === 'jewelry') {
        return { ...jewelryItems?.find(j => j.id === item.item_id), itemType: 'jewelry', note: item.styling_note };
      }
      return { ...clothingItems?.find(c => c.id === item.item_id), itemType: 'clothing', note: item.styling_note };
    }).filter(item => item?.id);
  };

  // Get creator for a collection
  const getCreator = (creatorId) => creators?.find(c => c.id === creatorId);

  const isLoading = brandsLoading || collectionsLoading || creatorsLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl p-8 md:p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
            <Crown className="w-3 h-3 mr-1" /> Partner Brands & Creators
          </Badge>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">
            Shop Curated Style
          </h1>
          <p className="text-neutral-300 text-lg mb-6">
            Discover exclusive collections from top brands and expert stylists. 
            Shop the look with one click.
          </p>
          
          <div className="flex gap-3">
            <Button className="bg-white text-neutral-900 hover:bg-neutral-100">
              <Sparkles className="w-4 h-4 mr-2" /> Explore Collections
            </Button>
            <Link to={createPageUrl('CreatorOnboarding')}>
              <Button variant="outline" className="border-neutral-600 text-black hover:bg-neutral-800">
                Become a Creator
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Brands Carousel */}
      {featuredBrands.length > 0 && (
        <section>
          <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" /> Featured Partners
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {featuredBrands.map((brand, idx) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex-shrink-0 w-64 bg-white rounded-2xl border hover:shadow-xl transition-all group"
              >
                <div className="h-24 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-t-2xl flex items-center justify-center p-4">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.brand_name} className="max-h-16 object-contain" />
                  ) : (
                    <span className="text-2xl font-serif text-neutral-400">{brand.brand_name}</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{brand.brand_name}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {brand.tier}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{brand.description}</p>
                  {brand.website_url && (
                    <a href={brand.website_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Visit Brand <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-neutral-100 p-1 mb-8">
          <TabsTrigger value="featured" className="gap-2">
            <Sparkles className="w-4 h-4" /> Featured Looks
          </TabsTrigger>
          <TabsTrigger value="collections" className="gap-2">
            <Bookmark className="w-4 h-4" /> All Collections
          </TabsTrigger>
          <TabsTrigger value="creators" className="gap-2">
            <Users className="w-4 h-4" /> Creators
          </TabsTrigger>
        </TabsList>

        {/* Featured Looks */}
        <TabsContent value="featured" className="space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
            </div>
          ) : featuredCollections.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 rounded-2xl">
              <Sparkles className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">No featured collections yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {featuredCollections.map((collection, idx) => {
                const items = getCollectionItems(collection);
                const creator = getCreator(collection.creator_id);
                
                return (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-all group"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-[16/9] bg-neutral-100 overflow-hidden">
                      {collection.cover_image ? (
                        <img src={collection.cover_image} alt={collection.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : items[0]?.image_url ? (
                        <img src={items[0].image_url} alt={collection.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-neutral-300" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      <Badge className="absolute top-4 left-4 bg-amber-500 text-white">
                        <Star className="w-3 h-3 mr-1" /> Featured
                      </Badge>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-xl font-serif mb-1">{collection.title}</h3>
                        {creator && (
                          <p className="text-white/80 text-sm flex items-center gap-2">
                            by {creator.display_name}
                            {creator.verified && <Badge className="bg-blue-500 text-white text-[8px] px-1">✓</Badge>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="p-4">
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {items.slice(0, 4).map((item, i) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 border">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {items.length > 4 && (
                          <div className="w-16 h-16 rounded-lg bg-neutral-100 flex-shrink-0 flex items-center justify-center text-sm text-neutral-500">
                            +{items.length - 4}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {collection.views || 0}</span>
                          <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {collection.saves || 0}</span>
                        </div>
                        
                        <Link to={createPageUrl(`ShopTheLook?id=${collection.id}`)}>
                          <Button size="sm" className="bg-neutral-900 text-white">
                            Shop the Look <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* All Collections */}
        <TabsContent value="collections" className="space-y-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input 
                placeholder="Search collections..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections?.filter(c => 
              c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.occasion?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((collection, idx) => {
              const items = getCollectionItems(collection);
              const creator = getCreator(collection.creator_id);
              const totalValue = items.reduce((sum, item) => sum + (item.sale_price || item.price || 0), 0);
              
              return (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="relative aspect-square bg-neutral-100">
                    <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
                      {items.slice(0, 4).map((item, i) => (
                        <div key={i} className="bg-neutral-50 overflow-hidden">
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    
                    {collection.occasion && (
                      <Badge className="absolute top-3 left-3 bg-white/90 text-neutral-700 text-xs">
                        {collection.occasion}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-neutral-900 mb-1">{collection.title}</h3>
                    {creator && (
                      <p className="text-xs text-neutral-500 mb-3">
                        by {creator.display_name} {creator.verified && "✓"}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">${totalValue.toFixed(0)} total</span>
                      <Link to={createPageUrl(`ShopTheLook?id=${collection.id}`)}>
                        <Button size="sm" variant="outline">
                          View <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Creators */}
        <TabsContent value="creators" className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators?.map((creator, idx) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Cover */}
                <div className="h-24 bg-gradient-to-r from-purple-500 to-pink-500 relative">
                  {creator.cover_image && (
                    <img src={creator.cover_image} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                
                {/* Profile */}
                <div className="px-4 pb-4">
                  <div className="flex items-end gap-3 -mt-8 mb-3">
                    <div className="w-16 h-16 rounded-full border-4 border-white bg-neutral-100 overflow-hidden">
                      {creator.profile_image ? (
                        <img src={creator.profile_image} alt={creator.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-medium text-neutral-400">
                          {creator.display_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <h3 className="font-medium flex items-center gap-1">
                        {creator.display_name}
                        {creator.verified && (
                          <Badge className="bg-blue-500 text-white text-[8px] px-1">✓</Badge>
                        )}
                      </h3>
                      <p className="text-xs text-neutral-500">{creator.follower_count || 0} followers</p>
                    </div>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{creator.bio}</p>
                  )}
                  
                  {creator.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {creator.specialties.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                  
                  <Button variant="outline" size="sm" className="w-full">
                    View Collections
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}