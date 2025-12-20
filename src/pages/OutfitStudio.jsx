import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Upload, ArrowRight, CheckCircle2, RefreshCw, Shirt, Camera } from "lucide-react";
import ShareButton from "@/components/common/ShareButton";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from '@/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';

const STEPS = {
  SELECT_OUTFIT: 0,
  SELECT_BODY: 1,
  GENERATE: 2,
  RESULT: 3
};

export default function OutfitStudio() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOutfitId = searchParams.get('outfitId');
  
  const [step, setStep] = useState(STEPS.SELECT_OUTFIT);
  const [selectedOutfitId, setSelectedOutfitId] = useState(preselectedOutfitId || "");
  const [selectedBodyPartId, setSelectedBodyPartId] = useState("");
  const [notes, setNotes] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data: outfits } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => base44.entities.Outfit.list(),
  });

  const { data: bodyParts } = useQuery({
    queryKey: ['bodyParts'],
    queryFn: () => base44.entities.BodyPart.list(),
  });

  const { data: clothingItems } = useQuery({
    queryKey: ['clothingItems'],
    queryFn: () => base44.entities.ClothingItem.list(),
  });

  const generateTryOn = async () => {
    if (!selectedOutfitId || !selectedBodyPartId) return;
    
    setGenerating(true);
    setStep(STEPS.GENERATE);
    
    try {
      const bodyPart = bodyParts.find(p => p.id === selectedBodyPartId);
      const outfit = outfits.find(o => o.id === selectedOutfitId);
      
      // Get all clothing images
      const outfitClothes = clothingItems.filter(c => outfit.clothing_item_ids?.includes(c.id));
      const clothingUrls = outfitClothes.map(c => c.image_url);
      
      // Construct a detailed prompt
      const prompt = `
        Fashion photography. Virtual Try-On.
        Composite the following clothing items onto the person in the base image.
        
        Base Image: Person (full body/portrait).
        Clothing Items:
        ${outfitClothes.map(c => `- ${c.color} ${c.type} (${c.material})`).join('\n')}
        
        Styling Instructions:
        - Replace the person's current clothes with these items.
        - Ensure realistic fit, drape, and lighting.
        - Maintain the person's identity, pose, and skin tone.
        - Style: ${outfit.name} - ${outfit.description || ""}
        - Additional Notes: ${notes}
      `;

      // We pass body image first, then clothing images. 
      // Note: Some APIs have limits on number of input images. We'll pass up to 3 clothing items + body.
      // If more, we prioritize top/bottom/dress.
      const imagesToUse = [bodyPart.image_url, ...clothingUrls.slice(0, 3)];

      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
        existing_image_urls: imagesToUse,
      });

      if (response && response.url) {
        setResultImage(response.url);
        
        // Save the creation
        await base44.entities.Creation.create({
          result_image_url: response.url,
          body_part_id: selectedBodyPartId,
          description: `Outfit: ${outfit.name}. ${notes}`,
          jewelry_type: "set" // using 'set' for outfit for now or we might need a new type in Creation entity
        });
        
        setStep(STEPS.RESULT);
      }
    } catch (error) {
      console.error("Generation failed", error);
      alert("Error during generation. Please try again.");
      setStep(STEPS.SELECT_BODY);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-serif text-neutral-900 mb-4">Outfit Studio</h1>
        <p className="text-neutral-500">
          Try on your curated outfits virtually.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
        
        {/* Left Side - Progress */}
        <div className="w-full md:w-1/3 bg-neutral-50 p-8 border-r border-neutral-100 flex flex-col">
          <div className="space-y-6">
            {[
              { id: STEPS.SELECT_OUTFIT, label: "Select Outfit", icon: "👗" },
              { id: STEPS.SELECT_BODY, label: "Select Model", icon: "👤" },
              { id: STEPS.GENERATE, label: "Magic", icon: "✨" },
              { id: STEPS.RESULT, label: "Result", icon: "🖼️" },
            ].map((s) => (
              <div 
                key={s.id}
                className={`flex items-center gap-4 transition-colors ${
                  step === s.id ? "text-amber-600 font-medium" : 
                  step > s.id ? "text-green-600" : "text-neutral-400"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                  step === s.id ? "border-amber-600 bg-amber-50" : 
                  step > s.id ? "border-green-600 bg-green-50" : "border-neutral-200"
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <span>{s.id + 1}</span>}
                </div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {step === STEPS.RESULT && (
             <Button 
                onClick={() => {
                  setStep(STEPS.SELECT_OUTFIT);
                  setResultImage("");
                }}
                variant="outline"
                className="mt-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> New Try
             </Button>
          )}
        </div>

        {/* Right Side - Content */}
        <div className="w-full md:w-2/3 p-8 md:p-12 relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SELECT OUTFIT */}
            {step === STEPS.SELECT_OUTFIT && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                <h2 className="text-2xl font-serif">Choose an Outfit</h2>
                
                {outfits?.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-neutral-500 mb-4">No outfits created yet.</p>
                    <Button onClick={() => navigate(createPageUrl('Closet'))}>
                      Go to Closet to Create Outfits
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                    {outfits?.map(outfit => (
                      <div 
                        key={outfit.id}
                        onClick={() => setSelectedOutfitId(outfit.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedOutfitId === outfit.id ? 'ring-2 ring-amber-500 border-transparent bg-amber-50' : 'hover:border-amber-300 bg-white'}`}
                      >
                         {outfit.image_url && (
                           <img src={outfit.image_url} className="w-full aspect-square object-cover rounded-lg mb-2" />
                         )}
                         <h3 className="font-medium text-sm">{outfit.name}</h3>
                         <p className="text-xs text-neutral-500">{outfit.occasion}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-auto">
                  <Button 
                    onClick={() => setStep(STEPS.SELECT_BODY)}
                    disabled={!selectedOutfitId}
                    className="bg-neutral-900 text-white"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SELECT BODY */}
            {step === STEPS.SELECT_BODY && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                <h2 className="text-2xl font-serif">Who is trying it on?</h2>
                
                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                   {bodyParts?.filter(p => p.type === 'full_body' || p.type === 'bust_with_hands').map(part => (
                      <div 
                        key={part.id}
                        onClick={() => setSelectedBodyPartId(part.id)}
                        className={`cursor-pointer rounded-xl border-2 overflow-hidden relative aspect-[3/4] transition-all ${
                          selectedBodyPartId === part.id ? "border-amber-600 ring-2 ring-amber-100" : "border-transparent hover:border-neutral-200"
                        }`}
                      >
                        <img src={part.image_url} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90 text-xs font-medium truncate">
                          {part.name}
                        </div>
                      </div>
                   ))}
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input 
                    placeholder="E.g. Tuck in the shirt..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-between mt-auto">
                   <Button variant="ghost" onClick={() => setStep(STEPS.SELECT_OUTFIT)}>Back</Button>
                   <Button 
                      onClick={generateTryOn}
                      disabled={!selectedBodyPartId}
                      className="bg-amber-600 text-white"
                   >
                      <Sparkles className="w-4 h-4 mr-2" /> Generate
                   </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: GENERATE */}
            {step === STEPS.GENERATE && (
               <motion.div
                  key="step3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-6"
               >
                  <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                  <p className="text-lg font-serif">Styling your outfit...</p>
               </motion.div>
            )}

            {/* STEP 4: RESULT */}
            {step === STEPS.RESULT && (
               <motion.div
                  key="step4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col space-y-4"
               >
                  <h2 className="text-2xl font-serif text-center">Your Look</h2>
                  <div className="flex-1 rounded-xl overflow-hidden bg-neutral-100">
                     <img src={resultImage} className="w-full h-full object-contain" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <Button variant="outline" onClick={() => window.open(resultImage, '_blank')}>Download</Button>
                     <ShareButton url={resultImage} imageUrl={resultImage} text="My Virtual Outfit!" />
                  </div>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}