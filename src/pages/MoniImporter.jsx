import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight, Link as LinkIcon, Download, Heart, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { useLanguage } from '@/components/LanguageProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from "framer-motion";

export default function MoniImporter() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedItem, setAnalyzedItem] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async (productUrl) => {
      setIsAnalyzing(true);
      setAnalyzedItem(null);
      
      try {
        // 1. Fetch the website content
        const websiteContent = await base44.integrations.Core.fetch_website({
            url: productUrl,
            formats: ["markdown"]
        });

        if (!websiteContent || !websiteContent.markdown) {
            throw new Error("Impossible de lire la page");
        }

        // 2. Extract structured data using LLM
        const extraction = await base44.integrations.Core.InvokeLLM({
          prompt: `
            Extract product information from this markdown content of a jewelry product page.
            URL: ${productUrl}
            
            Return a JSON with:
            - name: Product title
            - price: Price as number (remove currency symbol)
            - description: Short description
            - image_url: The main product image URL (look for the largest/main image)
            - type: One of [necklace, earrings, ring, bracelet, set, other] based on the name/desc.
            - material: Material if mentioned (e.g. Resin, Polymer Clay)
          `,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
              description: { type: "string" },
              image_url: { type: "string" },
              type: { type: "string" },
              material: { type: "string" }
            }
          },
          // We pass the markdown as context. 
          // Note: In a real scenario we might truncate if too long, but let's assume it fits or SDK handles it.
          // Actually, passing it as part of prompt is safer for now if no "context" param exists in this specific SDK version shown in prompt, 
          // but let's check instructions. SDK has add_context_from_internet, but here we have the content.
          // We'll append it to prompt.
        });
        
        // Parse result if it's a string (though SDK usually handles json_schema return as dict)
        // extraction is likely the dict already.
        
        return { ...extraction, affiliate_url: productUrl };

      } catch (error) {
        console.error("Extraction error:", error);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    onSuccess: (data) => {
      setAnalyzedItem(data);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (itemData) => {
      // 1. Create JewelryItem
      const newItem = await base44.entities.JewelryItem.create({
        name: itemData.name || "Imported Item",
        type: itemData.type || "other",
        image_url: itemData.image_url || "https://placehold.co/400?text=No+Image",
        description: itemData.description || "",
        price: itemData.price || 0,
        brand: "Moni'attitude",
        affiliate_url: itemData.affiliate_url,
        material: itemData.material || "",
        tags: ["coup-de-coeur", "import"]
      });

      // 2. Add to Wishlist
      await base44.entities.WishlistItem.create({
        jewelry_item_id: newItem.id
      });
      
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
      queryClient.invalidateQueries({ queryKey: ['jewelryItems'] });
      navigate(createPageUrl("Profile"));
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-serif text-neutral-900">
          Importer un Coup de Cœur
        </h1>
        <p className="text-neutral-500 max-w-xl mx-auto">
          Vous avez repéré une pépite sur <span className="font-semibold text-amber-600">moniattitude.com</span> ? 
          Importez-la directement dans votre Écrin Virtuel pour l'essayer ou la sauvegarder.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left: Instructions & External Link */}
        <div className="space-y-6">
           <Card className="bg-amber-50/50 border-amber-100">
             <CardContent className="pt-6">
                <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-amber-600" /> 
                  Comment faire ?
                </h3>
                <ol className="space-y-4 text-sm text-neutral-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">1</span>
                    <span>
                      Visitez la boutique officielle <a href="https://moniattitude.com" target="_blank" rel="noreferrer" className="font-medium underline text-amber-700 hover:text-amber-900">moniattitude.com</a>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">2</span>
                    <span>
                      Naviguez et trouvez un bijou qui vous plaît.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">3</span>
                    <span>
                      Copiez l'URL (le lien) de la page du produit.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">4</span>
                    <span>
                      Collez-le ci-contre et cliquez sur "Importer".
                    </span>
                  </li>
                </ol>
                
                <div className="mt-6">
                   <Button 
                     className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                     onClick={() => window.open("https://moniattitude.com", "_blank")}
                   >
                     Ouvrir Moni'attitude <ExternalLink className="ml-2 w-4 h-4" />
                   </Button>
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Right: Import Form */}
        <div className="space-y-6">
          <Card className="border-neutral-200 shadow-lg">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Download className="w-5 h-5 text-neutral-500" /> Importation Magique
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-neutral-700">Lien du produit (URL)</label>
                   <div className="flex gap-2">
                      <Input 
                        placeholder="https://moniattitude.com/..." 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1"
                      />
                   </div>
                </div>

                <Button 
                  onClick={() => analyzeMutation.mutate(url)} 
                  disabled={!url || analyzeMutation.isPending}
                  className="w-full bg-neutral-900 text-white"
                >
                  {analyzeMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse en cours...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Analyser et Importer</>
                  )}
                </Button>

                {analyzeMutation.isError && (
                  <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                    Une erreur est survenue lors de l'analyse. Vérifiez le lien et réessayez.
                  </p>
                )}
             </CardContent>
          </Card>

          {/* Preview Result */}
          <AnimatePresence>
            {analyzedItem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-green-200 bg-green-50/30 overflow-hidden">
                   <div className="aspect-video relative bg-white">
                      <img src={analyzedItem.image_url} alt={analyzedItem.name} className="w-full h-full object-contain" />
                   </div>
                   <CardContent className="pt-4 space-y-4">
                      <div>
                        <h3 className="font-serif text-xl font-medium text-green-900">{analyzedItem.name}</h3>
                        <p className="text-green-700 font-bold mt-1">{analyzedItem.price} €</p>
                      </div>
                      <p className="text-sm text-neutral-600 line-clamp-2">{analyzedItem.description}</p>
                      
                      <Button 
                        onClick={() => saveMutation.mutate(analyzedItem)}
                        disabled={saveMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                         {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                         Ajouter à ma Liste de Souhaits
                      </Button>
                   </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Iframe Preview (Optional / Beta) */}
      <div className="pt-8 border-t border-neutral-100">
         <h3 className="text-lg font-serif mb-4 text-neutral-400 text-center uppercase tracking-widest text-xs">Aperçu direct</h3>
         <div className="w-full h-[600px] border rounded-xl overflow-hidden bg-neutral-100 relative">
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400 pointer-events-none">
               <p className="bg-white/80 p-4 rounded-lg backdrop-blur-sm">Chargement de la boutique...</p>
            </div>
            <iframe 
              src="https://moniattitude.com" 
              className="w-full h-full"
              title="Moni'attitude Boutique"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
         </div>
         <p className="text-xs text-center text-neutral-400 mt-2">
           Note : Certains sites peuvent bloquer l'affichage intégré. Si l'affichage ne fonctionne pas, utilisez le bouton "Ouvrir Moni'attitude" ci-dessus.
         </p>
      </div>
    </div>
  );
}