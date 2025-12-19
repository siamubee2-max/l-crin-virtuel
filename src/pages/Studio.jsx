import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Upload, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';

const STEPS = {
  UPLOAD: 0,
  SELECT_BODY: 1,
  GENERATE: 2,
  RESULT: 3
};

export default function Studio() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Creation State
  const [jewelryImage, setJewelryImage] = useState("");
  const [jewelryType, setJewelryType] = useState("necklace");
  const [selectedBodyPartId, setSelectedBodyPartId] = useState("");
  const [notes, setNotes] = useState("");
  const [resultImage, setResultImage] = useState("");

  const { data: bodyParts } = useQuery({
    queryKey: ['bodyParts'],
    queryFn: () => base44.entities.BodyPart.list(),
  });

  const handleJewelryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setJewelryImage(result.file_url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const generateTryOn = async () => {
    if (!jewelryImage || !selectedBodyPartId) return;
    
    setGenerating(true);
    setStep(STEPS.GENERATE);
    
    try {
      const bodyPart = bodyParts.find(p => p.id === selectedBodyPartId);
      
      // Construct a detailed prompt for the AI
      const prompt = `
        A professional, photorealistic fashion photography shot.
        The goal is to show a person wearing a specific piece of jewelry.
        
        Input 1 (Base Image): A photo of a ${bodyPart.type} (the user).
        Input 2 (Jewelry Reference): A photo of a ${jewelryType}.
        
        Task: seamlessley composite and generate the jewelry onto the body part.
        
        Details:
        - The jewelry should be realistically sized and positioned for a ${jewelryType}.
        - If the type is 'set', identify all components (necklace, earrings, rings, bracelets) and place them appropriately.
        - IMPORTANT: If the user provides a 'set', look for hands/wrists in the base image to place rings/bracelets if present in the jewelry image.
        - Lighting and shadows must match the skin texture of the body part.
        - High fashion aesthetic, elegant, clean.
        - Maintain the identity and skin tone of the person in the base image.
        - Additional instructions: ${notes}
      `;

      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
        existing_image_urls: [bodyPart.image_url, jewelryImage],
      });

      if (response && response.url) {
        setResultImage(response.url);
        
        // Save the creation
        await base44.entities.Creation.create({
          jewelry_image_url: jewelryImage,
          result_image_url: response.url,
          body_part_id: selectedBodyPartId,
          description: notes,
          jewelry_type: jewelryType
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

  const filteredBodyParts = bodyParts?.filter(part => {
    // Smart filtering based on jewelry type
    if (jewelryType === 'earrings') return part.type.includes('ear') || part.type === 'face';
    if (jewelryType === 'necklace') return part.type === 'neck' || part.type === 'face';
    if (jewelryType === 'ring') return part.type.includes('hand');
    if (jewelryType === 'bracelet') return part.type.includes('wrist') || part.type.includes('hand');
    if (jewelryType === 'anklet') return part.type.includes('ankle');
    if (jewelryType === 'set') return part.type === 'face' || part.type === 'neck' || part.type === 'bust_with_hands';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-serif text-white mb-4 drop-shadow-lg">{t.studio.title}</h1>
        <p className="text-stone-400 text-lg">
          {t.studio.subtitle}
        </p>
      </div>

      <div className="bg-neutral-900 rounded-3xl shadow-2xl shadow-black/50 border border-white/5 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        
        {/* Left Side - Progress & Steps */}
        <div className="w-full md:w-1/3 bg-neutral-950 p-8 border-r border-white/5 flex flex-col">
          <div className="space-y-8">
            {[
              { id: STEPS.UPLOAD, label: t.studio.steps.upload, icon: "💎" },
              { id: STEPS.SELECT_BODY, label: t.studio.steps.selectBody, icon: "👤" },
              { id: STEPS.GENERATE, label: t.studio.steps.generate, icon: "✨" },
              { id: STEPS.RESULT, label: t.studio.steps.result, icon: "🖼️" },
            ].map((s) => (
              <div 
                key={s.id}
                className={`flex items-center gap-4 transition-all duration-300 ${
                  step === s.id ? "text-amber-400 font-medium translate-x-2" : 
                  step > s.id ? "text-green-500" : "text-stone-600"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                  step === s.id ? "border-amber-500 bg-amber-900/20 text-amber-400" : 
                  step > s.id ? "border-green-600 bg-green-900/20" : "border-stone-800 bg-stone-900"
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-serif">{s.id + 1}</span>}
                </div>
                <span className="font-serif tracking-wide">{s.label}</span>
              </div>
            ))}
          </div>

          {step === STEPS.RESULT && (
             <Button 
                onClick={() => {
                  setStep(STEPS.UPLOAD);
                  setJewelryImage("");
                  setResultImage("");
                }}
                variant="outline"
                className="mt-auto border-white/10 text-stone-300 hover:bg-white hover:text-black transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> {t.studio.newTry}
             </Button>
          )}
        </div>

        {/* Right Side - Content Area */}
        <div className="w-full md:w-2/3 p-8 md:p-12 relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: UPLOAD JEWELRY */}
            {step === STEPS.UPLOAD && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif text-white">{t.studio.step1.title}</h2>
                  <p className="text-stone-400 text-sm">{t.studio.step1.desc}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-stone-300">{t.studio.step1.typeLabel}</Label>
                    <Select value={jewelryType} onValueChange={setJewelryType}>
                      <SelectTrigger className="bg-neutral-800 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-white/10 text-white">
                        <SelectItem value="earrings" className="focus:bg-neutral-800 focus:text-white">{t.studio.step1.types.earrings}</SelectItem>
                        <SelectItem value="necklace" className="focus:bg-neutral-800 focus:text-white">{t.studio.step1.types.necklace}</SelectItem>
                        <SelectItem value="ring" className="focus:bg-neutral-800 focus:text-white">{t.studio.step1.types.ring}</SelectItem>
                        <SelectItem value="bracelet" className="focus:bg-neutral-800 focus:text-white">{t.studio.step1.types.bracelet}</SelectItem>
                        <SelectItem value="anklet" className="focus:bg-neutral-800 focus:text-white">{t.studio.step1.types.anklet}</SelectItem>
                        <SelectItem value="set" className="focus:bg-neutral-800 focus:text-white">{t.studio.step1.types.set}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-xl flex-1 flex flex-col items-center justify-center p-6 text-center hover:bg-neutral-800/50 transition-colors relative min-h-[200px] bg-neutral-950/30">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleJewelryUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {uploading ? (
                    <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                  ) : jewelryImage ? (
                    <img src={jewelryImage} alt="Jewelry" className="h-full max-h-64 object-contain drop-shadow-lg" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-stone-600 mb-4" />
                      <p className="text-stone-200 font-medium">{t.common.clickToUpload}</p>
                      <p className="text-stone-500 text-sm mt-1">JPG, PNG</p>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(STEPS.SELECT_BODY)}
                    disabled={!jewelryImage}
                    className="bg-amber-500 text-black hover:bg-amber-400 font-medium border-none shadow-lg shadow-amber-900/20"
                  >
                    {t.common.next} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SELECT BODY PART */}
            {step === STEPS.SELECT_BODY && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif text-white">{t.studio.step2.title}</h2>
                  <p className="text-stone-400 text-sm">{t.studio.step2.desc}</p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
                  {filteredBodyParts?.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-stone-500 mb-4">{t.studio.step2.empty}</p>
                      <Button variant="outline" className="text-stone-300 border-white/10 hover:bg-neutral-800" onClick={() => navigate(createPageUrl('Wardrobe'))}>
                        {t.studio.step2.goToWardrobe}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {filteredBodyParts?.map((part) => (
                        <div 
                          key={part.id}
                          onClick={() => setSelectedBodyPartId(part.id)}
                          className={`cursor-pointer rounded-xl border-2 overflow-hidden relative aspect-[3/4] transition-all duration-300 ${
                            selectedBodyPartId === part.id 
                              ? "border-amber-500 ring-2 ring-amber-900/50 scale-105 shadow-xl shadow-black/50" 
                              : "border-transparent hover:border-white/20 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={part.image_url} alt={part.name} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-white text-xs font-medium truncate backdrop-blur-sm">
                            {part.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-stone-300">{t.studio.step2.notesLabel}</Label>
                  <Input 
                    placeholder={t.studio.step2.notesPlaceholder}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-neutral-800 border-white/10 text-white placeholder:text-stone-600 focus:border-amber-500/50"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(STEPS.UPLOAD)} className="text-stone-400 hover:text-white">{t.common.back}</Button>
                  <Button 
                    onClick={generateTryOn}
                    disabled={!selectedBodyPartId}
                    className="bg-amber-500 text-black hover:bg-amber-400 font-medium shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> {t.studio.step2.generateBtn}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: GENERATING */}
            {step === STEPS.GENERATE && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-medium">{t.studio.step3.title}</h3>
                  <p className="text-neutral-500 mt-2 max-w-xs mx-auto">
                    {t.studio.step3.desc}
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 4: RESULT */}
            {step === STEPS.RESULT && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col space-y-6"
              >
                 <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-serif text-white">{t.studio.step4.title}</h2>
                  <p className="text-stone-400 text-sm">{t.studio.step4.desc}</p>
                </div>

                <div className="flex-1 bg-neutral-950 rounded-xl overflow-hidden relative group border border-white/5">
                  <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full border-white/10 text-stone-300 hover:bg-white hover:text-black"
                    onClick={() => window.open(resultImage, '_blank')}
                  >
                    {t.common.download}
                  </Button>
                  <Button 
                    className="w-full bg-amber-500 text-black hover:bg-amber-400 font-medium"
                    onClick={() => navigate(createPageUrl("Gallery"))}
                  >
                    {t.studio.step4.goToGallery}
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}