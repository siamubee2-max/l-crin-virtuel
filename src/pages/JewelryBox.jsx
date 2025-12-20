import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Loader2, Camera, Tag, Trash2, Filter, Star, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import StarRating from '@/components/reviews/StarRating';
import ReviewSection from '@/components/reviews/ReviewSection';

export default function JewelryBox() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null); // For detail view dialog
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [newItem, setNewItem] = useState({
    name: "",
    type: "necklace",
    brand: "",
    material: "",
    image_url: "",
    description: "",
    tags: []
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
        image_url: "",
        description: "",
        tags: []
      });
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

  const filteredItems = jewelryItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-neutral-900 mb-2">{t.jewelryBox?.title || "Mon Écrin"}</h1>
          <p className="text-neutral-500 max-w-lg">
            {t.jewelryBox?.subtitle || "Cataloguez vos bijoux précieux."}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-6">
              <Plus className="w-4 h-4 mr-2" /> {t.jewelryBox?.addBtn || "Ajouter un bijou"}
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
                  <Label>{t.jewelryBox?.fields?.material || "Matière"}</Label>
                  <Input 
                    value={newItem.material}
                    onChange={(e) => setNewItem({...newItem, material: e.target.value})}
                  />
                </div>
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
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
         <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="font-serif text-2xl">{detailItem?.name}</DialogTitle>
           </DialogHeader>

           {detailItem && (
             <div className="grid md:grid-cols-2 gap-8 py-4">
                <div className="space-y-4">
                  <div className="aspect-square bg-neutral-50 rounded-xl overflow-hidden">
                     <img src={detailItem.image_url} alt={detailItem.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detailItem.tags?.map((tag, i) => (
                       <span key={i} className="text-xs bg-neutral-100 px-2 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
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

                   <div className="pt-4 border-t border-neutral-100">
                      <ReviewSection jewelryId={detailItem.id} />
                   </div>
                </div>
             </div>
           )}
         </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder={t.jewelryBox?.searchPlaceholder || "Rechercher..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-neutral-200"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "Tout" },
            { id: "necklace", label: "Colliers" },
            { id: "earrings", label: "Boucles" },
            { id: "ring", label: "Bagues" },
            { id: "bracelet", label: "Bracelets" },
            { id: "set", label: "Parures" },
          ].map(filter => (
            <Button
              key={filter.id}
              variant={typeFilter === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(filter.id)}
              className={typeFilter === filter.id ? "bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600"}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems?.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-neutral-200">
              <p className="text-neutral-500 mb-4">{t.jewelryBox?.empty || "Vide"}</p>
            </div>
          ) : (
            filteredItems?.map((item) => {
              const stats = getRatingStats(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-neutral-100 cursor-pointer"
                  onClick={() => setDetailItem(item)}
                >
                  <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                       <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-neutral-700"
                        onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-red-500/80 hover:bg-red-600"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {stats.count > 0 && (
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-white text-xs font-medium">{stats.avg.toFixed(1)}</span>
                        <span className="text-white/60 text-[10px]">({stats.count})</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="w-full">
                        <h3 className="font-serif font-medium text-neutral-900 truncate">{item.name}</h3>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">{item.brand || item.type}</p>
                      </div>
                    </div>
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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