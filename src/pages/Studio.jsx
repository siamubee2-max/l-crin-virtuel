import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Upload, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const STEPS = {
  UPLOAD: 0,
  SELECT_BODY: 1,
  GENERATE: 2,
  RESULT: 3
};

export default function Studio() {
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
        - If the type is 'set', please identify and place all components (e.g., necklace AND earrings) appropriately on the model.
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
      alert("Une erreur est survenue lors de la génération. Veuillez réessayer.");
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
    if (jewelryType === 'set') return part.type === 'face' || part.type === 'neck';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-serif text-neutral-900 mb-4">L'Atelier de Création</h1>
        <p className="text-neutral-500">
          Essayez virtuellement n'importe quel bijou en quelques secondes grâce à l'IA.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
        
        {/* Left Side - Progress & Steps */}
        <div className="w-full md:w-1/3 bg-neutral-50 p-8 border-r border-neutral-100 flex flex-col">
          <div className="space-y-6">
            {[
              { id: STEPS.UPLOAD, label: "Le Bijou", icon: "💎" },
              { id: STEPS.SELECT_BODY, label: "Le Modèle", icon: "👤" },
              { id: STEPS.GENERATE, label: "La Magie", icon: "✨" },
              { id: STEPS.RESULT, label: "Le Résultat", icon: "🖼️" },
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
                <RefreshCw className="w-4 h-4 mr-2" /> Nouvel Essai
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
                  <h2 className="text-2xl font-serif">Choisissez le bijou</h2>
                  <p className="text-neutral-500 text-sm">Importez une photo depuis une boutique en ligne ou prenez-la en photo.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type de bijou</Label>
                    <Select value={jewelryType} onValueChange={setJewelryType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earrings">Boucles d'oreilles</SelectItem>
                        <SelectItem value="necklace">Collier / Pendentif</SelectItem>
                        <SelectItem value="ring">Bague</SelectItem>
                        <SelectItem value="bracelet">Bracelet</SelectItem>
                        <SelectItem value="anklet">Bracelet de cheville</SelectItem>
                        <SelectItem value="set">Parure Complète</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                      <p className="text-neutral-900 font-medium">Cliquez pour importer</p>
                      <p className="text-neutral-400 text-sm mt-1">JPG, PNG</p>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(STEPS.SELECT_BODY)}
                    disabled={!jewelryImage}
                    className="bg-neutral-900 text-white hover:bg-neutral-800"
                  >
                    Suivant <ArrowRight className="w-4 h-4 ml-2" />
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
                  <h2 className="text-2xl font-serif">Sur qui on essaye ?</h2>
                  <p className="text-neutral-500 text-sm">Sélectionnez une photo compatible depuis votre bibliothèque.</p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
                  {filteredBodyParts?.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-neutral-500 mb-4">Aucune photo compatible trouvée dans votre bibliothèque.</p>
                      <Button variant="outline" onClick={() => navigate(createPageUrl('Wardrobe'))}>
                        Aller à la bibliothèque
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

                <div className="space-y-2">
                  <Label>Instructions spéciales (Optionnel)</Label>
                  <Input 
                    placeholder="Ex: Le bijou est très petit, gardez les proportions..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(STEPS.UPLOAD)}>Retour</Button>
                  <Button 
                    onClick={generateTryOn}
                    disabled={!selectedBodyPartId}
                    className="bg-amber-600 text-white hover:bg-amber-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Générer l'Essayage
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
                  <h3 className="text-xl font-serif font-medium">Création de la magie...</h3>
                  <p className="text-neutral-500 mt-2 max-w-xs mx-auto">
                    L'IA ajuste la lumière, les ombres et la perspective pour un rendu parfait.
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
                  <h2 className="text-2xl font-serif">C'est prêt !</h2>
                  <p className="text-neutral-500 text-sm">Voici votre essayage virtuel.</p>
                </div>

                <div className="flex-1 bg-neutral-900 rounded-xl overflow-hidden relative group">
                  <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(resultImage, '_blank')}
                  >
                    Télécharger
                  </Button>
                  <Button 
                    className="w-full bg-neutral-900 text-white"
                    onClick={() => navigate(createPageUrl("Gallery"))}
                  >
                    Aller à la Galerie
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