import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Camera, Sparkles, Trash2, Box, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function JewelryCollection() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: "",
    type: "necklace",
    brand: "",
    material: "",
    image_url: "",
    description: "",
    tags: []
  });

  // Fetch User's Personal Jewelry
  const { data: myJewelry, isLoading } = useQuery({
    queryKey: ['myJewelry'],
    queryFn: async () => {
        const user = await base44.auth.me();
        const items = await base44.entities.UserJewelry.list('-created_date');
        // Double check RLS or filter
        return items.filter(i => i.created_by === user.email);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserJewelry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJewelry'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserJewelry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJewelry'] });
    }
  });

  const resetForm = () => {
    setNewItem({
        name: "",
        type: "necklace",
        brand: "",
        material: "",
        image_url: "",
        description: "",
        tags: []
    });
  };

  const analyzeImage = async (imageUrl) => {
    setAnalyzing(true);
    try {
      const prompt = `
        Analyze this jewelry image.
        Extract the following details in JSON format:
        - name: A short, elegant title for the item.
        - type: One of [earrings, necklace, ring, bracelet, anklet, set, other].
        - material: The likely material (e.g., Gold, Silver, Diamond, Pearl).
        - tags: An array of 3 descriptive tags.
        - description: A brief description.
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-xl font-serif">My Personal Collection</h3>
           <p className="text-sm text-neutral-500">Curate your own jewelry pieces.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neutral-900 text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Add to Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              
              {/* Image Upload */}
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
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : analyzing ? (
                  <div className="flex flex-col items-center text-amber-600">
                    <Sparkles className="w-8 h-8 animate-pulse mb-2" />
                    <span className="text-sm font-medium">AI Analyzing...</span>
                  </div>
                ) : newItem.image_url ? (
                  <div className="relative h-48 w-full">
                    <img 
                      src={newItem.image_url} 
                      alt="Preview" 
                      className="h-full w-full object-contain rounded-md"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-neutral-400">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Upload Photo</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Name</Label>
                       <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label>Type</Label>
                       <Select value={newItem.type} onValueChange={v => setNewItem({...newItem, type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="necklace">Necklace</SelectItem>
                             <SelectItem value="earrings">Earrings</SelectItem>
                             <SelectItem value="ring">Ring</SelectItem>
                             <SelectItem value="bracelet">Bracelet</SelectItem>
                             <SelectItem value="anklet">Anklet</SelectItem>
                             <SelectItem value="set">Set</SelectItem>
                             <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Brand</Label>
                       <Input value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value})} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                       <Label>Material</Label>
                       <Input value={newItem.material} onChange={e => setNewItem({...newItem, material: e.target.value})} placeholder="e.g. Gold" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="h-20" />
                 </div>

                 <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                       {newItem.tags.map((tag, i) => (
                          <span key={i} className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                             {tag}
                             <button onClick={() => setNewItem({...newItem, tags: newItem.tags.filter((_, idx) => idx !== i)})} className="hover:text-red-500">×</button>
                          </span>
                       ))}
                       <Input 
                          placeholder="+ Tag (Press Enter)" 
                          className="w-32 h-7 text-xs" 
                          onKeyDown={e => {
                             if(e.key === 'Enter' && e.currentTarget.value) {
                                setNewItem({...newItem, tags: [...newItem.tags, e.currentTarget.value]});
                                e.currentTarget.value = "";
                             }
                          }} 
                        />
                    </div>
                 </div>
              </div>

              <Button 
                onClick={() => createMutation.mutate(newItem)} 
                className="w-full bg-neutral-900 text-white"
                disabled={!newItem.name || !newItem.image_url || createMutation.isPending}
              >
                {createMutation.isPending ? "Saving..." : "Add to Collection"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-neutral-300" /></div>
      ) : myJewelry?.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-neutral-200 text-center">
          <Box className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-500">Your collection is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           <AnimatePresence>
             {myJewelry.map((item) => (
               <motion.div 
                 key={item.id}
                 layout
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="group bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-all relative"
               >
                 <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button
                         size="icon"
                         variant="destructive"
                         className="h-8 w-8 rounded-full shadow-sm"
                         onClick={() => deleteMutation.mutate(item.id)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
                 <div className="p-3">
                    <h4 className="font-medium text-neutral-900 truncate">{item.name}</h4>
                    <p className="text-xs text-neutral-500 capitalize">{item.brand || item.type}</p>
                    {item.tags && (
                       <div className="flex gap-1 mt-2 overflow-hidden">
                          {item.tags.slice(0, 2).map((t, i) => <span key={i} className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">{t}</span>)}
                       </div>
                    )}
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
      )}
    </div>
  );
}