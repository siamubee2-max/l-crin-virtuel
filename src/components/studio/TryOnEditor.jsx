import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Maximize2, RotateCw, Save, X, Undo2, Move, ZoomIn, Contrast, Sun } from "lucide-react";
import { motion } from "framer-motion";
import html2canvas from 'html2canvas';
import { base44 } from '@/api/base44Client';
import { Loader2 } from "lucide-react";
import { useLanguage } from '@/components/LanguageProvider';

export default function TryOnEditor({ resultImage, onSave, onCancel }) {
  const { t } = useLanguage();
  const [zoom, setZoom] = useState([1]);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const containerRef = useRef(null);

  const handleSave = async () => {
    if (!containerRef.current) return;
    setSaving(true);
    
    try {
      // Capture the composition
      const canvas = await html2canvas(containerRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2 // High quality capture
      });

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Canvas to Blob failed");
        }
        
        // Upload the new image
        // We need to pass a File object usually, but the integration might accept blob if we name it
        const file = new File([blob], "edited-tryon.png", { type: "image/png" });
        
        const result = await base44.integrations.Core.UploadFile({ file });
        
        if (result && result.file_url) {
          onSave(result.file_url);
        }
      }, 'image/png');
      
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save the image. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl h-[80vh]">
        
        {/* Editor Canvas */}
        <div className="flex-1 bg-neutral-100 relative overflow-hidden flex items-center justify-center select-none">
          <div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center bg-neutral-900"
          >
            <img 
              src={bodyImage} 
              alt="Body" 
              className="w-full h-full object-contain pointer-events-none"
              crossOrigin="anonymous"
            />
            
            <motion.div
              drag
              dragMomentum={false}
              className="absolute cursor-move touch-none"
              style={{ 
                left: `calc(50% + ${jewelryPosition.x}px)`, 
                top: `calc(50% + ${jewelryPosition.y}px)`,
                transform: `translate(-50%, -50%) scale(${jewelryScale[0]}) rotate(${jewelryRotation[0]}deg)`
              }}
              onDragEnd={(event, info) => {
                setJewelryPosition(prev => ({
                  x: prev.x + info.offset.x,
                  y: prev.y + info.offset.y
                }));
              }}
            >
              <img 
                src={jewelryImage} 
                alt="Jewelry" 
                className="w-48 drop-shadow-xl filter brightness-105"
                draggable={false}
                crossOrigin="anonymous"
              />
              <div className="absolute -inset-2 border-2 border-amber-500/50 rounded-lg border-dashed opacity-50 pointer-events-none" />
            </motion.div>
          </div>

          <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
             Editor Mode
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-full md:w-80 bg-white border-l border-neutral-100 p-6 flex flex-col gap-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Adjustments</h3>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6 flex-1">
             <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-800 border border-amber-100">
               <div className="flex items-center gap-2 font-medium mb-1">
                 <Move className="w-4 h-4" /> Position
               </div>
               Drag the jewelry directly on the image to place it perfectly.
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-neutral-600">
                    <span className="flex items-center gap-2"><Maximize2 className="w-4 h-4" /> Taille du bijou</span>
                    <span>{Math.round(jewelryScale[0] * 100)}%</span>
                  </div>
                  <Slider 
                    value={jewelryScale} 
                    onValueChange={setJewelryScale} 
                    min={0.1} 
                    max={3} 
                    step={0.05} 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-neutral-600">
                    <span className="flex items-center gap-2"><RotateCw className="w-4 h-4" /> Rotation</span>
                    <span>{jewelryRotation[0]}°</span>
                  </div>
                  <Slider 
                    value={jewelryRotation} 
                    onValueChange={setJewelryRotation} 
                    min={-180} 
                    max={180} 
                    step={1} 
                  />
                </div>
             </div>
             
             <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { 
                    setJewelryScale([1]); 
                    setJewelryRotation([0]); 
                    setJewelryPosition({ x: 0, y: 0 }); 
                  }}
                  className="text-neutral-500"
                >
                  <Undo2 className="w-4 h-4 mr-2" /> Réinitialiser
                </Button>
             </div>
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <Button 
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800" 
              size="lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? "Processing..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}