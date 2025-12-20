import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, Heart, Eye, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import SalesBadge from '@/components/jewelry/SalesBadge';
import JewelryFilters from '@/components/jewelry/JewelryFilters';
import { useCart } from '@/components/cart/CartProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReviewSection from '@/components/reviews/ReviewSection';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function Shop() {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [detailItem, setDetailItem] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [gemstoneFilter, setGemstoneFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [saleFilter, setSaleFilter] = useState(false);

  const { data: jewelryItems, isLoading } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list('-created_date'),
  });

  // Wishlist Logic
  const { data: myWishlist, refetch: refetchWishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => base44.entities.WishlistItem.list()
  });

  const toggleWishlist = async (e, itemId) => {
    e.stopPropagation();
    const existing = myWishlist?.find(w => w.jewelry_item_id === itemId);
    if (existing) {
      await base44.entities.WishlistItem.delete(existing.id);
    } else {
      await base44.entities.WishlistItem.create({ jewelry_item_id: itemId });
    }
    refetchWishlist();
  };

  const isWishlisted = (itemId) => myWishlist?.some(w => w.jewelry_item_id === itemId);

  const uniqueBrands = React.useMemo(() => {
     return [...new Set(jewelryItems?.map(i => i.brand).filter(Boolean))].sort();
  }, [jewelryItems]);

  const uniqueCollections = React.useMemo(() => {
     return [...new Set(jewelryItems?.map(i => i.collection_name).filter(Boolean))].sort();
  }, [jewelryItems]);

  const filteredItems = jewelryItems?.filter(item => {
    const currentPrice = (item.sale_price && item.sale_price < item.price) ? item.sale_price : item.price;
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.collection_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesMetal = metalFilter === "all" || item.metal_type === metalFilter;
    const matchesGemstone = gemstoneFilter === "all" || (gemstoneFilter === "none" ? !item.gemstone_type : item.gemstone_type?.toLowerCase().includes(gemstoneFilter.toLowerCase()));
    const matchesBrand = brandFilter === "all" || item.brand === brandFilter;
    const matchesCollection = collectionFilter === "all" || item.collection_name === collectionFilter;
    const matchesSale = !saleFilter || (item.sale_price && item.sale_price < item.price);
    
    const min = parseFloat(priceRange.min);
    const max = parseFloat(priceRange.max);
    const matchesMinPrice = isNaN(min) || (currentPrice && currentPrice >= min);
    const matchesMaxPrice = isNaN(max) || (currentPrice && currentPrice <= max);

    return matchesSearch && matchesType && matchesMetal && matchesGemstone && matchesBrand && matchesCollection && matchesSale && matchesMinPrice && matchesMaxPrice;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-serif text-neutral-900 mb-2">{t.shop?.title || "La Boutique"}</h1>
          <p className="text-neutral-500 max-w-lg">
            {t.shop?.subtitle || "Découvrez nos créations uniques faites main."}
          </p>
        </div>
      </div>

      <JewelryFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        metalFilter={metalFilter} setMetalFilter={setMetalFilter}
        gemstoneFilter={gemstoneFilter} setGemstoneFilter={setGemstoneFilter}
        brandFilter={brandFilter} setBrandFilter={setBrandFilter}
        collectionFilter={collectionFilter} setCollectionFilter={setCollectionFilter}
        priceRange={priceRange} setPriceRange={setPriceRange}
        saleFilter={saleFilter} setSaleFilter={setSaleFilter}
        uniqueBrands={uniqueBrands}
        uniqueCollections={uniqueCollections}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems?.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-neutral-200">
              <p className="text-neutral-500">{t.common?.noResults || "Aucun résultat trouvé."}</p>
            </div>
          ) : (
            filteredItems?.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-neutral-100 cursor-pointer flex flex-col"
                onClick={() => setDetailItem(item)}
              >
                <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <SalesBadge price={item.price} salePrice={item.sale_price} endDate={item.sale_end_date} />
                  
                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow-sm"
                      onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="absolute top-2 left-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className={`h-8 w-8 rounded-full shadow-sm transition-colors ${isWishlisted(item.id) ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-white/90 hover:bg-white text-neutral-400 hover:text-red-400"}`}
                      onClick={(e) => toggleWishlist(e, item.id)}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted(item.id) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="mb-2">
                     <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{item.brand || item.type}</p>
                     <h3 className="font-serif font-medium text-neutral-900 truncate">{item.name}</h3>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-50">
                     <div className="flex flex-col">
                        {item.sale_price && item.sale_price < item.price ? (
                           <>
                              <span className="text-neutral-400 text-xs line-through">${item.price}</span>
                              <span className="text-red-600 font-bold">${item.sale_price}</span>
                           </>
                        ) : (
                           <span className="font-bold text-neutral-900">${item.price}</span>
                        )}
                     </div>
                     {item.affiliate_url ? (
                       <Button 
                          size="sm" 
                          className="bg-amber-600 text-white hover:bg-amber-700 rounded-full h-8 px-4"
                          onClick={(e) => { e.stopPropagation(); window.open(item.affiliate_url, '_blank'); }}
                       >
                          <ExternalLink className="w-3 h-3 mr-2" /> {t.common?.visit || "Voir"}
                       </Button>
                     ) : (
                       <Button 
                          size="sm" 
                          className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-full h-8 px-4"
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                       >
                          <ShoppingBag className="w-3 h-3 mr-2" /> {t.common?.add || "Ajouter"}
                       </Button>
                     )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
             <DialogTitle className="font-serif text-2xl pr-8">{detailItem?.name}</DialogTitle>
          </DialogHeader>
          {detailItem && (
             <div className="grid md:grid-cols-2 gap-8 py-4">
                <div className="space-y-4">
                   <div className="aspect-square bg-neutral-50 rounded-xl overflow-hidden relative">
                      <img src={detailItem.image_url} alt={detailItem.name} className="w-full h-full object-cover" />
                      <SalesBadge price={detailItem.price} salePrice={detailItem.sale_price} endDate={detailItem.sale_end_date} />
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-neutral-50 p-4 rounded-xl">
                      <div className="flex items-end gap-2">
                         {detailItem.sale_price && detailItem.sale_price < detailItem.price ? (
                           <>
                             <span className="text-3xl font-bold text-red-600">${detailItem.sale_price}</span>
                             <span className="text-sm text-neutral-400 line-through mb-1">${detailItem.price}</span>
                           </>
                         ) : (
                           <span className="text-3xl font-bold">${detailItem.price}</span>
                         )}
                      </div>
                      {detailItem.description && (
                         <p className="text-neutral-600 text-sm mt-3 leading-relaxed">{detailItem.description}</p>
                      )}
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                         <span className="text-neutral-500">Matière</span>
                         <span className="font-medium">{detailItem.material}</span>
                      </div>
                      {detailItem.collection_name && (
                         <div className="flex justify-between py-2 border-b border-neutral-100">
                            <span className="text-neutral-500">Collection</span>
                            <span className="font-medium">{detailItem.collection_name}</span>
                         </div>
                      )}
                   </div>

                   <div className="flex gap-3 pt-4">
                      {detailItem.affiliate_url ? (
                        <Button 
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-12 text-lg"
                          onClick={() => window.open(detailItem.affiliate_url, '_blank')}
                        >
                          <ExternalLink className="w-5 h-5 mr-2" /> Acheter sur {detailItem.brand || "le site partenaire"}
                        </Button>
                      ) : (
                        <>
                          <Button 
                            className="flex-1 bg-neutral-900 text-white h-12 text-lg"
                            onClick={() => { addToCart(detailItem); setDetailItem(null); }}
                          >
                            <ShoppingBag className="w-5 h-5 mr-2" /> Ajouter au panier
                          </Button>
                          <Button 
                            className="flex-1 bg-white text-neutral-900 border border-neutral-200 h-12 text-lg"
                            onClick={handleBuyNow}
                          >
                            Acheter maintenant
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-12 w-12 shrink-0 ${isWishlisted(detailItem.id) ? "text-red-500 border-red-200 bg-red-50" : ""}`}
                        onClick={(e) => toggleWishlist(e, detailItem.id)}
                      >
                        <Heart className={`w-6 h-6 ${isWishlisted(detailItem.id) ? "fill-current" : ""}`} />
                      </Button>
                   </div>
                   
                   <div className="pt-6 border-t border-neutral-100">
                      <ReviewSection jewelryId={detailItem.id} />
                   </div>
                </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}