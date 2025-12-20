import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Loader2, Camera, Shirt, Trash2, Sparkles, Link as LinkIcon, X, CheckSquare, Square, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import ClothingFilters from '@/components/clothing/ClothingFilters';
import ARLiveTryOn from '@/components/studio/ARLiveTryOn';

export default function Closet() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    brand: "all",
    color: "all",
    material: "all",
    minPrice: "",
    maxPrice: ""
  });
  
  // Selection State
  const [selectedClothingIds, setSelectedClothingIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // AI Styling State
  const [stylistMode, setStylistMode] = useState('outfit'); // 'outfit' (clothes->jewelry) or 'jewelry' (jewelry->clothes)
  const [selectedJewelryForAI, setSelectedJewelryForAI] = useState(null); // For 'jewelry' mode
  const [occasionPrompt, setOccasionPrompt] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // AR Try-On State
  const [isARMode, setIsARMode] = useState(false);
  const [selectedClothingForAR, setSelectedClothingForAR] = useState(null);

  const [newItem, setNewItem] = useState({
    name: "",
    type: "top",
    brand: "",
    color: "",
    material: "",
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClothingItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothes'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClothingItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothes'] });
    }
  });

  const resetForm = () => {
    setNewItem({
      name: "",
      type: "top",
      brand: "",
      color: "",
      material: "",
      image_url: "",
      description: "",
      associated_jewelry_ids: []
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setNewItem(prev => ({ ...prev, image_url: result.file_url }));
      
      // Auto-tagging could be added here similar to JewelryBox
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const handleAiStyling = async () => {
    setAnalyzing(true);
    setAiSuggestion(null);

    try {
      let prompt = "";
      let file_urls = [];
      let jsonSchema = {};

      if (stylistMode === 'outfit') {
        // Mode: Clothes -> Jewelry
        const selectedClothes = clothes.filter(c => selectedClothingIds.includes(c.id));
        if (selectedClothes.length === 0) return;

        file_urls = selectedClothes.map(c => c.image_url);
        
        prompt = `
          As a personal stylist, suggest a jewelry combination for this outfit.
          
          Outfit Items:
          ${selectedClothes.map(c => `- ${c.type}: ${c.name} (${c.color}, ${c.material})`).join('\n')}
          
          Occasion/Style Context: ${occasionPrompt || "General elegant style"}
          
          Available Jewelry (ID: Name - Type - Material):
          ${jewelry?.map(j => `- ${j.id}: ${j.name} - ${j.type} - ${j.material}`).join('\n')}
          
          Task:
          Select 1-3 best matching jewelry items from the list above that complement the entire outfit.
          Explain why they work well together with the outfit and the occasion.
          
          Return JSON format:
          {
            "recommended_ids": ["id1", "id2"],
            "reasoning": "Explanation..."
          }
        `;
      } else {
        // Mode: Jewelry -> Clothes
        if (!selectedJewelryForAI) return;
        
        file_urls = [selectedJewelryForAI.image_url];
        
        prompt = `
          As a personal stylist, build an outfit from my closet that matches this jewelry piece.
          
          Jewelry Piece:
          - Type: ${selectedJewelryForAI.type}
          - Name: ${selectedJewelryForAI.name}
          - Material: ${selectedJewelryForAI.material}
          
          Occasion/Style Context: ${occasionPrompt || "General elegant style"}
          
          Available Closet Items (ID: Name - Type - Color):
          ${clothes?.map(c => `- ${c.id}: ${c.name} - ${c.type} - ${c.color} - ${c.material}`).join('\n')}
          
          Task:
          Select a complete outfit (e.g. top+bottom OR dress + optional shoes/bag) from the list above that matches the jewelry.
          Explain the style choice.
          
          Return JSON format:
          {
            "recommended_ids": ["id1", "id2"],
            "reasoning": "Explanation..."
          }
        `;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: file_urls,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_ids: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" }
          }
        }
      });

      if (response) {
        setAiSuggestion(response);
      }
    } catch (error) {
      console.error("AI Styling failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedClothingIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const uniqueBrands = React.useMemo(() => [...new Set(clothes?.map(c => c.brand).filter(Boolean))].sort(), [clothes]);
  const uniqueColors = React.useMemo(() => [...new Set(clothes?.map(c => c.color).filter(Boolean))].sort(), [clothes]);
  const uniqueMaterials = React.useMemo(() => [...new Set(clothes?.map(c => c.material).filter(Boolean))].sort(), [clothes]);

  const filteredClothes = clothes?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          item.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === "all" || item.type === filters.type;
    const matchesBrand = filters.brand === "all" || item.brand === filters.brand;
    const matchesColor = filters.color === "all" || item.color === filters.color;
    const matchesMaterial = filters.material === "all" || item.material === filters.material;

    const min = parseFloat(filters.minPrice);
    const max = parseFloat(filters.maxPrice);
    const itemPrice = item.price || 0;
    const matchesMinPrice = isNaN(min) || itemPrice >= min;
    const matchesMaxPrice = isNaN(max) || itemPrice <= max;

    return matchesSearch && matchesType && matchesBrand && matchesColor && matchesMaterial && matchesMinPrice && matchesMaxPrice;
  });

  const toggleJewelryAssociation = (id) => {
    setNewItem(prev => {
      const ids = prev.associated_jewelry_ids || [];
      if (ids.includes(id)) {
        return { ...prev, associated_jewelry_ids: ids.filter(i => i !== id) };
      } else {
        return { ...prev, associated_jewelry_ids: [...ids, id] };
      }
    });
  };

  if (isARMode && selectedClothingForAR) {
    return (
      <ARLiveTryOn 
        clothingImage={selectedClothingForAR.image_url}
        mode="clothing"
        onBack={() => {
          setIsARMode(false);
          setSelectedClothingForAR(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-neutral-900 mb-2">{t.closet?.title || "Mon Dressing"}</h1>
          <p className="text-neutral-500 max-w-lg">
            {t.closet?.subtitle || "Gérez vos vêtements."}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-6">
              <Plus className="w-4 h-4 mr-2" /> {t.closet?.addBtn || "Ajouter"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{t.closet?.newItem || "Nouveau Vêtement"}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6 py-4">
              
              {/* Left Col: Image */}
              <div className="space-y-4">
                 <div className="border-2 border-dashed border-neutral-200 rounded-xl aspect-[3/4] flex flex-col items-center justify-center relative bg-neutral-50 hover:bg-neutral-100 transition-colors overflow-hidden">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    ) : newItem.image_url ? (
                      <img src={newItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-neutral-400 p-4">
                        <Camera className="w-8 h-8 mb-2 mx-auto" />
                        <span className="text-sm">Ajouter une photo</span>
                      </div>
                    )}
                 </div>
                 
                 <div className="space-y-2">
                    <Label>{t.closet?.fields?.matchJewelry || "Bijoux associés"}</Label>
                    <div className="border rounded-md p-2 h-40 overflow-y-auto space-y-2">
                      {jewelry?.map(j => (
                        <div 
                          key={j.id} 
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                            newItem.associated_jewelry_ids?.includes(j.id) ? "bg-amber-50 border border-amber-200" : "hover:bg-neutral-50 border border-transparent"
                          }`}
                          onClick={() => toggleJewelryAssociation(j.id)}
                        >
                          <img src={j.image_url} className="w-8 h-8 rounded-md object-cover bg-neutral-100" />
                          <span className="text-xs font-medium truncate flex-1">{j.name}</span>
                          {newItem.associated_jewelry_ids?.includes(j.id) && <Sparkles className="w-3 h-3 text-amber-500" />}
                        </div>
                      ))}
                      {jewelry?.length === 0 && <p className="text-xs text-neutral-400 text-center py-4">Aucun bijou disponible</p>}
                    </div>
                 </div>
              </div>

              {/* Right Col: Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.closet?.fields?.name || "Nom"}</Label>
                  <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label>{t.closet?.fields?.type || "Catégorie"}</Label>
                    <Select value={newItem.type} onValueChange={v => setNewItem({...newItem, type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'].map(type => (
                           <SelectItem key={type} value={type}>
                             {t.closet?.types?.[type] || type}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.closet?.fields?.brand || "Marque"}</Label>
                    <Input value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label>{t.closet?.fields?.color || "Couleur"}</Label>
                    <Input value={newItem.color} onChange={e => setNewItem({...newItem, color: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.closet?.fields?.material || "Matière"}</Label>
                    <Input value={newItem.material} onChange={e => setNewItem({...newItem, material: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={newItem.description} 
                    onChange={e => setNewItem({...newItem, description: e.target.value})} 
                    className="h-24"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={!newItem.name || !newItem.image_url || createMutation.isPending}
                    onClick={() => createMutation.mutate(newItem)}
                  >
                    {createMutation.isPending ? "..." : t.common.save}
                  </Button>
                </div>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <ClothingFilters 
        filters={filters} 
        setFilters={setFilters} 
        uniqueBrands={uniqueBrands}
        uniqueColors={uniqueColors}
        uniqueMaterials={uniqueMaterials}
      />
      
      {/* Selection Mode Toggle - integrated below filters or kept separate? Keeping nearby for utility */}
      <div className="flex justify-end mt-2">
         <Button
             variant={selectionMode ? "secondary" : "ghost"}
             size="sm"
             onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedClothingIds([]);
             }}
             className={selectionMode ? "bg-amber-100 text-amber-900 border-amber-200" : "text-neutral-500"}
          >
            {selectionMode ? "Cancel Selection" : "Select Items"}
          </Button>
      </div>

      {/* Grid */}
      {clothesLoading ? (
         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-neutral-300" /></div>
      ) : filteredClothes?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-200">
           <Shirt className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
           <p className="text-neutral-500">Votre dressing est vide.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredClothes.map(item => (
            <motion.div
              key={item.id}
              layout
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-neutral-100 flex flex-col"
            >
              <div className="aspect-[3/4] bg-neutral-50 relative overflow-hidden">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                
                {/* Selection Checkbox */}
                {selectionMode && (
                  <div className="absolute top-2 right-2 z-10">
                     <button 
                        onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                        className={`w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center transition-colors ${selectedClothingIds.includes(item.id) ? 'text-amber-600' : 'text-neutral-300'}`}
                     >
                        {selectedClothingIds.includes(item.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                     </button>
                  </div>
                )}

                {/* Actions Overlay (only if not selecting) */}
                {!selectionMode && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                     <Button 
                        size="sm" 
                        className="bg-white text-neutral-900 hover:bg-amber-50"
                        onClick={() => {
                          setSelectedClothingForAR(item);
                          setIsARMode(true);
                        }}
                     >
                       <Video className="w-3 h-3 mr-2 text-blue-500" /> AR Try-On
                     </Button>
                     <Button 
                        size="sm" 
                        className="bg-white text-neutral-900 hover:bg-amber-50"
                        onClick={() => {
                          setSelectedClothingIds([item.id]);
                          setStylistMode('outfit');
                          setIsAIModalOpen(true);
                          setAiSuggestion(null);
                          setOccasionPrompt("");
                        }}
                     >
                       <Sparkles className="w-3 h-3 mr-2 text-amber-500" /> {t.closet?.aiMatch || "Styliste"}
                     </Button>
                     <Button 
                        size="icon" 
                        variant="destructive"
                        className="h-8 w-8 rounded-full"
                        onClick={() => deleteMutation.mutate(item.id)}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-neutral-900">{item.name}</h3>
                    <p className="text-xs text-neutral-500">{item.brand}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                   {item.type && <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{t.closet?.types?.[item.type] || item.type}</Badge>}
                   {item.material && <Badge variant="outline" className="text-[10px]">{item.material}</Badge>}
                </div>

                {item.associated_jewelry_ids?.length > 0 && (
                  <div className="mt-auto pt-3 border-t border-neutral-100">
                     <p className="text-[10px] text-neutral-400 mb-1 flex items-center gap-1">
                       <LinkIcon className="w-3 h-3" /> Associé à :
                     </p>
                     <div className="flex -space-x-2">
                        {jewelry?.filter(j => item.associated_jewelry_ids.includes(j.id)).slice(0, 4).map(j => (
                           <img key={j.id} src={j.image_url} className="w-6 h-6 rounded-full border border-white bg-white object-cover" title={j.name} />
                        ))}
                        {(jewelry?.filter(j => item.associated_jewelry_ids.includes(j.id)).length || 0) > 4 && (
                          <div className="w-6 h-6 rounded-full border border-white bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-500">
                            +
                          </div>
                        )}
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selection Bar */}
      <AnimatePresence>
        {selectionMode && selectedClothingIds.length > 0 && (
           <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-40"
           >
              <span className="font-medium text-sm whitespace-nowrap">{selectedClothingIds.length} {t.closet?.ai?.selection || "sélectionnés"}</span>
              <div className="h-4 w-px bg-neutral-700" />
              <Button 
                 size="sm" 
                 className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4"
                 onClick={() => {
                   setStylistMode('outfit');
                   setIsAIModalOpen(true);
                   setAiSuggestion(null);
                   setOccasionPrompt("");
                 }}
              >
                <Sparkles className="w-3 h-3 mr-2" /> {t.closet?.aiMatch || "Styliste"}
              </Button>
           </motion.div>
        )}
      </AnimatePresence>

      {/* AI Stylist Modal */}
      <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> {t.closet?.aiMatch || "Styliste IA"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
             {/* Mode Switcher */}
             <div className="flex p-1 bg-neutral-100 rounded-lg">
                <button
                   onClick={() => { setStylistMode('outfit'); setAiSuggestion(null); }}
                   className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${stylistMode === 'outfit' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                   {t.closet?.ai?.modeOutfit || "Compléter ma tenue"}
                </button>
                <button
                   onClick={() => { setStylistMode('jewelry'); setAiSuggestion(null); }}
                   className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${stylistMode === 'jewelry' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                   {t.closet?.ai?.modeJewelry || "Assortir un bijou"}
                </button>
             </div>

             {/* Selected Items Display */}
             {stylistMode === 'outfit' ? (
               <div className="space-y-3">
                 <Label className="text-xs uppercase text-neutral-500 tracking-wider">{t.closet?.ai?.selectClothes || "Vêtements sélectionnés"}</Label>
                 <div className="flex gap-3 overflow-x-auto pb-2">
                    {selectedClothingIds.length > 0 ? (
                       clothes?.filter(c => selectedClothingIds.includes(c.id)).map(c => (
                          <div key={c.id} className="relative w-16 h-20 shrink-0 rounded-lg overflow-hidden border border-neutral-200">
                             <img src={c.image_url} className="w-full h-full object-cover" />
                             {selectionMode && (
                               <button 
                                 onClick={() => toggleSelection(c.id)}
                                 className="absolute top-0 right-0 bg-black/50 text-white p-0.5"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                             )}
                          </div>
                       ))
                    ) : (
                       <p className="text-sm text-neutral-400 italic py-2">Sélectionnez des vêtements dans votre dressing</p>
                    )}
                 </div>
               </div>
             ) : (
               <div className="space-y-3">
                 <Label className="text-xs uppercase text-neutral-500 tracking-wider">{t.closet?.ai?.selectJewel || "Bijou vedette"}</Label>
                 {selectedJewelryForAI ? (
                    <div className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 rounded-xl relative">
                       <img src={selectedJewelryForAI.image_url} className="w-12 h-12 rounded-lg object-cover bg-white" />
                       <div className="flex-1">
                          <p className="font-medium text-sm">{selectedJewelryForAI.name}</p>
                          <p className="text-xs text-neutral-500 capitalize">{selectedJewelryForAI.type}</p>
                       </div>
                       <button onClick={() => setSelectedJewelryForAI(null)} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
                    </div>
                 ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border rounded-xl bg-neutral-50">
                       {jewelry?.map(j => (
                          <div 
                             key={j.id} 
                             onClick={() => setSelectedJewelryForAI(j)}
                             className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-amber-400 transition-all border border-neutral-200 bg-white"
                          >
                             <img src={j.image_url} className="w-full h-full object-cover" />
                          </div>
                       ))}
                    </div>
                 )}
               </div>
             )}

             <div className="space-y-2">
                <Label>{t.closet?.ai?.promptLabel || "Quelle est l'occasion ?"}</Label>
                <Input 
                   placeholder={t.closet?.ai?.promptPlaceholder || "Ex: Mariage, Travail..."}
                   value={occasionPrompt}
                   onChange={e => setOccasionPrompt(e.target.value)}
                />
             </div>

             <Button 
                onClick={handleAiStyling}
                disabled={analyzing || (stylistMode === 'outfit' && selectedClothingIds.length === 0) || (stylistMode === 'jewelry' && !selectedJewelryForAI)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
             >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {t.closet?.ai?.btn || "Suggérer une combinaison"}
             </Button>

             <AnimatePresence>
                {aiSuggestion && (
                   <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-2"
                   >
                      <div className="flex items-center gap-2 text-amber-700 font-serif font-medium">
                         <div className="h-px bg-amber-200 flex-1" />
                         {t.closet?.ai?.resultTitle || "Suggestions"}
                         <div className="h-px bg-amber-200 flex-1" />
                      </div>
                      
                      <div className="bg-amber-50/50 p-4 rounded-xl text-sm text-neutral-700 leading-relaxed border border-amber-100">
                         {aiSuggestion.reasoning}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                         {stylistMode === 'outfit' ? (
                            jewelry?.filter(j => aiSuggestion.recommended_ids?.includes(j.id)).map(j => (
                                <div key={j.id} className="bg-white p-2 rounded-lg border border-neutral-100 shadow-sm text-center">
                                   <div className="aspect-square bg-neutral-50 rounded-md overflow-hidden mb-2">
                                      <img src={j.image_url} className="w-full h-full object-cover" />
                                   </div>
                                   <p className="text-xs font-medium truncate">{j.name}</p>
                                </div>
                             ))
                         ) : (
                            clothes?.filter(c => aiSuggestion.recommended_ids?.includes(c.id)).map(c => (
                                <div key={c.id} className="bg-white p-2 rounded-lg border border-neutral-100 shadow-sm text-center">
                                   <div className="aspect-[3/4] bg-neutral-50 rounded-md overflow-hidden mb-2">
                                      <img src={c.image_url} className="w-full h-full object-cover" />
                                   </div>
                                   <p className="text-xs font-medium truncate">{c.name}</p>
                                </div>
                             ))
                         )}
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}