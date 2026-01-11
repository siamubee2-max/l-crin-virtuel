import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { base44 } from '@/api/apiClient';
import { cn } from "@/lib/utils";

const AESTHETICS = [
  { id: "minimalist", label: "Minimalist", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop" },
  { id: "boho", label: "Bohemian", image: "https://images.unsplash.com/photo-1540483761890-a1f7be05d99f?q=80&w=2000&auto=format&fit=crop" },
  { id: "glam", label: "Glamour", image: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=2070&auto=format&fit=crop" },
  { id: "classic", label: "Classic", image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=2070&auto=format&fit=crop" },
  { id: "vintage", label: "Vintage", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop" },
  { id: "edgy", label: "Edgy/Rock", image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2070&auto=format&fit=crop" }
];

const METALS = ["Yellow Gold", "White Gold", "Rose Gold", "Silver", "Platinum", "Mixed Metals"];
const CUTS = ["Round", "Princess", "Emerald", "Oval", "Marquise", "Cushion", "Pear"];

export default function StyleProfileEditor({ preferences, onChange, onSave, isSaving }) {
  const [uploading, setUploading] = useState(false);

  const handleToggle = (category, value) => {
    const current = preferences[category] || [];
    const updated = current.includes(value)
      ? current.filter(i => i !== value)
      : [...current, value];
    onChange({ ...preferences, [category]: updated });
  };

  const handleChange = (key, value) => {
    onChange({ ...preferences, [key]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const currentImages = preferences.inspiration_images || [];
      onChange({ ...preferences, inspiration_images: [...currentImages, result.file_url] });
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const currentImages = preferences.inspiration_images || [];
    const updated = currentImages.filter((_, i) => i !== index);
    onChange({ ...preferences, inspiration_images: updated });
  };

  return (
    <div className="space-y-8">
      {/* Aesthetics Selection */}
      <div className="space-y-4">
        <Label className="text-lg font-serif">Your Aesthetic</Label>
        <p className="text-sm text-neutral-500">Select the styles that resonate with you most.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {AESTHETICS.map((style) => {
             const isSelected = preferences.aesthetics?.includes(style.id);
             return (
               <div 
                 key={style.id}
                 onClick={() => handleToggle('aesthetics', style.id)}
                 className={cn(
                   "relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group transition-all",
                   isSelected ? "ring-2 ring-amber-600 ring-offset-2" : "hover:opacity-90"
                 )}
               >
                 <img src={style.image} alt={style.label} className="w-full h-full object-cover" />
                 <div className={cn(
                   "absolute inset-0 flex items-center justify-center transition-colors",
                   isSelected ? "bg-black/40" : "bg-black/20 group-hover:bg-black/30"
                 )}>
                   <span className="text-white font-medium text-lg tracking-wide">{style.label}</span>
                   {isSelected && <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1"><CheckIcon className="w-3 h-3 text-white" /></div>}
                 </div>
               </div>
             );
          })}
        </div>
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Jewelry Preferences Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Preference Type */}
        <div className="space-y-4">
           <Label className="font-medium">Preference Style</Label>
           <RadioGroup 
              value={preferences.jewelry_preference_type || "mix"} 
              onValueChange={(val) => handleChange('jewelry_preference_type', val)}
              className="flex flex-col gap-3"
           >
              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-neutral-50 cursor-pointer">
                <RadioGroupItem value="minimalist" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer flex-1">Minimalist & Delicate</Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-neutral-50 cursor-pointer">
                <RadioGroupItem value="statement" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer flex-1">Bold & Statement</Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-neutral-50 cursor-pointer">
                <RadioGroupItem value="mix" id="r3" />
                <Label htmlFor="r3" className="cursor-pointer flex-1">A Balanced Mix</Label>
              </div>
           </RadioGroup>
        </div>

        {/* Metals */}
        <div className="space-y-4">
           <Label className="font-medium">Preferred Metals</Label>
           <div className="grid grid-cols-2 gap-2">
              {METALS.map(metal => (
                <div key={metal} className="flex items-center space-x-2">
                   <Checkbox 
                      id={`metal-${metal}`}
                      checked={preferences.preferred_metals?.includes(metal)}
                      onCheckedChange={() => handleToggle('preferred_metals', metal)}
                   />
                   <label htmlFor={`metal-${metal}`} className="text-sm cursor-pointer">{metal}</label>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Gemstone Cuts */}
      <div className="space-y-4">
        <Label className="font-medium">Favorite Gemstone Cuts</Label>
        <div className="flex flex-wrap gap-2">
           {CUTS.map(cut => {
             const isSelected = preferences.preferred_gemstone_cuts?.includes(cut);
             return (
               <button
                 key={cut}
                 onClick={() => handleToggle('preferred_gemstone_cuts', cut)}
                 className={cn(
                   "px-3 py-1.5 rounded-full text-sm border transition-all",
                   isSelected 
                     ? "bg-neutral-900 text-white border-neutral-900" 
                     : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                 )}
               >
                 {cut}
               </button>
             );
           })}
        </div>
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Inspiration Board */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
           <div>
             <Label className="text-lg font-serif">Inspiration Board</Label>
             <p className="text-sm text-neutral-500">Upload images that inspire your style.</p>
           </div>
           <Button variant="outline" size="sm" className="relative" disabled={uploading}>
             {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
             Add Image
             <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
                disabled={uploading}
             />
           </Button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {preferences.inspiration_images?.map((url, idx) => (
             <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border bg-neutral-50">
                <img src={url} alt="Inspiration" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                   <X className="w-3 h-3" />
                </button>
             </div>
           ))}
           {(!preferences.inspiration_images || preferences.inspiration_images.length === 0) && (
              <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl text-neutral-400 flex flex-col items-center justify-center">
                 <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                 <p className="text-sm">No images yet. Start building your moodboard!</p>
              </div>
           )}
        </div>
      </div>

      {/* Save Action */}
      <div className="flex justify-end pt-4">
         <Button onClick={onSave} disabled={isSaving} className="bg-neutral-900 text-white min-w-[120px]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Profile"}
         </Button>
      </div>
    </div>
  );
}

function CheckIcon({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}