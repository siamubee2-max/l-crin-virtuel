import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Loader2, Camera, Tag, Trash2, Filter, Star, Eye, Heart, DollarSign, Calendar as CalendarIcon, Edit2, Percent, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import StarRating from '@/components/reviews/StarRating';
import ReviewSection from '@/components/reviews/ReviewSection';
import SalesBadge from '@/components/jewelry/SalesBadge';
import JewelryFilters from '@/components/jewelry/JewelryFilters';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCart } from '@/components/cart/CartProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function JewelryBox() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null); // For detail view dialog
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [gemstoneFilter, setGemstoneFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [saleFilter, setSaleFilter] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editItemData, setEditItemData] = useState(null);

  const [newItem, setNewItem] = useState({
    name: "",
    type: "necklace",
    brand: "",
    material: "",
    metal_type: "",
    gemstone_type: "",
    collection_name: "",
    material_options: [],
    image_url: "",
    description: "",
    tags: [],
    price: "",
    sale_price: "",
    sale_end_date: ""
  });

  const { data: jewelryItems, isLoading } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list('-created_date'),
  });

  // Fetch all reviews to calculate averages
  // In a real large app, we would aggregate this in backend or fetch per item
  const { data: allReviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list(),
  });

  const getRatingStats = (itemId) => {
    if (!allReviews) return { avg: 0, count: 0 };
    const itemReviews = allReviews.filter(r => r.jewelry_item_id === itemId);
    if (itemReviews.length === 0) return { avg: 0, count: 0 };
    
    const sum = itemReviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avg: sum / itemReviews.length,
      count: itemReviews.length
    };
  };

  // Wishlist Logic
  const { data: myWishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => base44.entities.WishlistItem.list()
  });

  const toggleWishlist = async (e, itemId) => {
    e.stopPropagation();
    const existing = myWishlist?.find(w => w.jewelry_item_id === itemId);
    
    // Optimistic update could go here, but for simplicity we'll await
    if (existing) {
      await base44.entities.WishlistItem.delete(existing.id);
    } else {
      await base44.entities.WishlistItem.create({ jewelry_item_id: itemId });
    }
    queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
  };

  const isWishlisted = (itemId) => myWishlist?.some(w => w.jewelry_item_id === itemId);

  const handleBuyNow = () => {
     addToCart(detailItem);
     setDetailItem(null);
     navigate(createPageUrl('Checkout'));
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JewelryItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jewelryItems'] });
      setIsDialogOpen(false);
      setNewItem({
        name: "",
        type: "necklace",
        brand: "",
        material: "",
        metal_type: "",
        gemstone_type: "",
        collection_name: "",
        material_options: [],
        image_url: "",
        description: "",
        tags: [],
        price: "",
        sale_price: "",
        sale_end_date: ""
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const originalItem = jewelryItems.find(i => i.id === id);
      await base44.entities.JewelryItem.update(id, data);
      
      // Notification Logic: Check if sale started or price dropped
      const oldPrice = originalItem.sale_price || originalItem.price;
      const newPrice = data.sale_price || data.price;
      
      const isSaleStart = !originalItem.sale_price && data.sale_price;
      const isPriceDrop = newPrice < oldPrice;

      if (isSaleStart || isPriceDrop) {
         // Find wishlists with this item
         const wishlists = await base44.entities.WishlistItem.filter({ jewelry_item_id: id });
         
         // Notify each user (assuming we can map created_by to user or just send to created_by email if system supports)
         // NOTE: Here we iterate. In production backend, this should be a batch job.
         const users = await base44.entities.User.list();
         
         for (const w of wishlists) {
            const user = users.find(u => u.email === w.created_by);
            if (user) {
               await base44.entities.Notification.create({
                 recipient_id: user.id,
                 title: isSaleStart ? "Sale Alert!" : "Price Drop!",
                 message: `Great news! "${data.name}" is now available for $${newPrice}.`,
                 type: "price_drop",
                 related_item_id: id,
                 link: `/JewelryBox?item=${id}`
               });
            }
         }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jewelryItems'] });
      setIsEditing(false);
      setDetailItem(null); // Close detail or refresh it? Close for simplicity
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JewelryItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jewelryItems'] });
    }
  });

  const analyzeImage = async (imageUrl) => {
    setAnalyzing(true);
    try {
      const prompt = `
        Analyze this jewelry image.
        Extract the following details in JSON format:
        - name: A short, elegant title for the item.
        - type: One of [earrings, necklace, ring, bracelet, anklet, set].
        - material: The likely material (e.g., Gold, Silver, Diamond, Pearl).
        - tags: An array of 5 descriptive tags (e.g., "vintage", "minimalist", "party", "boho").
        - description: A brief, attractive description.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
          name: { type: "string" },
          type: { type: "string" },
          material: { type: "string" },
          metal_type: { type: "string" },
          gemstone_type: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          description: { type: "string" }
          }
        }
      });

      if (response) {
        setNewItem(prev => ({
          ...prev,
          name: response.name || prev.name,
          type: response.type || prev.type,
          material: response.material || prev.material,
          metal_type: response.metal_type || prev.metal_type,
          gemstone_type: response.gemstone_type || prev.gemstone_type,
          tags: response.tags || [],
          description: response.description || prev.description,
          image_url: imageUrl
        }));
      }
    } catch (error) {
      console.error("Analysis failed", error);
      setNewItem(prev => ({ ...prev, image_url: imageUrl }));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      await analyzeImage(result.file_url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

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
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="relative py-12 px-6 rounded-3xl bg-neutral-900 text-white overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4 max-w-2xl">
              <span className="text-amber-400 uppercase tracking-[0.2em] text-xs font-medium">Collection Privée</span>
              <h1 className="text-5xl md:text-6xl font-serif font-light leading-tight">
                {t.jewelryBox?.title || "Mon Écrin"}
              </h1>
              <p className="text-neutral-300 text-lg font-light leading-relaxed max-w-lg">
                {t.jewelryBox?.subtitle || "Cataloguez vos bijoux précieux dans un espace dédié à l'élégance."}
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-neutral-900 hover:bg-amber-50 rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" /> {t.jewelryBox?.addBtn || "Ajouter"}
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{t.jewelryBox?.newItem || "Nouveau Bijou"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              
              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:bg-neutral-50 transition-colors cursor-pointer relative min-h-[150px] flex flex-col items-center justify-center">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {uploading ? (
                  <div className="flex flex-col items-center text-neutral-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm">Téléchargement...</span>
                  </div>
                ) : analyzing ? (
                  <div className="flex flex-col items-center text-amber-600">
                    <Sparkles className="w-8 h-8 animate-pulse mb-2" />
                    <span className="text-sm font-medium">{t.jewelryBox?.analyzing || "L'IA analyse..."}</span>
                  </div>
                ) : newItem.image_url ? (
                  <div className="relative h-48 w-full">
                    <img 
                      src={newItem.image_url} 
                      alt="Preview" 
                      className="h-full w-full object-contain rounded-md"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-md text-white font-medium">
                      Changer la photo
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-neutral-400">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Photo du bijou</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.jewelryBox?.fields?.name || "Nom"}</Label>
                  <Input 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.jewelryBox?.fields?.type || "Type"}</Label>
                  <Select 
                    value={newItem.type}
                    onValueChange={(val) => setNewItem({...newItem, type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="necklace">Collier</SelectItem>
                      <SelectItem value="earrings">Boucles d'oreilles</SelectItem>
                      <SelectItem value="ring">Bague</SelectItem>
                      <SelectItem value="bracelet">Bracelet</SelectItem>
                      <SelectItem value="anklet">Cheville</SelectItem>
                      <SelectItem value="set">Parure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.jewelryBox?.fields?.brand || "Marque"}</Label>
                  <Input 
                    value={newItem.brand}
                    onChange={(e) => setNewItem({...newItem, brand: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Collection</Label>
                  <Input 
                    value={newItem.collection_name}
                    onChange={(e) => setNewItem({...newItem, collection_name: e.target.value})}
                    placeholder="e.g. Summer 2024"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Metal Type</Label>
                   <Select 
                      value={newItem.metal_type}
                      onValueChange={(val) => setNewItem({...newItem, metal_type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select metal" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Gold", "Silver", "Platinum", "Rose Gold", "White Gold", "Other"].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                   <Label>Gemstone</Label>
                   <Input 
                      value={newItem.gemstone_type}
                      onChange={(e) => setNewItem({...newItem, gemstone_type: e.target.value})}
                      placeholder="e.g. Diamond, Ruby"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Material Options (comma separated)</Label>
                <Input 
                  value={newItem.material_options?.join(", ")}
                  onChange={(e) => setNewItem({...newItem, material_options: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
                  placeholder="e.g. 18k Gold, Sterling Silver"
                />
              </div>

              <div className="space-y-2">
                <Label>{t.jewelryBox?.fields?.desc || "Description"}</Label>
                <Textarea 
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="h-20"
                />
              </div>

              <div className="space-y-2">
                <Label>{t.jewelryBox?.fields?.tags || "Tags"}</Label>
                <div className="flex flex-wrap gap-2">
                  {newItem.tags.map((tag, idx) => (
                    <span key={idx} className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs border border-amber-100 flex items-center gap-1">
                      #{tag}
                      <button 
                        onClick={() => setNewItem({...newItem, tags: newItem.tags.filter((_, i) => i !== idx)})}
                        className="hover:text-amber-900 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <Input 
                    placeholder="+ Tag"
                    className="w-20 h-7 text-xs px-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.currentTarget.value.trim()) {
                          setNewItem({...newItem, tags: [...newItem.tags, e.currentTarget.value.trim()]});
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                 <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Pricing & Sales</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Regular Price ($)</Label>
                       <Input 
                         type="number"
                         value={newItem.price}
                         onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                         placeholder="0.00"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Sale Price ($)</Label>
                       <Input 
                         type="number"
                         value={newItem.sale_price}
                         onChange={(e) => setNewItem({...newItem, sale_price: parseFloat(e.target.value)})}
                         placeholder="Optional"
                       />
                    </div>
                 </div>
                 <div className="mt-4 space-y-2">
                    <Label>Sale End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal ${!newItem.sale_end_date && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newItem.sale_end_date ? format(new Date(newItem.sale_end_date), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newItem.sale_end_date ? new Date(newItem.sale_end_date) : undefined}
                          onSelect={(date) => setNewItem({...newItem, sale_end_date: date ? date.toISOString() : ""})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                 </div>
              </div>

              <Button 
                onClick={() => createMutation.mutate(newItem)} 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={!newItem.name || !newItem.image_url || createMutation.isPending}
              >
                {createMutation.isPending ? "..." : t.common.save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Detail View Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open) => {
        if (!open) {
           setDetailItem(null);
           setIsEditing(false);
           setEditItemData(null);
        }
      }}>
         <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <div className="flex items-center justify-between pr-8">
               <DialogTitle className="font-serif text-2xl">{isEditing ? "Edit Item" : detailItem?.name}</DialogTitle>
               <div className="flex gap-2">
                 {!isEditing && detailItem && (
                   <>
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditItemData({...detailItem});
                          setIsEditing(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => toggleWishlist(e, detailItem.id)}
                        className="text-neutral-500 hover:text-red-500 hover:bg-red-50"
                      >
                        <Heart className={`w-6 h-6 ${isWishlisted(detailItem.id) ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                   </>
                 )}
               </div>
             </div>
           </DialogHeader>

           {detailItem && !isEditing ? (
             <div className="grid md:grid-cols-2 gap-8 py-4">
                <div className="space-y-4">
                  <div className="aspect-square bg-neutral-50 rounded-xl overflow-hidden relative">
                     <img src={detailItem.image_url} alt={detailItem.name} className="w-full h-full object-cover" />
                     <SalesBadge price={detailItem.price} salePrice={detailItem.sale_price} endDate={detailItem.sale_end_date} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detailItem.tags?.map((tag, i) => (
                       <span key={i} className="text-xs bg-neutral-100 px-2 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-neutral-50 p-4 rounded-xl">
                      <div className="flex items-end gap-2 mb-2">
                         {detailItem.sale_price && detailItem.sale_price < detailItem.price ? (
                           <>
                             <span className="text-2xl font-bold text-red-600">${detailItem.sale_price}</span>
                             <span className="text-sm text-neutral-400 line-through">${detailItem.price}</span>
                           </>
                         ) : detailItem.price ? (
                           <span className="text-2xl font-bold">${detailItem.price}</span>
                         ) : (
                           <span className="text-sm text-neutral-400 italic">Price not set</span>
                         )}
                      </div>
                      {detailItem.sale_end_date && detailItem.sale_price && (
                         <p className="text-xs text-amber-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Sale ends: {format(new Date(detailItem.sale_end_date), "PPP")}
                         </p>
                      )}
                   </div>

                   <div>
                      <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-1">Details</h4>
                      <div className="space-y-2 text-sm">
                         <div className="flex justify-between border-b border-neutral-100 pb-1">
                            <span className="text-neutral-500">Brand</span>
                            <span className="font-medium">{detailItem.brand || "-"}</span>
                         </div>
                         <div className="flex justify-between border-b border-neutral-100 pb-1">
                            <span className="text-neutral-500">Material</span>
                            <span className="font-medium">{detailItem.material || "-"}</span>
                         </div>
                         {detailItem.metal_type && (
                            <div className="flex justify-between border-b border-neutral-100 pb-1">
                               <span className="text-neutral-500">Metal</span>
                               <span className="font-medium">{detailItem.metal_type}</span>
                            </div>
                         )}
                         {detailItem.gemstone_type && (
                            <div className="flex justify-between border-b border-neutral-100 pb-1">
                               <span className="text-neutral-500">Gemstone</span>
                               <span className="font-medium">{detailItem.gemstone_type}</span>
                            </div>
                         )}
                         {detailItem.collection_name && (
                            <div className="flex justify-between border-b border-neutral-100 pb-1">
                               <span className="text-neutral-500">Collection</span>
                               <span className="font-medium">{detailItem.collection_name}</span>
                            </div>
                         )}
                         {detailItem.material_options?.length > 0 && (
                            <div className="flex justify-between border-b border-neutral-100 pb-1">
                               <span className="text-neutral-500">Available In</span>
                               <span className="font-medium text-right">{detailItem.material_options.join(", ")}</span>
                            </div>
                         )}
                         <div className="flex justify-between border-b border-neutral-100 pb-1">
                            <span className="text-neutral-500">Type</span>
                            <span className="font-medium capitalize">{detailItem.type}</span>
                         </div>
                      </div>
                   </div>

                   {detailItem.description && (
                     <div>
                        <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-1">Description</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed">{detailItem.description}</p>
                     </div>
                   )}

                   <div className="pt-4 border-t border-neutral-100 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                         <Button 
                           className="w-full h-12 text-lg"
                           variant="outline"
                           onClick={() => addToCart(detailItem)}
                         >
                           <ShoppingBag className="w-4 h-4 mr-2" /> Add to Cart
                         </Button>
                         <Button 
                           className="w-full bg-neutral-900 text-white h-12 text-lg"
                           onClick={handleBuyNow}
                         >
                           Buy Now
                         </Button>
                      </div>
                   
                      <ReviewSection jewelryId={detailItem.id} />
                   </div>
                </div>
             </div>
           ) : isEditing && editItemData ? (
             <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Name</Label>
                     <Input value={editItemData.name} onChange={(e) => setEditItemData({...editItemData, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Brand</Label>
                     <Input value={editItemData.brand} onChange={(e) => setEditItemData({...editItemData, brand: e.target.value})} />
                   </div>
                </div>

                {/* Sales Management Section */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-4">
                   <h3 className="font-medium text-amber-800 flex items-center gap-2"><Percent className="w-4 h-4" /> Sales Management</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label>Regular Price ($)</Label>
                         <Input 
                           type="number"
                           value={editItemData.price || ""}
                           onChange={(e) => setEditItemData({...editItemData, price: parseFloat(e.target.value)})}
                         />
                      </div>
                      <div className="space-y-2">
                         <Label>Sale Price ($)</Label>
                         <Input 
                           type="number"
                           value={editItemData.sale_price || ""}
                           onChange={(e) => setEditItemData({...editItemData, sale_price: parseFloat(e.target.value)})}
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Sale End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal bg-white"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editItemData.sale_end_date ? format(new Date(editItemData.sale_end_date), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editItemData.sale_end_date ? new Date(editItemData.sale_end_date) : undefined}
                            onSelect={(date) => setEditItemData({...editItemData, sale_end_date: date ? date.toISOString() : ""})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label>Description</Label>
                   <Textarea value={editItemData.description} onChange={(e) => setEditItemData({...editItemData, description: e.target.value})} />
                </div>

                <div className="flex gap-2 justify-end">
                   <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                   <Button onClick={() => updateMutation.mutate({ id: detailItem.id, data: editItemData })}>Save Changes</Button>
                </div>
             </div>
           ) : null}
         </DialogContent>
      </Dialog>

      {/* Search and Filters */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems?.length === 0 ? (
            <div className="col-span-full py-24 text-center">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ShoppingBag className="w-10 h-10 text-neutral-300" />
              </div>
              <p className="text-neutral-400 text-lg font-light italic">{t.jewelryBox?.empty || "Votre écrin est vide pour le moment."}</p>
            </div>
          ) : (
            filteredItems?.map((item) => {
              const stats = getRatingStats(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  className="group bg-white rounded-[2rem] overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer relative"
                  onClick={() => setDetailItem(item)}
                >
                  <div className="aspect-[4/5] bg-neutral-100 relative overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                    <SalesBadge price={item.price} salePrice={item.sale_price} endDate={item.sale_end_date} />

                    <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                       <Button
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur hover:bg-white text-neutral-900 shadow-lg"
                        onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur hover:bg-red-50 text-neutral-900 hover:text-red-500 shadow-lg"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}
                        >
                        <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="absolute top-4 left-4">
                        <Button
                          variant="secondary"
                          size="icon"
                          className={`h-10 w-10 rounded-full shadow-lg backdrop-blur transition-all duration-300 ${isWishlisted(item.id) ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/90 hover:bg-white text-neutral-400 hover:text-red-500"}`}
                          onClick={(e) => toggleWishlist(e, item.id)}
                        >
                          <Heart className={`w-4 h-4 ${isWishlisted(item.id) ? "fill-current" : ""}`} />
                        </Button>
                    </div>

                    {stats.count > 0 && (
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-neutral-900 text-xs font-semibold">{stats.avg.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="mb-2">
                       <p className="text-[10px] uppercase tracking-widest text-amber-600 font-medium mb-1">{item.brand || item.type}</p>
                       <h3 className="font-serif text-lg text-neutral-900 truncate">{item.name}</h3>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-baseline gap-2">
                         {item.sale_price && item.sale_price < item.price ? (
                           <>
                             <span className="text-lg font-medium text-neutral-900">${item.sale_price}</span>
                             <span className="text-sm text-neutral-400 line-through">${item.price}</span>
                           </>
                         ) : item.price ? (
                           <span className="text-lg font-medium text-neutral-900">${item.price}</span>
                         ) : (
                           <span className="text-sm text-neutral-400 italic">Sur demande</span>
                         )}
                       </div>
                       {item.tags?.length > 0 && (
                          <span className="text-xs text-neutral-400 italic">#{item.tags[0]}</span>
                       )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}