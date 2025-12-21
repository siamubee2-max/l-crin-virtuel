import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Upload, Loader2, Sparkles, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VisualSearch({ jewelry = [], clothing = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResults(null);

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setUploadedImage(result.file_url);
      await analyzeImage(result.file_url);
    } catch (err) {
      console.error("Upload failed", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const analyzeImage = async (imageUrl) => {
    setAnalyzing(true);
    
    try {
      // Build catalog context
      const jewelryCatalog = jewelry.slice(0, 30).map(j => ({
        id: j.id,
        name: j.name,
        type: j.type,
        color: j.metal_type || j.material,
        gemstone: j.gemstone_type,
        tags: j.tags?.join(", "),
        price: j.sale_price || j.price
      }));

      const clothingCatalog = clothing.slice(0, 30).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        color: c.color,
        material: c.material,
        price: c.price
      }));

      const prompt = `Analyze this image and find similar items from our catalog.

JEWELRY CATALOG:
${JSON.stringify(jewelryCatalog, null, 2)}

CLOTHING CATALOG:
${JSON.stringify(clothingCatalog, null, 2)}

Instructions:
1. Identify what type of item is in the image (jewelry, clothing, or accessory)
2. Describe the key visual features (color, style, material, shape)
3. Find the most similar items from our catalog based on:
   - Type match
   - Color/material similarity
   - Style similarity
   - Overall aesthetic

Return JSON format:
{
  "detected_item": {
    "type": "jewelry or clothing",
    "description": "brief description of the item",
    "key_features": ["feature1", "feature2", "feature3"]
  },
  "similar_jewelry": [
    {"id": "item_id", "match_score": 95, "reason": "why it matches"}
  ],
  "similar_clothing": [
    {"id": "item_id", "match_score": 90, "reason": "why it matches"}
  ],
  "style_suggestions": ["suggestion1", "suggestion2"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            detected_item: {
              type: "object",
              properties: {
                type: { type: "string" },
                description: { type: "string" },
                key_features: { type: "array", items: { type: "string" } }
              }
            },
            similar_jewelry: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  match_score: { type: "number" },
                  reason: { type: "string" }
                }
              }
            },
            similar_clothing: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  match_score: { type: "number" },
                  reason: { type: "string" }
                }
              }
            },
            style_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Match IDs to actual products
      const matchedJewelry = response.similar_jewelry?.map(match => {
        const product = jewelry.find(j => j.id === match.id);
        return product ? { ...product, match_score: match.match_score, reason: match.reason } : null;
      }).filter(Boolean) || [];

      const matchedClothing = response.similar_clothing?.map(match => {
        const product = clothing.find(c => c.id === match.id);
        return product ? { ...product, match_score: match.match_score, reason: match.reason } : null;
      }).filter(Boolean) || [];

      setResults({
        detected: response.detected_item,
        jewelry: matchedJewelry,
        clothing: matchedClothing,
        suggestions: response.style_suggestions
      });
    } catch (err) {
      console.error("Analysis failed", err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetSearch = () => {
    setUploadedImage(null);
    setResults(null);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Camera className="w-4 h-4" />
          Visual Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Visual Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!uploadedImage ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center hover:border-purple-300 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                  <p className="text-sm text-neutral-500">Uploading image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">Upload an image</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Find similar jewelry and clothing from our catalog
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Uploaded Image Preview */}
              <div className="relative">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full h-48 object-contain bg-neutral-100 rounded-xl"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={resetSearch}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Analyzing State */}
              {analyzing && (
                <div className="bg-purple-50 rounded-xl p-6 text-center">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
                  <p className="font-medium text-purple-800">Analyzing your image...</p>
                  <p className="text-sm text-purple-600 mt-1">Finding similar items in our catalog</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-700">{error}</p>
                  <Button variant="outline" size="sm" onClick={resetSearch} className="mt-2">
                    Try Again
                  </Button>
                </div>
              )}

              {/* Results */}
              <AnimatePresence>
                {results && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Detected Item */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <h4 className="font-medium text-purple-800 mb-2">Detected Item</h4>
                      <p className="text-sm text-neutral-700">{results.detected?.description}</p>
                      {results.detected?.key_features?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {results.detected.key_features.map((feature, i) => (
                            <span key={i} className="text-xs bg-white/80 px-2 py-1 rounded-full text-purple-700">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Similar Jewelry */}
                    {results.jewelry?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          💎 Similar Jewelry
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {results.jewelry.slice(0, 4).map((item, i) => (
                            <Link 
                              key={i} 
                              to={createPageUrl(`ProductDetail?id=${item.id}&type=jewelry`)}
                              className="group bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all"
                            >
                              <div className="aspect-square bg-neutral-100 relative">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {item.match_score}% match
                                </div>
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium truncate">{item.name}</p>
                                <p className="text-[10px] text-neutral-500 truncate">{item.reason}</p>
                                <p className="text-xs font-bold text-amber-600 mt-1">
                                  ${item.sale_price || item.price || 0}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Similar Clothing */}
                    {results.clothing?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          👗 Similar Clothing
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {results.clothing.slice(0, 4).map((item, i) => (
                            <Link 
                              key={i} 
                              to={createPageUrl(`ProductDetail?id=${item.id}&type=clothing`)}
                              className="group bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all"
                            >
                              <div className="aspect-[3/4] bg-neutral-100 relative">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {item.match_score}% match
                                </div>
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium truncate">{item.name}</p>
                                <p className="text-[10px] text-neutral-500 truncate">{item.reason}</p>
                                <p className="text-xs font-bold text-blue-600 mt-1">
                                  ${item.price || 0}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Style Suggestions */}
                    {results.suggestions?.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <h4 className="font-medium text-amber-800 mb-2">💡 Style Tips</h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {results.suggestions.map((tip, i) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Try Another */}
                    <Button variant="outline" onClick={resetSearch} className="w-full">
                      <Camera className="w-4 h-4 mr-2" /> Search Another Image
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}