import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Upload, ArrowRight, CheckCircle2, RefreshCw, Lightbulb, Wand2, Camera } from "lucide-react";
import ShareButton from "@/components/common/ShareButton";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import ARLiveTryOn from '@/components/studio/ARLiveTryOn';
import TryOnEditor from '@/components/studio/TryOnEditor';
import { Pencil } from 'lucide-react';
import SEO from '@/components/common/SEO';

const STEPS = {
  UPLOAD: 0,
  SELECT_BODY: 1,
  GENERATE: 2,
  RESULT: 3
};

export default function Studio() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Fetch user for stylist context
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null), // Handle not logged in
  });

  const [step, setStep] = useState(STEPS.UPLOAD);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  
  // Creation State
  const [jewelryImage, setJewelryImage] = useState("");
  const [jewelryType, setJewelryType] = useState("necklace");
  const [selectedBodyPartId, setSelectedBodyPartId] = useState("");

  const [resultImage, setResultImage] = useState("");
  const [stylistData, setStylistData] = useState(null);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCreationId, setCurrentCreationId] = useState(null);

  const { data: bodyParts } = useQuery({
    queryKey: ['bodyParts'],
    queryFn: () => base44.entities.BodyPart.list(),
  });

  const [metalFilter, setMetalFilter] = useState("all");

  const { data: catalogItems } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const filteredCatalogItems = catalogItems?.filter(item => {
    const typeMatch = item.type === jewelryType;
    const metalMatch = metalFilter === "all" || item.metal_type === metalFilter;
    return typeMatch && metalMatch;
  });

  const [detectingType, setDetectingType] = useState(false);

  const detectJewelryType = async (imageUrl) => {
    setDetectingType(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this jewelry image and identify its category.
        Respond ONLY with one of these exact values: earrings, necklace, ring, bracelet, anklet, set
        
        Rules:
        - If it's a pair of earrings or single earring: "earrings"
        - If it's a necklace, pendant, or choker: "necklace"
        - If it's a ring: "ring"
        - If it's a bracelet or bangle: "bracelet"
        - If it's an anklet: "anklet"
        - If it contains multiple jewelry pieces (e.g., matching set): "set"`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            jewelry_type: { 
              type: "string",
              enum: ["earrings", "necklace", "ring", "bracelet", "anklet", "set"]
            }
          }
        }
      });
      
      if (response?.jewelry_type) {
        setJewelryType(response.jewelry_type);
      }
    } catch (error) {
      console.error("Jewelry type detection failed", error);
    } finally {
      setDetectingType(false);
    }
  };

  const handleJewelryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setJewelryImage(result.file_url);
      // Auto-detect jewelry type
      detectJewelryType(result.file_url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const handleStylistAnalysis = async () => {
    if (!jewelryImage || !selectedBodyPartId) return;
    
    setAnalyzingStyle(true);
    try {
      const bodyPart = bodyParts.find(p => p.id === selectedBodyPartId);
      
      const userPrefs = user?.style_preferences ? `
        User Style Context:
        - Aesthetics: ${user.style_preferences.aesthetics?.join(", ") || "Unknown"}
        - Preferred Metals: ${user.style_preferences.preferred_metals?.join(", ") || "Unknown"}
        - Style: ${user.style_preferences.jewelry_preference_type || "Mix"}
      ` : "";

      const prompt = `
        You are a luxury fashion stylist and jewelry expert.
        Analyze these two images:
        Image 1: The user (focus on skin tone, features, and style).
        Image 2: A piece of jewelry (${jewelryType}).
        
        ${userPrefs}

        Provide expert advice in the following JSON format:
        {
          "suggestions": "Styling suggestions based on the user's features, their personal style aesthetics, and the jewelry piece (max 2 sentences)",
          "advice": "Advice on color matching (gold/silver vs skin tone) and appropriate occasions (max 2 sentences)",
          "compatible_items": ["Item 1", "Item 2", "Item 3"] (3 specific jewelry items that would complete a set with this piece)
        }
        
        Be elegant, professional, and helpful. Incorporate their aesthetic preferences if provided.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [bodyPart.image_url, jewelryImage],
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: { type: "string" },
            advice: { type: "string" },
            compatible_items: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (response) {
        setStylistData(response);
      }
    } catch (error) {
      console.error("Stylist analysis failed", error);
    } finally {
      setAnalyzingStyle(false);
    }
  };

  const generateTryOn = async () => {
    if (!jewelryImage || !selectedBodyPartId) return;
    
    setGenerating(true);
    setStep(STEPS.GENERATE);
    
    try {
      const bodyPart = bodyParts.find(p => p.id === selectedBodyPartId);
      
      // Construct a detailed prompt for the AI with natural placement instructions
      const prompt = `
        A professional, photorealistic fashion photography shot.
        The goal is to show a person wearing a specific piece of jewelry naturally and realistically.
        
        Input 1 (Base Image): A photo of a ${bodyPart.type} (the user).
        Input 2 (Jewelry Reference): A photo of a ${jewelryType}.
        
        Task: Seamlessly composite and generate the jewelry onto the body part with NATURAL PLACEMENT.
        
        CRITICAL PLACEMENT RULES:
        - ALWAYS maintain the exact proportions of the jewelry relative to the body part size.
        - Position the jewelry according to GRAVITY and natural physics:
          * Necklaces: Should follow the curve of the neck/collarbone, hanging naturally with gravity
          * Earrings: Should dangle naturally, respecting the ear angle and head tilt
          * Rings: Should wrap around fingers at natural angles
          * Bracelets: Should rest on wrists following arm position and gravity
          * Anklets: Should sit naturally on the ankle bone
        - ADAPT to body part INCLINATION: If the head is tilted, earrings should hang accordingly
        - SCALE appropriately: Match jewelry size to the body part (e.g., small earrings for small ears)
        - Consider the DEPTH and PERSPECTIVE of the base image
        
        Technical Details:
        - The jewelry should cast subtle, realistic shadows on the skin
        - Lighting and reflections must match the ambient light of the base photo
        - High fashion aesthetic, elegant, clean
        - Maintain the identity and skin tone of the person in the base image
        - If the type is 'set', identify all components and place each piece appropriately on visible body parts
      `;

      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
        existing_image_urls: [bodyPart.image_url, jewelryImage],
      });

      if (response && response.url) {
        setResultImage(response.url);
        
        // Save the creation
        const newCreation = await base44.entities.Creation.create({
          jewelry_image_url: jewelryImage,
          result_image_url: response.url,
          body_part_id: selectedBodyPartId,
          description: "",
          jewelry_type: jewelryType
        });
        
        if (newCreation) {
          setCurrentCreationId(newCreation.id);
        }
        
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

  const handleEditorSave = async (newUrl) => {
    setResultImage(newUrl);
    setIsEditing(false);
    
    // Update the existing creation record
    if (currentCreationId) {
      try {
        await base44.entities.Creation.update(currentCreationId, {
          result_image_url: newUrl
        });
      } catch (err) {
        console.error("Failed to update creation record", err);
      }
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
    <div className="max-w-4xl mx-auto">
      <SEO 
        title="Studio IA" 
        description="Essayez virtuellement n'importe quel bijou ou vêtement sur vos propres photos grâce à notre IA générative."
        keywords={["studio IA", "essayage virtuel", "générateur", "mode"]}
      />
      {isARMode ? (
         <ARLiveTryOn 
           jewelryImage={jewelryImage}
           jewelryType={jewelryType}
           mode="jewelry"
           onBack={() => setIsARMode(false)}
           onSaveToGallery={(url) => {
             setResultImage(url);
             setIsARMode(false);
             setStep(STEPS.RESULT);
           }}
         />
      ) : isEditing ? (
        <TryOnEditor 
          resultImage={resultImage}
          onSave={handleEditorSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div>
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-serif text-neutral-900 mb-4">{t.studio.title}</h1>
            <p className="text-neutral-500">
              {t.studio.subtitle}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
            
            {/* Left Side - Progress & Steps */}
            <div className="w-full md:w-1/3 bg-neutral-50 p-8 border-r border-neutral-100 flex flex-col">
              <div className="space-y-6">
                {[
                  { id: STEPS.UPLOAD, label: t.studio.steps.upload, icon: "💎" },
                  { id: STEPS.SELECT_BODY, label: t.studio.steps.selectBody, icon: "👤" },
                  { id: STEPS.GENERATE, label: t.studio.steps.generate, icon: "✨" },
                  { id: STEPS.RESULT, label: t.studio.steps.result, icon: "🖼️" },
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
                      setStep(STEPS.UPLOAD);
                      setJewelryImage("");
                      setResultImage("");
                    }}
                    variant="outline"
                    className="mt-auto"
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
                      <h2 className="text-2xl font-serif">{t.studio.step1.title}</h2>
                      <p className="text-neutral-500 text-sm">{t.studio.step1.desc}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {t.studio.step1.typeLabel}
                      {detectingType && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Détection IA...
                        </span>
                      )}
                    </Label>
                    <Select value={jewelryType} onValueChange={setJewelryType} disabled={detectingType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earrings">{t.studio.step1.types.earrings}</SelectItem>
                        <SelectItem value="necklace">{t.studio.step1.types.necklace}</SelectItem>
                        <SelectItem value="ring">{t.studio.step1.types.ring}</SelectItem>
                        <SelectItem value="bracelet">{t.studio.step1.types.bracelet}</SelectItem>
                        <SelectItem value="anklet">{t.studio.step1.types.anklet}</SelectItem>
                        <SelectItem value="set">{t.studio.step1.types.set}</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                    </div>

                    <div className="flex gap-4 mb-4 justify-center">
                      <Button 
                        variant={!showCatalog ? "default" : "outline"}
                        onClick={() => setShowCatalog(false)}
                        className={!showCatalog ? "bg-neutral-900 text-white" : ""}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Upload
                      </Button>
                      <Button 
                        variant={showCatalog ? "default" : "outline"}
                        onClick={() => setShowCatalog(true)}
                        className={showCatalog ? "bg-neutral-900 text-white" : ""}
                      >
                        <Sparkles className="w-4 h-4 mr-2" /> {t.jewelryBox?.title || "Catalogue"}
                      </Button>
                    </div>

                    {!showCatalog ? (
                      <div className="border-2 border-dashed border-neutral-200 rounded-xl flex-1 flex flex-col items-center justify-center p-6 text-center hover:bg-neutral-50 transition-colors relative min-h-[200px]">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleJewelryUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {uploading ? (
                          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                        ) : jewelryImage ? (
                          <img src={jewelryImage} alt="Jewelry" className="h-full max-h-64 object-contain" />
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-neutral-300 mb-4" />
                            <p className="text-neutral-900 font-medium">{t.common.clickToUpload}</p>
                            <p className="text-neutral-400 text-sm mt-1">JPG, PNG</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto max-h-[350px] border rounded-xl p-3 bg-neutral-50 flex flex-col gap-3">
                        <div className="flex gap-2">
                            <Select value={metalFilter} onValueChange={setMetalFilter}>
                                <SelectTrigger className="h-8 text-xs w-[130px] bg-white">
                                    <SelectValue placeholder="Metal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Metals</SelectItem>
                                    <SelectItem value="Gold">Gold</SelectItem>
                                    <SelectItem value="Silver">Silver</SelectItem>
                                    <SelectItem value="Rose Gold">Rose Gold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {filteredCatalogItems?.map(item => (
                            <div 
                              key={item.id} 
                              className={`bg-white p-2 rounded-lg border cursor-pointer transition-all ${jewelryImage === item.image_url ? 'ring-2 ring-amber-500 border-transparent' : 'hover:border-amber-300'}`}
                              onClick={() => setJewelryImage(item.image_url)}
                            >
                              <div className="aspect-square rounded-md overflow-hidden bg-neutral-100 mb-2 relative">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                {item.metal_type && <span className="absolute bottom-0 right-0 bg-black/50 text-white text-[10px] px-1">{item.metal_type}</span>}
                              </div>
                              <p className="text-xs font-medium truncate">{item.name}</p>
                              {item.collection_name && <p className="text-[10px] text-neutral-500 truncate">{item.collection_name}</p>}
                            </div>
                          ))}
                        </div>
                        {filteredCatalogItems?.length === 0 && (
                          <p className="text-center text-neutral-400 py-10">Aucun bijou trouvé.</p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setStep(STEPS.SELECT_BODY)}
                        disabled={!jewelryImage}
                        className="bg-neutral-900 text-white hover:bg-neutral-800"
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
                      <h2 className="text-2xl font-serif">{t.studio.step2.title}</h2>
                      <p className="text-neutral-500 text-sm">{t.studio.step2.desc}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
                      {filteredBodyParts?.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-neutral-500 mb-4">{t.studio.step2.empty}</p>
                          <Button variant="outline" onClick={() => navigate(createPageUrl('Wardrobe'))}>
                            {t.studio.step2.goToWardrobe}
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {filteredBodyParts?.map((part) => (
                            <div 
                              key={part.id}
                              onClick={() => setSelectedBodyPartId(part.id)}
                              className={`cursor-pointer rounded-xl border-2 overflow-hidden relative aspect-[3/4] transition-all ${
                                selectedBodyPartId === part.id 
                                  ? "border-amber-600 ring-2 ring-amber-100" 
                                  : "border-transparent hover:border-neutral-200"
                              }`}
                            >
                              <img src={part.image_url} alt={part.name} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90 text-xs font-medium truncate">
                                {part.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>



                    <div className="flex flex-col gap-4 pt-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-neutral-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-neutral-500">{t.studio.step2.or || "OU"}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                        onClick={() => setIsARMode(true)}
                      >
                        <Camera className="w-4 h-4 mr-2" /> {t.studio.step2.tryLive || "Essayer en Direct (Webcam)"}
                      </Button>

                      <div className="flex justify-between pt-2">
                        <Button variant="ghost" onClick={() => setStep(STEPS.UPLOAD)}>{t.common.back}</Button>
                        <Button 
                          onClick={generateTryOn}
                          disabled={!selectedBodyPartId}
                          className="bg-amber-600 text-white hover:bg-amber-700"
                        >
                          <Sparkles className="w-4 h-4 mr-2" /> {t.studio.step2.generateBtn}
                        </Button>
                      </div>
                    </div>

                    {/* AI Stylist Section */}
                    <div className="mt-8 border-t border-neutral-100 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-serif flex items-center gap-2 text-neutral-800">
                          <Wand2 className="w-5 h-5 text-amber-500" />
                          {t.stylist.title}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStylistAnalysis}
                          disabled={analyzingStyle || !selectedBodyPartId}
                          className="border-amber-200 text-amber-700 hover:bg-amber-50"
                        >
                          {analyzingStyle ? (
                            <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> {t.stylist.analyzing}</>
                          ) : (
                            <><Lightbulb className="w-3 h-3 mr-2" /> {t.stylist.analyzeBtn}</>
                          )}
                        </Button>
                      </div>

                      <AnimatePresence>
                        {stylistData && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-neutral-50 rounded-xl p-5 space-y-4 border border-neutral-100 text-sm"
                          >
                            <div>
                              <p className="font-medium text-amber-700 mb-1">{t.stylist.suggestions}</p>
                              <p className="text-neutral-600 leading-relaxed">{stylistData.suggestions}</p>
                            </div>
                            <div>
                              <p className="font-medium text-amber-700 mb-1">{t.stylist.advice}</p>
                              <p className="text-neutral-600 leading-relaxed">{stylistData.advice}</p>
                            </div>
                            <div>
                              <p className="font-medium text-amber-700 mb-2">{t.stylist.compatible}</p>
                              <div className="flex flex-wrap gap-2">
                                {stylistData.compatible_items?.map((item, idx) => (
                                  <span key={idx} className="bg-white border border-neutral-200 px-3 py-1 rounded-full text-neutral-600 text-xs shadow-sm">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                      <h2 className="text-2xl font-serif">{t.studio.step4.title}</h2>
                      <p className="text-neutral-500 text-sm">{t.studio.step4.desc}</p>
                    </div>

                    <div className="flex-1 bg-neutral-900 rounded-xl overflow-hidden relative group">
                      <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="secondary" 
                        className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-0"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="w-4 h-4 mr-2" /> {t.studio.step4?.adjust || "Ajuster"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(resultImage, '_blank')}
                      >
                        {t.common.download}
                      </Button>
                      <ShareButton 
                        url={resultImage} 
                        imageUrl={resultImage}
                        text="Je viens de créer un essayage virtuel incroyable !"
                        className="w-full"
                      >
                         {t.common.share}
                      </ShareButton>
                      <Button 
                        className="w-full bg-neutral-900 text-white col-span-2 mt-2"
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
      )}
    </div>
  );
}