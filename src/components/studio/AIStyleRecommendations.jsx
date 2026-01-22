import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Heart, TrendingUp, Palette, Calendar } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

export default function AIStyleRecommendations({ 
  jewelryImage, 
  jewelryType, 
  bodyPartImage, 
  bodyPartType,
  user 
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  // Fetch available jewelry items for recommendations
  const { data: jewelryItems } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const analyzeAndRecommend = async () => {
    if (!jewelryImage || !bodyPartImage) return;
    
    setAnalyzing(true);
    try {
      const userPrefs = user?.style_preferences ? `
        User Style Profile:
        - Preferred Aesthetics: ${user.style_preferences.aesthetics?.join(", ") || "Not specified"}
        - Favorite Metals: ${user.style_preferences.preferred_metals?.join(", ") || "Not specified"}
        - Jewelry Style: ${user.style_preferences.jewelry_preference_type || "Mix"}
        - Favorite Colors: ${user.style_preferences.favorite_colors?.join(", ") || "Not specified"}
      ` : "";

      const availableJewelry = jewelryItems?.map(item => 
        `${item.type}: ${item.name} (${item.brand || 'Generic'}, ${item.metal_type || 'metal'}, ${item.gemstone_type || 'no stones'})`
      ).join('\n') || "";

      const prompt = `
        You are a luxury fashion stylist and jewelry expert with deep knowledge of fashion trends, color theory, and personal styling.
        
        Analyze these images:
        1. User Photo: Shows ${bodyPartType} - analyze skin tone, undertones, features, style vibe
        2. Jewelry Piece: A ${jewelryType} - analyze design style, color, gemstones, aesthetic
        
        ${userPrefs}
        
        Available jewelry catalog:
        ${availableJewelry}
        
        Task: Provide comprehensive styling recommendations in JSON format:
        {
          "skin_tone_analysis": "Brief analysis of user's skin tone (warm/cool/neutral) and which metals suit them best",
          "style_personality": "Detected style personality (e.g., Classic Elegance, Bohemian Chic, Modern Minimalist, Bold Statement)",
          "this_piece_verdict": "Why this specific jewelry works or doesn't work for them (2 sentences max)",
          "complementary_pieces": [
            {
              "type": "necklace" | "earrings" | "ring" | "bracelet",
              "description": "Specific recommendation from catalog or general suggestion",
              "why": "Why this complements the main piece"
            }
          ],
          "color_palette": ["Color 1", "Color 2", "Color 3"] (colors that would complement this jewelry and their skin tone),
          "occasion_suggestions": [
            {
              "occasion": "e.g., Cocktail Party, Office Meeting, Wedding",
              "styling_tip": "How to wear this jewelry for this occasion"
            }
          ],
          "trends": {
            "current_trend": "How this jewelry fits into current fashion trends",
            "timeless_factor": "Whether this is a timeless piece or trendy"
          }
        }
        
        Be specific, professional, and helpful. Reference actual jewelry from the catalog when possible.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [bodyPartImage, jewelryImage],
        response_json_schema: {
          type: "object",
          properties: {
            skin_tone_analysis: { type: "string" },
            style_personality: { type: "string" },
            this_piece_verdict: { type: "string" },
            complementary_pieces: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  why: { type: "string" }
                }
              }
            },
            color_palette: {
              type: "array",
              items: { type: "string" }
            },
            occasion_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  occasion: { type: "string" },
                  styling_tip: { type: "string" }
                }
              }
            },
            trends: {
              type: "object",
              properties: {
                current_trend: { type: "string" },
                timeless_factor: { type: "string" }
              }
            }
          }
        }
      });

      if (response) {
        setRecommendations(response);
      }
    } catch (error) {
      console.error("AI analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mt-6 border-t border-neutral-200 pt-6">
      {!recommendations ? (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-serif text-neutral-900 mb-2">Suggestions de Style IA</h3>
          <p className="text-sm text-neutral-500 mb-4 max-w-md mx-auto">
            Obtenez des recommandations personnalisées basées sur votre teint, votre style et ce bijou
          </p>
          <Button
            onClick={analyzeAndRecommend}
            disabled={analyzing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Analyser mon Style
              </>
            )}
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Vos Recommandations Style
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzeAndRecommend}
                className="text-neutral-500"
              >
                <Loader2 className="w-3 h-3 mr-1" /> Actualiser
              </Button>
            </div>

            {/* Skin Tone & Style Personality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold text-amber-900">Analyse Teint</h4>
                </div>
                <p className="text-sm text-amber-800">{recommendations.skin_tone_analysis}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Votre Personnalité</h4>
                </div>
                <p className="text-sm text-purple-800">{recommendations.style_personality}</p>
              </div>
            </div>

            {/* Verdict on This Piece */}
            <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
              <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Ce Bijou pour Vous
              </h4>
              <p className="text-sm text-neutral-700 leading-relaxed">{recommendations.this_piece_verdict}</p>
            </div>

            {/* Complementary Pieces */}
            {recommendations.complementary_pieces?.length > 0 && (
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">Pour Compléter le Look</h4>
                <div className="grid grid-cols-1 gap-3">
                  {recommendations.complementary_pieces.map((piece, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-lg p-4 border border-neutral-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="text-lg">{
                            piece.type === 'necklace' ? '💍' :
                            piece.type === 'earrings' ? '💎' :
                            piece.type === 'ring' ? '💍' : '✨'
                          }</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900 capitalize mb-1">{piece.type}</p>
                          <p className="text-sm text-neutral-700 mb-1">{piece.description}</p>
                          <p className="text-xs text-purple-600 italic">{piece.why}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Color Palette */}
            {recommendations.color_palette?.length > 0 && (
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">Palette de Couleurs Recommandée</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendations.color_palette.map((color, idx) => (
                    <div 
                      key={idx}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-200 border border-neutral-300 text-sm font-medium text-neutral-700"
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Occasion Suggestions */}
            {recommendations.occasion_suggestions?.length > 0 && (
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Idées d'Occasions
                </h4>
                <div className="space-y-2">
                  {recommendations.occasion_suggestions.map((occ, idx) => (
                    <div 
                      key={idx}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200"
                    >
                      <p className="font-medium text-blue-900 text-sm mb-1">{occ.occasion}</p>
                      <p className="text-xs text-blue-700">{occ.styling_tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trends */}
            {recommendations.trends && (
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-200">
                <h4 className="font-semibold text-pink-900 mb-3">Tendances & Intemporalité</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-pink-800">
                    <span className="font-medium">Tendance :</span> {recommendations.trends.current_trend}
                  </p>
                  <p className="text-pink-800">
                    <span className="font-medium">Durabilité :</span> {recommendations.trends.timeless_factor}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}