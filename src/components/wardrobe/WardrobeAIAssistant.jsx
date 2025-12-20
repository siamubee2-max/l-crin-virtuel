import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Shirt, MessageCircle, Loader2, Send, WashingMachine, CheckCircle2, AlertTriangle, Info, Wand2, Gem, User, Bot, Lightbulb, X, ChevronDown, ShoppingBag, ExternalLink, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/cart/CartProvider';

export default function WardrobeAIAssistant({ clothingItems = [], jewelryItems = [] }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("outfits");
  const chatEndRef = useRef(null);
  
  // Fetch user preferences for context
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });
  
  // Fetch all available products for recommendations
  const { data: allJewelry } = useQuery({
    queryKey: ['allJewelryForReco'],
    queryFn: () => base44.entities.JewelryItem.list('-created_date'),
  });
  
  const { data: allClothing } = useQuery({
    queryKey: ['allClothingForReco'],
    queryFn: () => base44.entities.ClothingItem.list('-created_date'),
  });
  
  // Outfit suggestions state
  const [selectedItems, setSelectedItems] = useState([]);
  const [occasion, setOccasion] = useState("");
  const [outfitSuggestion, setOutfitSuggestion] = useState(null);
  const [loadingOutfit, setLoadingOutfit] = useState(false);
  
  // Care instructions state
  const [selectedItemForCare, setSelectedItemForCare] = useState(null);
  const [careInstructions, setCareInstructions] = useState(null);
  const [loadingCare, setLoadingCare] = useState(false);
  
  // Enhanced Chat State
  const [styleQuestion, setStyleQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [selectedChatItem, setSelectedChatItem] = useState(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  
  // Suggested questions based on context
  const suggestedQuestions = [
    "How can I style my jewelry for a casual day out?",
    "What accessories go best with formal wear?",
    "Help me create a complete outfit for date night",
    "Which of my items work best together?",
    "What's trending in jewelry styling right now?"
  ];
  
  // Scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const occasions = [
    { value: "casual", label: "Casual / Everyday" },
    { value: "work", label: "Work / Office" },
    { value: "date", label: "Date Night" },
    { value: "party", label: "Party / Evening" },
    { value: "wedding", label: "Wedding / Formal" },
    { value: "vacation", label: "Vacation / Beach" },
    { value: "sport", label: "Sport / Active" }
  ];

  const generateOutfitSuggestion = async () => {
    if (selectedItems.length === 0) return;
    
    setLoadingOutfit(true);
    setOutfitSuggestion(null);
    
    try {
      const itemDescriptions = selectedItems.map(item => 
        `${item.name} (${item.type}, ${item.color || ''} ${item.material || ''} ${item.brand || ''})`
      ).join(", ");
      
      // Get user style preferences
      const stylePrefs = user?.style_preferences;
      const prefsContext = stylePrefs ? `
User Style Preferences:
- Favorite colors: ${stylePrefs.favorite_colors?.join(", ") || "not specified"}
- Preferred metals: ${stylePrefs.preferred_metals?.join(", ") || "not specified"}
- Aesthetics: ${stylePrefs.aesthetics?.join(", ") || "not specified"}
- Favorite jewelry types: ${stylePrefs.favorite_jewelry_types?.join(", ") || "not specified"}
` : "";

      // Build available products context for matching
      const availableJewelry = allJewelry?.slice(0, 20).map(j => 
        `ID:${j.id}|${j.name}|${j.type}|${j.metal_type || ''}|${j.gemstone_type || ''}|$${j.sale_price || j.price || 0}`
      ).join("\n") || "";
      
      const availableClothing = allClothing?.slice(0, 20).map(c => 
        `ID:${c.id}|${c.name}|${c.type}|${c.color || ''}|${c.material || ''}|$${c.price || 0}`
      ).join("\n") || "";
      
      const prompt = `You are a professional fashion stylist. Based on these wardrobe items: ${itemDescriptions}
      
Occasion: ${occasion || "general everyday wear"}

${prefsContext}

AVAILABLE PRODUCTS TO RECOMMEND (format: ID|Name|Type|Details|Price):

Jewelry:
${availableJewelry || "None available"}

Clothing:
${availableClothing || "None available"}
      
Provide styling advice in JSON format. For recommended_products, ONLY use actual product IDs from the lists above:
{
  "outfit_rating": 1-10 rating for how well these items work together,
  "styling_tips": "2-3 specific tips on how to style these items together",
  "complete_outfit": {
    "description": "Description of the complete outfit vision",
    "clothing_suggestions": ["specific clothing pieces to add"],
    "jewelry_suggestions": ["specific jewelry pieces to add"]
  },
  "recommended_products": [
    {"id": "actual_product_id_from_list", "type": "jewelry or clothing", "reason": "why this matches"}
  ],
  "color_advice": "advice on color coordination based on user preferences",
  "weather_suitability": "what weather/season this outfit is best for",
  "do_not": "one thing to avoid with this combination"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            outfit_rating: { type: "number" },
            styling_tips: { type: "string" },
            complete_outfit: { 
              type: "object",
              properties: {
                description: { type: "string" },
                clothing_suggestions: { type: "array", items: { type: "string" } },
                jewelry_suggestions: { type: "array", items: { type: "string" } }
              }
            },
            recommended_products: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  reason: { type: "string" }
                }
              } 
            },
            color_advice: { type: "string" },
            weather_suitability: { type: "string" },
            do_not: { type: "string" }
          }
        }
      });
      
      // Match recommended product IDs to actual products
      if (response.recommended_products) {
        response.matched_products = response.recommended_products.map(rec => {
          const product = rec.type === 'jewelry' 
            ? allJewelry?.find(j => j.id === rec.id)
            : allClothing?.find(c => c.id === rec.id);
          return product ? { ...product, itemType: rec.type, reason: rec.reason } : null;
        }).filter(Boolean);
      }
      
      setOutfitSuggestion(response);
    } catch (error) {
      console.error("Failed to generate outfit suggestion", error);
    } finally {
      setLoadingOutfit(false);
    }
  };

  const generateCareInstructions = async () => {
    if (!selectedItemForCare) return;
    
    setLoadingCare(true);
    setCareInstructions(null);
    
    try {
      const prompt = `You are a fabric care expert. Provide detailed care instructions for this clothing item:
      
      Item: ${selectedItemForCare.name}
      Type: ${selectedItemForCare.type}
      Material: ${selectedItemForCare.material || "Unknown"}
      Color: ${selectedItemForCare.color || "Unknown"}
      
      Provide care instructions in JSON format:
      {
        "washing": "detailed washing instructions",
        "drying": "how to dry properly",
        "ironing": "ironing temperature and tips",
        "storage": "best storage practices",
        "stain_removal": "tips for common stains",
        "longevity_tips": "how to make it last longer",
        "warnings": ["things to avoid"]
      }`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            washing: { type: "string" },
            drying: { type: "string" },
            ironing: { type: "string" },
            storage: { type: "string" },
            stain_removal: { type: "string" },
            longevity_tips: { type: "string" },
            warnings: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      setCareInstructions(response);
    } catch (error) {
      console.error("Failed to generate care instructions", error);
    } finally {
      setLoadingCare(false);
    }
  };

  const askStyleQuestion = async (questionOverride) => {
    const question = questionOverride || styleQuestion;
    if (!question.trim()) return;
    
    const userMessage = question;
    setStyleQuestion("");
    
    // Build user message with item context if selected
    const messageWithContext = selectedChatItem 
      ? { role: "user", content: userMessage, item: selectedChatItem }
      : { role: "user", content: userMessage };
    
    setChatHistory(prev => [...prev, messageWithContext]);
    setLoadingChat(true);
    setShowItemPicker(false);
    
    try {
      // Build comprehensive wardrobe context
      const clothingContext = clothingItems.slice(0, 15).map(item => 
        `- ${item.name}: ${item.type}, ${item.color || 'unknown color'}, ${item.material || ''}, ${item.brand || ''}`
      ).join("\n");
      
      const jewelryContext = jewelryItems.slice(0, 15).map(item => 
        `- ${item.name}: ${item.type}, ${item.metal_type || item.material || ''}, ${item.gemstone_type || ''}`
      ).join("\n");
      
      // User style preferences
      const stylePrefs = user?.style_preferences;
      const prefsContext = stylePrefs ? `
User Style Profile:
- Favorite colors: ${stylePrefs.favorite_colors?.join(", ") || "not specified"}
- Preferred metals: ${stylePrefs.preferred_metals?.join(", ") || "not specified"}
- Aesthetics: ${stylePrefs.aesthetics?.join(", ") || "not specified"}
- Favorite jewelry types: ${stylePrefs.favorite_jewelry_types?.join(", ") || "not specified"}
- Frequent occasions: ${stylePrefs.frequent_occasions?.join(", ") || "not specified"}
` : "";

      // Specific item context if user selected one
      const itemContext = selectedChatItem ? `
The user is specifically asking about this item:
- Name: ${selectedChatItem.name}
- Type: ${selectedChatItem.type}
- Color: ${selectedChatItem.color || 'N/A'}
- Material: ${selectedChatItem.material || selectedChatItem.metal_type || 'N/A'}
- Brand: ${selectedChatItem.brand || 'N/A'}
${selectedChatItem.gemstone_type ? `- Gemstone: ${selectedChatItem.gemstone_type}` : ''}
` : "";

      // Build conversation history for context
      const recentHistory = chatHistory.slice(-6).map(m => 
        `${m.role === 'user' ? 'User' : 'Stylist'}: ${m.content}`
      ).join("\n");
      
      // Available products for purchase recommendations
      const availableProducts = [
        ...(allJewelry?.slice(0, 10).map(j => `[JEWELRY:${j.id}] ${j.name} - ${j.type}, $${j.sale_price || j.price || 0}`) || []),
        ...(allClothing?.slice(0, 10).map(c => `[CLOTHING:${c.id}] ${c.name} - ${c.type}, $${c.price || 0}`) || [])
      ].join("\n");
      
      const prompt = `You are an expert personal fashion stylist with deep knowledge of jewelry, clothing, and style coordination. You provide personalized, context-aware advice.

${prefsContext}

USER'S WARDROBE:

Clothing Items:
${clothingContext || "No clothing items added yet"}

Jewelry Items:
${jewelryContext || "No jewelry items added yet"}

${itemContext}

AVAILABLE PRODUCTS FOR PURCHASE RECOMMENDATIONS:
${availableProducts || "No products available"}

CONVERSATION HISTORY:
${recentHistory || "This is the start of the conversation."}

USER'S QUESTION: ${userMessage}

INSTRUCTIONS:
1. Provide personalized advice that references SPECIFIC items from their wardrobe when relevant
2. Consider their style preferences and aesthetics
3. Suggest complete outfit combinations when appropriate
4. Be conversational, warm, and encouraging
5. If they ask about a specific item, provide detailed styling suggestions for that piece
6. Include occasion-based recommendations when relevant
7. Keep responses concise but helpful (2-4 paragraphs max)
8. Use emojis sparingly for a friendly tone
9. When suggesting items to purchase, mention them by name with the format "Check out [Product Name]" so we can link them
10. If the question relates to completing an outfit, recommend specific purchasable items that would complement their wardrobe`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt
      });
      
      // Parse response for product recommendations
      const productMatches = [];
      const jewelryIdPattern = /\[JEWELRY:([^\]]+)\]/g;
      const clothingIdPattern = /\[CLOTHING:([^\]]+)\]/g;
      
      let match;
      while ((match = jewelryIdPattern.exec(response)) !== null) {
        const product = allJewelry?.find(j => j.id === match[1]);
        if (product) productMatches.push({ ...product, itemType: 'jewelry' });
      }
      while ((match = clothingIdPattern.exec(response)) !== null) {
        const product = allClothing?.find(c => c.id === match[1]);
        if (product) productMatches.push({ ...product, itemType: 'clothing' });
      }
      
      // Clean response of ID tags
      const cleanedResponse = response.replace(/\[(JEWELRY|CLOTHING):[^\]]+\]/g, '');
      
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: cleanedResponse,
        products: productMatches.length > 0 ? productMatches : undefined
      }]);
      setSelectedChatItem(null);
    } catch (error) {
      console.error("Failed to get styling advice", error);
      setChatHistory(prev => [...prev, { role: "assistant", content: "I'm sorry, I couldn't process your question. Please try again!" }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-6 gap-2">
          <Wand2 className="w-4 h-4" />
          AI Stylist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Wardrobe Assistant
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="outfits" className="gap-2">
              <Shirt className="w-4 h-4" /> Outfits
            </TabsTrigger>
            <TabsTrigger value="care" className="gap-2">
              <WashingMachine className="w-4 h-4" /> Care
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="w-4 h-4" /> Ask AI
            </TabsTrigger>
          </TabsList>
          
          {/* Outfit Suggestions Tab */}
          <TabsContent value="outfits" className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">Select items from your wardrobe to get outfit suggestions:</p>
              
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-neutral-50 rounded-lg">
                {clothingItems.length === 0 ? (
                  <p className="text-sm text-neutral-400 p-2">Add clothing items to your closet first</p>
                ) : (
                  clothingItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleItemSelection(item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedItems.find(i => i.id === item.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-neutral-200 hover:border-purple-300'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))
                )}
              </div>
              
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {occasions.map(occ => (
                    <SelectItem key={occ.value} value={occ.value}>{occ.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={generateOutfitSuggestion}
                disabled={selectedItems.length === 0 || loadingOutfit}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loadingOutfit ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Get Outfit Suggestions</>
                )}
              </Button>
            </div>
            
            <AnimatePresence>
              {outfitSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 space-y-4 border border-purple-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      outfitSuggestion.outfit_rating >= 8 ? 'bg-green-100 text-green-700' :
                      outfitSuggestion.outfit_rating >= 5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {outfitSuggestion.outfit_rating}/10
                    </div>
                    <div>
                      <p className="font-medium">Outfit Rating</p>
                      <p className="text-xs text-neutral-500">Based on style compatibility</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-purple-700 mb-1">✨ Styling Tips</p>
                      <p className="text-neutral-600">{outfitSuggestion.styling_tips}</p>
                    </div>
                    
                    {outfitSuggestion.complete_outfit && (
                      <div className="bg-white rounded-lg p-3 border border-purple-100">
                        <p className="font-medium text-purple-700 mb-2">👗 Complete Outfit Vision</p>
                        <p className="text-neutral-600 text-xs mb-2">{outfitSuggestion.complete_outfit.description}</p>
                        
                        {outfitSuggestion.complete_outfit.clothing_suggestions?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-neutral-500 mb-1">Add clothing:</p>
                            <div className="flex flex-wrap gap-1">
                              {outfitSuggestion.complete_outfit.clothing_suggestions.map((s, i) => (
                                <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {outfitSuggestion.complete_outfit.jewelry_suggestions?.length > 0 && (
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Add jewelry:</p>
                            <div className="flex flex-wrap gap-1">
                              {outfitSuggestion.complete_outfit.jewelry_suggestions.map((s, i) => (
                                <span key={i} className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium text-purple-700 mb-1">🎨 Color Advice</p>
                      <p className="text-neutral-600">{outfitSuggestion.color_advice}</p>
                    </div>
                    
                    {/* Recommended Products to Purchase */}
                    {outfitSuggestion.matched_products?.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="font-medium text-green-700 mb-3 flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4" /> Shop Similar Items
                        </p>
                        <div className="space-y-2">
                          {outfitSuggestion.matched_products.map((product, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg">
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-white border flex-shrink-0">
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs truncate">{product.name}</p>
                                <p className="text-[10px] text-neutral-500 truncate">{product.reason}</p>
                                <p className="text-xs font-bold text-green-600">
                                  ${product.sale_price || product.price || 0}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Link to={createPageUrl(`ProductDetail?id=${product.id}&type=${product.itemType}`)}>
                                  <Button size="sm" variant="outline" className="h-7 text-[10px] px-2">
                                    <ExternalLink className="w-3 h-3 mr-1" /> View
                                  </Button>
                                </Link>
                                <Button 
                                  size="sm" 
                                  className="h-7 text-[10px] px-2 bg-green-600 hover:bg-green-700"
                                  onClick={() => addToCart(product)}
                                >
                                  <ShoppingBag className="w-3 h-3 mr-1" /> Add
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-4 pt-2 border-t border-purple-100">
                      <div className="flex items-center gap-1 text-xs text-neutral-500">
                        <Info className="w-3 h-3" /> {outfitSuggestion.weather_suitability}
                      </div>
                    </div>
                    
                    {outfitSuggestion.do_not && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-2 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{outfitSuggestion.do_not}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
          
          {/* Care Instructions Tab */}
          <TabsContent value="care" className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">Select an item to get AI-powered care instructions:</p>
              
              <Select 
                value={selectedItemForCare?.id || ""} 
                onValueChange={(id) => setSelectedItemForCare(clothingItems.find(i => i.id === id))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a clothing item" />
                </SelectTrigger>
                <SelectContent>
                  {clothingItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.material || item.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={generateCareInstructions}
                disabled={!selectedItemForCare || loadingCare}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loadingCare ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><WashingMachine className="w-4 h-4 mr-2" /> Get Care Instructions</>
                )}
              </Button>
            </div>
            
            <AnimatePresence>
              {careInstructions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 rounded-xl p-5 space-y-4 border border-blue-100"
                >
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Care Guide for {selectedItemForCare?.name}
                  </h4>
                  
                  <div className="grid gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-medium text-blue-700 mb-1">🧺 Washing</p>
                      <p className="text-neutral-600">{careInstructions.washing}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-medium text-blue-700 mb-1">☀️ Drying</p>
                      <p className="text-neutral-600">{careInstructions.drying}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-medium text-blue-700 mb-1">👔 Ironing</p>
                      <p className="text-neutral-600">{careInstructions.ironing}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-medium text-blue-700 mb-1">📦 Storage</p>
                      <p className="text-neutral-600">{careInstructions.storage}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-medium text-blue-700 mb-1">🧽 Stain Removal</p>
                      <p className="text-neutral-600">{careInstructions.stain_removal}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-medium text-blue-700 mb-1">💡 Longevity Tips</p>
                      <p className="text-neutral-600">{careInstructions.longevity_tips}</p>
                    </div>
                    
                    {careInstructions.warnings?.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <p className="font-medium text-red-700 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Warnings
                        </p>
                        <ul className="list-disc list-inside text-red-600 text-xs space-y-1">
                          {careInstructions.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
          
          {/* Enhanced Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 pr-2 mb-3">
              <div className="space-y-4 min-h-[280px] p-2">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Bot className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">Your Personal Style Assistant</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Ask me anything about styling your wardrobe items!
                      </p>
                    </div>
                    
                    {/* Suggested Questions */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-neutral-400 uppercase tracking-wide">Try asking:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {suggestedQuestions.slice(0, 3).map((q, i) => (
                          <button
                            key={i}
                            onClick={() => askStyleQuestion(q)}
                            className="text-xs bg-white border border-neutral-200 rounded-full px-3 py-1.5 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] space-y-2`}>
                        {/* Item context badge */}
                        {msg.item && (
                          <div className="flex justify-end">
                            <Badge variant="secondary" className="text-[10px] gap-1 bg-purple-100 text-purple-700">
                              {msg.item.type === 'jewelry' ? <Gem className="w-3 h-3" /> : <Shirt className="w-3 h-3" />}
                              {msg.item.name}
                            </Badge>
                          </div>
                        )}
                        
                        <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                          msg.role === 'user' 
                            ? 'bg-purple-600 text-white rounded-br-sm' 
                            : 'bg-white border border-neutral-200 rounded-bl-sm shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                        
                        {/* Product Recommendations in Chat */}
                        {msg.products && msg.products.length > 0 && (
                          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-2">
                            <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" /> Recommended Products
                            </p>
                            <div className="space-y-2">
                              {msg.products.slice(0, 3).map((product, pi) => (
                                <div key={pi} className="flex items-center gap-2 bg-white rounded-lg p-2">
                                  <div className="w-10 h-10 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{product.name}</p>
                                    <p className="text-[10px] text-green-600 font-bold">${product.sale_price || product.price || 0}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Link to={createPageUrl(`ProductDetail?id=${product.id}&type=${product.itemType}`)}>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <ExternalLink className="w-3 h-3" />
                                      </Button>
                                    </Link>
                                    <Button 
                                      size="sm" 
                                      className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                                      onClick={() => addToCart(product)}
                                    >
                                      <ShoppingBag className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-neutral-600" />
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
                
                {loadingChat && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 justify-start"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            
            {/* Item Picker */}
            <AnimatePresence>
              {showItemPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2 overflow-hidden"
                >
                  <div className="bg-neutral-50 rounded-lg p-3 border">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-medium text-neutral-600">Select an item to ask about:</p>
                      <button onClick={() => setShowItemPicker(false)} className="text-neutral-400 hover:text-neutral-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px]">
                        <Shirt className="w-3 h-3 mr-1" /> Clothing
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        <Gem className="w-3 h-3 mr-1" /> Jewelry
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {clothingItems.slice(0, 10).map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedChatItem({ ...item, itemType: 'clothing' });
                            setShowItemPicker(false);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border transition-all ${
                            selectedChatItem?.id === item.id 
                              ? 'bg-purple-100 border-purple-300 text-purple-700' 
                              : 'bg-white hover:border-purple-200'
                          }`}
                        >
                          <Shirt className="w-3 h-3" />
                          {item.name}
                        </button>
                      ))}
                      {jewelryItems.slice(0, 10).map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedChatItem({ ...item, itemType: 'jewelry' });
                            setShowItemPicker(false);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border transition-all ${
                            selectedChatItem?.id === item.id 
                              ? 'bg-amber-100 border-amber-300 text-amber-700' 
                              : 'bg-white hover:border-amber-200'
                          }`}
                        >
                          <Gem className="w-3 h-3" />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Selected Item Badge */}
            {selectedChatItem && !showItemPicker && (
              <div className="mb-2 flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 gap-1">
                  {selectedChatItem.itemType === 'jewelry' ? <Gem className="w-3 h-3" /> : <Shirt className="w-3 h-3" />}
                  Asking about: {selectedChatItem.name}
                  <button onClick={() => setSelectedChatItem(null)} className="ml-1 hover:text-purple-900">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </div>
            )}
            
            {/* Chat Input */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowItemPicker(!showItemPicker)}
                className={`shrink-0 ${showItemPicker ? 'bg-purple-50 border-purple-200' : ''}`}
                title="Select an item to ask about"
              >
                {selectedChatItem?.itemType === 'jewelry' ? <Gem className="w-4 h-4" /> : <Shirt className="w-4 h-4" />}
              </Button>
              
              <Input
                value={styleQuestion}
                onChange={(e) => setStyleQuestion(e.target.value)}
                placeholder={selectedChatItem ? `Ask about ${selectedChatItem.name}...` : "Ask a styling question..."}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && askStyleQuestion()}
                className="flex-1"
              />
              
              <Button 
                onClick={() => askStyleQuestion()}
                disabled={!styleQuestion.trim() || loadingChat}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            {chatHistory.length > 0 && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-neutral-500 h-7"
                  onClick={() => setChatHistory([])}
                >
                  Clear chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-neutral-500 h-7 ml-auto"
                  onClick={() => setShowItemPicker(true)}
                >
                  <Lightbulb className="w-3 h-3 mr-1" /> Ask about specific item
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}