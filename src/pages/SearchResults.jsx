import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Loader2, ArrowRight, Search, SlidersHorizontal, Grid3X3, LayoutList, Heart, ShoppingBag, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdvancedFilters from "@/components/search/AdvancedFilters";
import VisualSearch from "@/components/search/VisualSearch";
import { useCart } from '@/components/cart/CartProvider';

export default function SearchResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    priceRange: { min: "", max: "" },
    onSale: false,
    jewelryTypes: [],
    clothingTypes: [],
    occasions: [],
    styles: [],
    metals: [],
    gemstones: [],
    brands: [],
    creators: []
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const { addToCart } = useCart();

  const { data: jewelry, isLoading: jLoading } = useQuery({
    queryKey: ['searchJewelry'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const { data: clothes, isLoading: cLoading } = useQuery({
    queryKey: ['searchClothes'],
    queryFn: () => base44.entities.ClothingItem.list(),
  });

  const { data: stylists, isLoading: sLoading } = useQuery({
    queryKey: ['searchStylists'],
    queryFn: () => base44.entities.Stylist.list(),
  });

  const { data: creators } = useQuery({
    queryKey: ['searchCreators'],
    queryFn: () => base44.entities.CreatorProfile.filter({ status: 'approved' }),
  });

  const { data: wishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => base44.entities.WishlistItem.list(),
  });

  const isWishlisted = (itemId) => wishlist?.some(w => w.jewelry_item_id === itemId);

  // Get unique brands
  const uniqueBrands = useMemo(() => {
    const brands = new Set();
    jewelry?.forEach(j => j.brand && brands.add(j.brand));
    clothes?.forEach(c => c.brand && brands.add(c.brand));
    return Array.from(brands).sort();
  }, [jewelry, clothes]);

  // Apply filters to jewelry
  const filteredJewelry = useMemo(() => {
    if (!jewelry) return [];
    
    return jewelry.filter(item => {
      // Text search
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Price range
      const price = item.sale_price || item.price || 0;
      const minPrice = parseFloat(filters.priceRange.min);
      const maxPrice = parseFloat(filters.priceRange.max);
      const matchesMinPrice = isNaN(minPrice) || price >= minPrice;
      const matchesMaxPrice = isNaN(maxPrice) || price <= maxPrice;

      // On sale
      const matchesSale = !filters.onSale || (item.sale_price && item.sale_price < item.price);

      // Jewelry types
      const matchesType = filters.jewelryTypes.length === 0 || filters.jewelryTypes.includes(item.type);

      // Metals
      const matchesMetal = filters.metals.length === 0 || filters.metals.includes(item.metal_type);

      // Gemstones
      const matchesGemstone = filters.gemstones.length === 0 || 
        filters.gemstones.some(g => item.gemstone_type?.toLowerCase().includes(g.toLowerCase()));

      // Brands
      const matchesBrand = filters.brands.length === 0 || filters.brands.includes(item.brand);

      // Styles (via tags)
      const matchesStyle = filters.styles.length === 0 || 
        filters.styles.some(s => item.tags?.some(t => t.toLowerCase().includes(s.toLowerCase())));

      // Occasions (via tags)
      const matchesOccasion = filters.occasions.length === 0 ||
        filters.occasions.some(o => item.tags?.some(t => t.toLowerCase().includes(o.toLowerCase())));

      return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesSale && 
             matchesType && matchesMetal && matchesGemstone && matchesBrand && 
             matchesStyle && matchesOccasion;
    });
  }, [jewelry, searchQuery, filters]);

  // Apply filters to clothing
  const filteredClothes = useMemo(() => {
    if (!clothes) return [];
    
    return clothes.filter(item => {
      // Text search
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.color?.toLowerCase().includes(searchQuery.toLowerCase());

      // Price range
      const price = item.price || 0;
      const minPrice = parseFloat(filters.priceRange.min);
      const maxPrice = parseFloat(filters.priceRange.max);
      const matchesMinPrice = isNaN(minPrice) || price >= minPrice;
      const matchesMaxPrice = isNaN(maxPrice) || price <= maxPrice;

      // Clothing types
      const matchesType = filters.clothingTypes.length === 0 || filters.clothingTypes.includes(item.type);

      // Brands
      const matchesBrand = filters.brands.length === 0 || filters.brands.includes(item.brand);

      return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesType && matchesBrand;
    });
  }, [clothes, searchQuery, filters]);

  // Apply filters to stylists
  const filteredStylists = useMemo(() => {
    if (!stylists) return [];
    
    return stylists.filter(item => {
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [stylists, searchQuery]);

  // Sort results
  const sortItems = (items, type) => {
    const sorted = [...items];
    switch (sortBy) {
      case "price_low":
        return sorted.sort((a, b) => ((a.sale_price || a.price || 0) - (b.sale_price || b.price || 0)));
      case "price_high":
        return sorted.sort((a, b) => ((b.sale_price || b.price || 0) - (a.sale_price || a.price || 0)));
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  const sortedJewelry = sortItems(filteredJewelry, "jewelry");
  const sortedClothes = sortItems(filteredClothes, "clothing");

  const totalResults = sortedJewelry.length + sortedClothes.length + filteredStylists.length;
  const isLoading = jLoading || cLoading || sLoading;

  const resetFilters = () => {
    setFilters({
      priceRange: { min: "", max: "" },
      onSale: false,
      jewelryTypes: [],
      clothingTypes: [],
      occasions: [],
      styles: [],
      metals: [],
      gemstones: [],
      brands: [],
      creators: []
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Update URL without reload
    window.history.pushState({}, '', `${window.location.pathname}?q=${encodeURIComponent(searchQuery)}`);
  };

  // Product Card Component
  const ProductCard = ({ item, type }) => {
    const isOnSale = item.sale_price && item.sale_price < item.price;
    const displayPrice = isOnSale ? item.sale_price : item.price;

    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="group bg-white rounded-xl overflow-hidden border border-neutral-100 hover:shadow-lg transition-all"
      >
        <Link to={createPageUrl(`ProductDetail?id=${item.id}&type=${type}`)}>
          <div className={`${type === 'clothing' ? 'aspect-[3/4]' : 'aspect-square'} bg-neutral-100 relative overflow-hidden`}>
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            {isOnSale && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[10px]">
                SALE
              </Badge>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/90 shadow"
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(item);
                }}
              >
                <ShoppingBag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Link>
        <div className="p-3">
          <Link to={createPageUrl(`ProductDetail?id=${item.id}&type=${type}`)}>
            <h3 className="text-sm font-medium truncate hover:text-amber-600 transition-colors">
              {item.name}
            </h3>
          </Link>
          <p className="text-xs text-neutral-500 truncate">{item.brand || item.type}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1">
              {displayPrice && (
                <span className={`text-sm font-bold ${isOnSale ? 'text-red-600' : ''}`}>
                  ${displayPrice}
                </span>
              )}
              {isOnSale && (
                <span className="text-xs text-neutral-400 line-through">${item.price}</span>
              )}
            </div>
            {type === 'jewelry' && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${isWishlisted(item.id) ? 'text-red-500' : 'text-neutral-400'}`}
                onClick={() => {}}
              >
                <Heart className={`w-4 h-4 ${isWishlisted(item.id) ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-neutral-900">Search & Discover</h1>
          <p className="text-neutral-500">
            {totalResults} {totalResults === 1 ? 'result' : 'results'}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
        
        {/* Search Bar & Visual Search */}
        <div className="flex gap-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex-1 md:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jewelry, clothing, brands..."
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
          <VisualSearch jewelry={jewelry || []} clothing={clothes || []} />
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.entries(filters).some(([k, v]) => 
        (Array.isArray(v) && v.length > 0) || 
        (k === 'priceRange' && (v.min || v.max)) ||
        (k === 'onSale' && v)
      ) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-neutral-500">Active filters:</span>
          {filters.onSale && (
            <Badge variant="secondary" className="gap-1">
              On Sale
              <button onClick={() => setFilters(prev => ({ ...prev, onSale: false }))}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.priceRange.min && (
            <Badge variant="secondary" className="gap-1">
              Min: ${filters.priceRange.min}
              <button onClick={() => setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, min: "" }}))}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.priceRange.max && (
            <Badge variant="secondary" className="gap-1">
              Max: ${filters.priceRange.max}
              <button onClick={() => setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, max: "" }}))}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {['jewelryTypes', 'clothingTypes', 'occasions', 'styles', 'metals', 'gemstones', 'brands'].map(key => 
            filters[key]?.map(val => (
              <Badge key={`${key}-${val}`} variant="secondary" className="gap-1">
                {val}
                <button onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  [key]: prev[key].filter(v => v !== val) 
                }))}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
            Clear All
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <AdvancedFilters
            filters={filters}
            setFilters={setFilters}
            uniqueBrands={uniqueBrands}
            uniqueCreators={creators || []}
            onReset={resetFilters}
            activeCategory={activeTab}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="bg-neutral-100">
                <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                <TabsTrigger value="jewelry">Jewelry ({sortedJewelry.length})</TabsTrigger>
                <TabsTrigger value="clothing">Clothing ({sortedClothes.length})</TabsTrigger>
                <TabsTrigger value="stylists">Stylists ({filteredStylists.length})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="p-4 overflow-y-auto h-full">
                    <AdvancedFilters
                      filters={filters}
                      setFilters={setFilters}
                      uniqueBrands={uniqueBrands}
                      uniqueCreators={creators || []}
                      onReset={resetFilters}
                      activeCategory={activeTab}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="hidden md:flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
            </div>
          ) : (
            <>
              {/* All Tab */}
              {activeTab === "all" && (
                <div className="space-y-8">
                  {filteredStylists.length > 0 && (
                    <section>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">Stylists</h2>
                        <Button variant="link" onClick={() => setActiveTab("stylists")}>View All</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filteredStylists.slice(0, 3).map(s => (
                          <Link key={s.id} to={createPageUrl(`StylistProfile?id=${s.id}`)} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-100 hover:shadow-md transition-all">
                            <img src={s.profile_image} className="w-14 h-14 rounded-full object-cover" />
                            <div>
                              <h3 className="font-medium">{s.name}</h3>
                              <p className="text-xs text-neutral-500 line-clamp-1">{s.specialties?.join(", ")}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {sortedJewelry.length > 0 && (
                    <section>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">Jewelry</h2>
                        <Button variant="link" onClick={() => setActiveTab("jewelry")}>View All ({sortedJewelry.length})</Button>
                      </div>
                      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
                        {sortedJewelry.slice(0, 4).map(item => (
                          <ProductCard key={item.id} item={item} type="jewelry" />
                        ))}
                      </div>
                    </section>
                  )}

                  {sortedClothes.length > 0 && (
                    <section>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">Clothing</h2>
                        <Button variant="link" onClick={() => setActiveTab("clothing")}>View All ({sortedClothes.length})</Button>
                      </div>
                      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
                        {sortedClothes.slice(0, 4).map(item => (
                          <ProductCard key={item.id} item={item} type="clothing" />
                        ))}
                      </div>
                    </section>
                  )}

                  {totalResults === 0 && (
                    <div className="text-center py-16">
                      <Search className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-700">No results found</h3>
                      <p className="text-neutral-500 mt-1">Try adjusting your filters or search terms</p>
                      <Button variant="outline" onClick={resetFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Jewelry Tab */}
              {activeTab === "jewelry" && (
                <AnimatePresence mode="popLayout">
                  {sortedJewelry.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-neutral-500">No jewelry found matching your criteria</p>
                    </div>
                  ) : (
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                      {sortedJewelry.map(item => (
                        <ProductCard key={item.id} item={item} type="jewelry" />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              )}

              {/* Clothing Tab */}
              {activeTab === "clothing" && (
                <AnimatePresence mode="popLayout">
                  {sortedClothes.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-neutral-500">No clothing found matching your criteria</p>
                    </div>
                  ) : (
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                      {sortedClothes.map(item => (
                        <ProductCard key={item.id} item={item} type="clothing" />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              )}

              {/* Stylists Tab */}
              {activeTab === "stylists" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStylists.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <p className="text-neutral-500">No stylists found</p>
                    </div>
                  ) : (
                    filteredStylists.map(s => (
                      <Link key={s.id} to={createPageUrl(`StylistProfile?id=${s.id}`)} className="bg-white rounded-xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-all">
                        <div className="aspect-video bg-neutral-100">
                          <img src={s.profile_image} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-serif text-lg font-medium">{s.name}</h3>
                            {s.rating && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {s.rating}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 mb-2">{s.specialties?.join(", ")}</p>
                          <p className="text-sm line-clamp-2">{s.bio}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}