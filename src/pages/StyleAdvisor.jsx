import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Upload, Camera, User, Shirt, Gem, ArrowRight, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function StyleAdvisor() {
  const { t } = useLanguage();
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // State
  const [mode, setMode] = useState("general"); // general, outfit, jewelry
  const [selectedImage, setSelectedImage] = useState(null);
  const [userContext, setUserContext] = useState("");
  const [adviceResult, setAdviceResult] = useState(null);

  // Data Fetching
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: bodyParts } = useQuery({
    queryKey: ['bodyParts'],
    queryFn: () => base44.entities.BodyPart.list(),
  });

  const { data: jewelryItems } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setSelectedImage(result.file_url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const generateAdvice = async () => {
    if (!selectedImage && !userContext) return;
    
    setAnalyzing(true);
    setAdviceResult(null);

    try {
      // Build User Profile Context
      const prefs = user?.style_preferences || {};
      const profileContext = `
        User Style Profile:
        - Aesthetics: ${prefs.aesthetics?.join(", ") || "Not specified"}
        - Favorite Colors: ${prefs.favorite_colors?.join(", ") || "Not specified"}
        - Favorite Jewelry: ${prefs.favorite_jewelry_types?.join(", ") || "Not specified"}
        - Preferred Metals: ${prefs.preferred_metals?.join(", ") || "Not specified"}
        - Occasions: ${prefs.frequent_occasions?.join(", ") || "Not specified"}
        - Bio: ${user?.bio || ""}
      `;

      // Build Catalog Context (Sample items)
      // We send a simplified list of items to the AI to suggest from
      const catalogContext = jewelryItems?.slice(0, 20).map(j => 
        `- ID: ${j.id}, Name: ${j.name}, Type: ${j.type}, Metal: ${j.metal_type}`
      ).join("\n") || "";

      let prompt = "";
      if (mode === "general") {
        prompt = `
          You are a personal high-fashion stylist.
          Analyze the provided user photo and their style profile.
          
          ${profileContext}
          
          User Request/Context: ${userContext}
          
          Provide comprehensive style advice:
          1. Analyze the look/vibe in the photo.
          2. Suggest improvements or complementary elements based on their preferences.
          3. Recommend 3 specific jewelry types or styles that would elevate this look.
          
          Return JSON:
          {
            "analysis": "...",
            "suggestions": "...",
            "recommended_jewelry_styles": ["style 1", "style 2", "style 3"]
          }
        `;
      } else if (mode === "outfit") {
        prompt = `
          You are a personal stylist. The user has uploaded an outfit photo.
          Suggest specific jewelry from the catalog to match this outfit.
          
          ${profileContext}
          
          User Request: ${userContext}
          
          Available Jewelry Catalog:
          ${catalogContext}
          
          Task:
          1. Analyze the outfit (colors, neckline, style).
          2. Recommend 2-3 specific items from the catalog that match perfectly.
          3. Explain why.
          
          Return JSON:
          {
            "outfit_analysis": "...",
            "recommended_item_ids": ["id1", "id2"],
            "styling_tips": "..."
          }
        `;
      } else if (mode === "jewelry") {
        prompt = `
          You are a personal stylist. The user has uploaded a photo of a jewelry piece (or wearing it).
          Suggest an outfit to go with it.
          
          ${profileContext}
          
          User Request: ${userContext}
          
          Task:
          1. Analyze the jewelry piece.
          2. Suggest a complete outfit (top, bottom, shoes, etc.) that complements it, considering user's aesthetic.
          3. Suggest occasion.
          
          Return JSON:
          {
            "jewelry_analysis": "...",
            "outfit_suggestion": "...",
            "occasion_fit": "..."
          }
        `;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: selectedImage ? [selectedImage] : [],
        response_json_schema: {
          type: "object",
          properties: {
            analysis: { type: "string" },
            suggestions: { type: "string" },
            recommended_jewelry_styles: { type: "array", items: { type: "string" } },
            outfit_analysis: { type: "string" },
            recommended_item_ids: { type: "array", items: { type: "string" } },
            styling_tips: { type: "string" },
            jewelry_analysis: { type: "string" },
            outfit_suggestion: { type: "string" },
            occasion_fit: { type: "string" }
          }
        }
      });

      if (response) {
        setAdviceResult(response);
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif text-neutral-900">AI Style Advisor</h1>
        <p className="text-neutral-500 max-w-2xl mx-auto">
          Your personal digital stylist. Upload a photo or select one from your wardrobe to get personalized fashion advice and jewelry recommendations.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>What would you like advice on?</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Style Analysis</SelectItem>
                  <SelectItem value="outfit">Match Jewelry to Outfit</SelectItem>
                  <SelectItem value="jewelry">Match Outfit to Jewelry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload Photo</Label>
              <div className="border-2 border-dashed border-neutral-200 rounded-xl aspect-square md:aspect-[4/3] flex flex-col items-center justify-center relative bg-neutral-50 hover:bg-neutral-100 transition-colors">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                ) : selectedImage ? (
                  <>
                    <img src={selectedImage} alt="Selected" className="w-full h-full object-contain rounded-lg p-2" />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="absolute bottom-4 bg-white/90 shadow-sm"
                      onClick={(e) => { e.preventDefault(); setSelectedImage(null); }}
                    >
                      Change Photo
                    </Button>
                  </>
                ) : (
                  <div className="text-center p-6 text-neutral-400">
                    <Camera className="w-10 h-10 mb-3 mx-auto" />
                    <p className="font-medium">Click to upload photo</p>
                    <p className="text-xs mt-1">or use Wardrobe photos below</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Select from Wardrobe */}
            {bodyParts?.length > 0 && !selectedImage && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-neutral-500 tracking-wider">From your Wardrobe</Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {bodyParts.map(bp => (
                    <div 
                      key={bp.id} 
                      className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-neutral-200 cursor-pointer hover:ring-2 ring-amber-400"
                      onClick={() => setSelectedImage(bp.image_url)}
                    >
                      <img src={bp.image_url} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Context / Question (Optional)</Label>
              <Textarea 
                placeholder={mode === 'outfit' ? "E.g. Going to a summer wedding..." : "E.g. Does this suit my color palette?"}
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                className="h-24"
              />
            </div>

            <Button 
              onClick={generateAdvice} 
              disabled={analyzing || !selectedImage}
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800 h-12 text-lg"
            >
              {analyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Get Advice</>
              )}
            </Button>
          </div>

          {/* Right Column: Results */}
          <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100 min-h-[400px]">
            {!adviceResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white border border-neutral-100 flex items-center justify-center">
                  <Lightbulb className="w-8 h-8 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-neutral-600 mb-1">Waiting for input</h3>
                  <p className="text-sm max-w-xs mx-auto">Upload a photo and ask your stylist for personalized advice.</p>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-amber-600 font-serif text-xl border-b border-amber-100 pb-3">
                  <Sparkles className="w-5 h-5" />
                  Stylist's Analysis
                </div>

                {/* Analysis Section */}
                <div className="prose prose-sm text-neutral-600">
                  <p className="leading-relaxed">
                    {adviceResult.analysis || adviceResult.outfit_analysis || adviceResult.jewelry_analysis}
                  </p>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl p-4 border border-neutral-100 shadow-sm space-y-3">
                   <h4 className="font-medium text-neutral-900 flex items-center gap-2">
                     <Gem className="w-4 h-4 text-amber-500" /> Recommendations
                   </h4>
                   
                   {adviceResult.suggestions && <p className="text-sm text-neutral-600">{adviceResult.suggestions}</p>}
                   {adviceResult.styling_tips && <p className="text-sm text-neutral-600">{adviceResult.styling_tips}</p>}
                   {adviceResult.outfit_suggestion && <p className="text-sm text-neutral-600">{adviceResult.outfit_suggestion}</p>}

                   {/* List Styles or Items */}
                   {adviceResult.recommended_jewelry_styles && (
                     <div className="flex flex-wrap gap-2 mt-2">
                       {adviceResult.recommended_jewelry_styles.map((style, i) => (
                         <Badge key={i} variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
                           {style}
                         </Badge>
                       ))}
                     </div>
                   )}
                </div>

                {/* Specific Catalog Items if any */}
                {adviceResult.recommended_item_ids?.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="font-medium text-neutral-900 text-sm">Shop the Look</h4>
                      <div className="grid grid-cols-2 gap-3">
                         {jewelryItems?.filter(j => adviceResult.recommended_item_ids.includes(j.id)).map(item => (
                            <Link to={createPageUrl("JewelryBox") + `?item=${item.id}`} key={item.id}>
                              <div className="bg-white rounded-lg p-2 border border-neutral-100 hover:border-amber-300 transition-colors flex gap-2 items-center">
                                 <img src={item.image_url} className="w-10 h-10 rounded object-cover bg-neutral-50" />
                                 <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.name}</p>
                                    <p className="text-[10px] text-neutral-500">{item.price ? `$${item.price}` : 'View'}</p>
                                 </div>
                                 <ArrowRight className="w-3 h-3 text-neutral-300" />
                              </div>
                            </Link>
                         ))}
                      </div>
                   </div>
                )}
                
                {adviceResult.occasion_fit && (
                  <div className="bg-amber-50/50 p-3 rounded-lg text-xs text-amber-800 flex gap-2 items-start">
                     <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                     <span>Perfect for: {adviceResult.occasion_fit}</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}