import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Loader2, Camera, Shirt, Trash2, Sparkles, Link as LinkIcon, X, CheckSquare, Square, Layers, Share2, PlayCircle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ShareButton from "@/components/common/ShareButton";

export default function Closet() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOutfitDialogOpen, setIsOutfitDialogOpen] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Selection State
  const [selectedClothingIds, setSelectedClothingIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Outfit Creation State
  const [newOutfit, setNewOutfit] = useState({
    name: "",
    description: "",
    occasion: "Casual",
    jewelry_item_ids: [],
    tags: []
  });

  const [newItem, setNewItem] = useState({
    name: "",
    type: "top",
    brand: "",
    color: "",
    material: "",
    style: "",
    occasion: [],
    tags: [],
    image_url: "",
    description: "",
    associated_jewelry_ids: []
  });

  // Data Fetching
  const { data: clothes, isLoading: clothesLoading } = useQuery({
    queryKey: ['clothes'],
    queryFn: () => base44.entities.ClothingItem.list('-created_date'),
  });

  const { data: jewelry, isLoading: jewelryLoading } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const { data: outfits, isLoading: outfitsLoading } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => base44.entities.Outfit.list('-created_date'),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClothingItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothes'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const createOutfitMutation = useMutation({
    mutationFn: (data) => base44.entities.Outfit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      setIsOutfitDialogOpen(false);
      setSelectionMode(false);
      setSelectedClothingIds([]);
      setNewOutfit({
        name: "",
        description: "",
        occasion: "Casual",
        jewelry_item_ids: [],
        tags: []
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClothingItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clothes'] })
  });

  const deleteOutfitMutation = useMutation({
    mutationFn: (id) => base44.entities.Outfit.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outfits'] })
  });

  const resetForm = () => {
    setNewItem({
      name: "",
      type: "top",
      brand: "",
      color: "",
      material: "",
      style: "",
      occasion: [],
      tags: [],
      image_url: "",
      description: "",
      associated_jewelry_ids: []
    });
  };

  const analyzeClothingImage = async (imageUrl) => {
    setAnalyzing(true);
    try {
      const prompt = `
        Analyze this clothing item image.
        Extract details in JSON format:
        - color: Primary color.
        - material: Likely material (e.g. Cotton, Denim).
        - style: Style vibe (e.g. Minimalist, Boho, Streetwear).
        - occasion: Array of suitable occasions (e.g. Work, Casual, Party).
        - tags: Array of descriptive tags.
        - description: Brief description.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            color: { type: "string" },
            material: { type: "string" },
            style: { type: "string" },
            occasion: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" } },
            description: { type: "string" }
          }
        }
      });

      if (response) {
        setNewItem(prev => ({
          ...prev,
          color: response.color || prev.color,
          material: response.material || prev.material,
          style: response.style || prev.style,
          occasion: response.occasion || [],
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
      await analyzeClothingImage(result.file_url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedClothingIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredClothes = clothes?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-neutral-900 mb-2">{t.closet?.title || "Mon Dressing"}</h1>
          <p className="text-neutral-500 max-w-lg">
            Manage your wardrobe and create outfits.
          </p>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="bg-white border border-neutral-100 p-1">
          <TabsTrigger value="items" className="gap-2">
            <Shirt className="w-4 h-4" /> Clothes
          </TabsTrigger>
          <TabsTrigger value="outfits" className="gap-2">
            <Layers className="w-4 h-4" /> Outfits
          </TabsTrigger>
        </TabsList>

        {/* ITEMS TAB */}
        <TabsContent value="items" className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input 
                placeholder="Search by name, color, tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-neutral-200"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
               <Button
                 variant={selectionMode ? "secondary" : "outline"}
                 size="sm"
                 onClick={() => {
                    setSelectionMode(!selectionMode);
                    if (selectionMode) setSelectedClothingIds([]);
                 }}
                 className={selectionMode ? "bg-amber-100 text-amber-900 border-amber-200" : "border-neutral-200"}
               >
                 {selectionMode ? "Cancel Selection" : "Select Items"}
               </Button>
               
               <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-neutral-900 text-white rounded-full px-4 ml-auto" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">New Clothing Item</DialogTitle>
                  </DialogHeader>
                  <div className="grid md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                       <div className="border-2 border-dashed border-neutral-200 rounded-xl aspect-[3/4] flex flex-col items-center justify-center relative bg-neutral-50 hover:bg-neutral-100 transition-colors overflow-hidden">
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          {uploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                          ) : analyzing ? (
                            <div className="flex flex-col items-center text-amber-600">
                               <Sparkles className="w-8 h-8 animate-pulse mb-2" />
                               <span className="text-xs font-medium">AI Analyzing...</span>
                            </div>
                          ) : newItem.image_url ? (
                            <img src={newItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center text-neutral-400 p-4">
                              <Camera className="w-8 h-8 mb-2 mx-auto" />
                              <span className="text-sm">Upload Photo</span>
                            </div>
                          )}
                       </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Silk Blouse" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={newItem.type} onValueChange={v => setNewItem({...newItem, type: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'].map(type => (
                                 <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <Input value={newItem.color} onChange={e => setNewItem({...newItem, color: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Material</Label>
                          <Input value={newItem.material} onChange={e => setNewItem({...newItem, material: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Style</Label>
                          <Input value={newItem.style} onChange={e => setNewItem({...newItem, style: e.target.value})} placeholder="e.g. Boho" />
                        </div>
                      </div>
                      <div className="space-y-2">
                         <Label>Occasions</Label>
                         <Input value={newItem.occasion?.join(", ")} onChange={e => setNewItem({...newItem, occasion: e.target.value.split(",").map(s => s.trim())})} placeholder="e.g. Work, Party" />
                      </div>
                      <div className="space-y-2">
                         <Label>Tags</Label>
                         <div className="flex flex-wrap gap-2">
                            {newItem.tags?.map((tag, i) => (
                               <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                         </div>
                      </div>
                      <Button className="w-full bg-neutral-900 text-white" disabled={!newItem.name || !newItem.image_url} onClick={() => createMutation.mutate(newItem)}>
                         {createMutation.isPending ? "Saving..." : "Save Item"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
               </Dialog>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
               {['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag'].map(type => (
                 <Button
                   key={type}
                   variant={typeFilter === type ? "default" : "outline"}
                   size="sm"
                   onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
                   className={`capitalize ${typeFilter === type ? "bg-neutral-900 text-white" : ""}`}
                 >
                   {type}
                 </Button>
               ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
             {filteredClothes?.map(item => (
                <motion.div
                   key={item.id}
                   layout
                   className={`group bg-white rounded-xl overflow-hidden border transition-all relative ${selectedClothingIds.includes(item.id) ? 'border-amber-500 ring-2 ring-amber-100' : 'border-neutral-100 hover:shadow-md'}`}
                   onClick={() => selectionMode && toggleSelection(item.id)}
                >
                   <div className="aspect-[3/4] relative">
                      <img src={item.image_url} className="w-full h-full object-cover" />
                      {selectionMode && (
                        <div className="absolute top-2 right-2">
                           <div className={`w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center ${selectedClothingIds.includes(item.id) ? 'text-amber-600' : 'text-neutral-300'}`}>
                              {selectedClothingIds.includes(item.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                           </div>
                        </div>
                      )}
                      {!selectionMode && (
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}>
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                      )}
                   </div>
                   <div className="p-3">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-neutral-500 capitalize">{item.color} • {item.type}</p>
                   </div>
                </motion.div>
             ))}
          </div>
        </TabsContent>

        {/* OUTFITS TAB */}
        <TabsContent value="outfits" className="space-y-6">
           {outfitsLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
           ) : outfits?.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                <p className="text-neutral-500 mb-4">No outfits created yet.</p>
                <Button variant="outline" onClick={() => {
                   document.querySelector('[data-value="items"]').click();
                   setSelectionMode(true);
                }}>
                   Select items to create one
                </Button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {outfits.map(outfit => (
                   <div key={outfit.id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-all">
                      {/* Outfit Collage Preview */}
                      <div className="aspect-video bg-neutral-50 p-2 grid grid-cols-4 gap-1 items-center justify-items-center overflow-hidden">
                         {clothes?.filter(c => outfit.clothing_item_ids?.includes(c.id)).slice(0, 4).map((c, i) => (
                            <img key={i} src={c.image_url} className="w-full h-full object-cover rounded-md" />
                         ))}
                         {jewelry?.filter(j => outfit.jewelry_item_ids?.includes(j.id)).slice(0, 2).map((j, i) => (
                            <img key={i} src={j.image_url} className="w-full h-full object-cover rounded-md" />
                         ))}
                      </div>
                      <div className="p-4">
                         <div className="flex justify-between items-start">
                            <div>
                               <h3 className="font-serif text-lg text-neutral-900">{outfit.name}</h3>
                               <p className="text-xs text-neutral-500">{outfit.occasion} • {outfit.clothing_item_ids?.length || 0} items</p>
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-neutral-400 hover:text-red-500"
                              onClick={() => deleteOutfitMutation.mutate(outfit.id)}
                            >
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                         <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{outfit.description}</p>
                         
                         <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
                            <Button 
                               className="flex-1 bg-amber-600 text-white hover:bg-amber-700"
                               onClick={() => navigate(createPageUrl('OutfitStudio') + `?outfitId=${outfit.id}`)}
                            >
                               <PlayCircle className="w-4 h-4 mr-2" /> Try On
                            </Button>
                            <ShareButton 
                               text={`Check out my outfit: ${outfit.name}`}
                               imageUrl={outfit.image_url} // If we had one, or fallback
                               variant="outline"
                               className="flex-1"
                            >
                               <Share2 className="w-4 h-4 mr-2" /> Share
                            </ShareButton>
                            {/* Community Share Button */}
                             <Button
                                variant="outline"
                                className={`flex-1 ${outfit.is_public ? "text-green-600 border-green-200 bg-green-50" : ""}`}
                                onClick={() => {
                                  // Simplified toggle for public/private and seeking advice
                                  // In a real app, this would open a dialog to configure sharing options
                                  const newPublicState = !outfit.is_public;
                                  base44.entities.Outfit.update(outfit.id, { 
                                    is_public: newPublicState,
                                    seeking_advice: newPublicState ? true : false // Default to seeking advice when shared for now or could be separate
                                  }).then(() => queryClient.invalidateQueries({ queryKey: ['outfits'] }));
                                }}
                             >
                                <Users className="w-4 h-4 mr-2" /> {outfit.is_public ? "Posted" : "Post to Community"}
                             </Button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
           )}
        </TabsContent>
      </Tabs>

      {/* Floating Action Bar for Selection */}
      <AnimatePresence>
        {selectionMode && selectedClothingIds.length > 0 && (
           <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50"
           >
              <span className="font-medium text-sm whitespace-nowrap">{selectedClothingIds.length} items selected</span>
              <div className="h-4 w-px bg-neutral-700" />
              
              <Dialog open={isOutfitDialogOpen} onOpenChange={setIsOutfitDialogOpen}>
                 <DialogTrigger asChild>
                    <Button 
                       size="sm" 
                       className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4"
                    >
                       <Layers className="w-3 h-3 mr-2" /> Create Outfit
                    </Button>
                 </DialogTrigger>
                 <DialogContent>
                    <DialogHeader>
                       <DialogTitle>Save Outfit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                       <div className="space-y-2">
                          <Label>Outfit Name</Label>
                          <Input value={newOutfit.name} onChange={e => setNewOutfit({...newOutfit, name: e.target.value})} placeholder="e.g. Summer Date Night" />
                       </div>
                       <div className="space-y-2">
                          <Label>Occasion</Label>
                          <Select value={newOutfit.occasion} onValueChange={v => setNewOutfit({...newOutfit, occasion: v})}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                {['Casual', 'Work', 'Party', 'Formal', 'Vacation'].map(o => (
                                   <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label>Add Jewelry (Optional)</Label>
                          <div className="flex gap-2 overflow-x-auto pb-2 border rounded-md p-2 bg-neutral-50">
                             {jewelry?.map(j => (
                                <div 
                                   key={j.id} 
                                   className={`w-12 h-12 shrink-0 rounded border cursor-pointer ${newOutfit.jewelry_item_ids.includes(j.id) ? 'border-amber-500 ring-1 ring-amber-500' : 'border-neutral-200'}`}
                                   onClick={() => {
                                      const ids = newOutfit.jewelry_item_ids;
                                      setNewOutfit({
                                         ...newOutfit, 
                                         jewelry_item_ids: ids.includes(j.id) ? ids.filter(id => id !== j.id) : [...ids, j.id]
                                      })
                                   }}
                                >
                                   <img src={j.image_url} className="w-full h-full object-cover" />
                                </div>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea value={newOutfit.description} onChange={e => setNewOutfit({...newOutfit, description: e.target.value})} />
                       </div>
                       <Button 
                          className="w-full bg-neutral-900 text-white" 
                          disabled={!newOutfit.name}
                          onClick={() => createOutfitMutation.mutate({
                             ...newOutfit,
                             clothing_item_ids: selectedClothingIds
                          })}
                       >
                          Save Outfit
                       </Button>
                    </div>
                 </DialogContent>
              </Dialog>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}