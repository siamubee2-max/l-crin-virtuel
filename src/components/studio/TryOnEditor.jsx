import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Save, X, Undo2, Move, ZoomIn, Contrast, Sun, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import html2canvas from 'html2canvas';
import { base44 } from '@/api/apiClient';
import { useLanguage } from '@/components/LanguageProvider';

export default function TryOnEditor({ resultImage, onSave, onCancel }) {
  const { t } = useLanguage();
  const editor = t.studio?.editor || {};
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
      const canvas = await html2canvas(containerRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#171717',
        scale: 2
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Canvas to Blob failed");
        }
        
        const file = new File([blob], "edited-tryon.png", { type: "image/png" });
        const result = await base44.integrations.Core.UploadFile({ file });
        
        if (result && result.file_url) {
          onSave(result.file_url);
        }
        setSaving(false);
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
        <div className="flex-1 bg-neutral-900 relative overflow-hidden flex items-center justify-center select-none">
          <div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center bg-neutral-900 overflow-hidden"
          >
            <motion.img 
              src={resultImage} 
              alt="Result" 
              className="max-w-full max-h-full object-contain cursor-move"
              crossOrigin="anonymous"
              drag
              dragMomentum={false}
              onDragEnd={(event, info) => {
                setPosition(prev => ({
                  x: prev.x + info.offset.x,
                  y: prev.y + info.offset.y
                }));
              }}
              style={{ 
                x: position.x,
                y: position.y,
                scale: zoom[0],
                filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%)`
              }}
              draggable={false}
            />
          </div>

          <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
             {editor.editMode || "Mode Édition"}
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-full md:w-80 bg-white border-l border-neutral-100 p-6 flex flex-col gap-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">{editor.title || "Ajustements"}</h3>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6 flex-1">
             <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-800 border border-amber-100">
               <div className="flex items-center gap-2 font-medium mb-1">
                 <Move className="w-4 h-4" /> {editor.position || "Position"}
               </div>
               {editor.positionDesc || "Glissez l'image pour la repositionner."}
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-neutral-600">
                    <span className="flex items-center gap-2"><ZoomIn className="w-4 h-4" /> {editor.zoom || "Zoom"}</span>
                    <span>{Math.round(zoom[0] * 100)}%</span>
                  </div>
                  <Slider 
                    value={zoom} 
                    onValueChange={setZoom} 
                    min={0.5} 
                    max={3} 
                    step={0.05}
                    className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-neutral-600">
                    <span className="flex items-center gap-2"><Sun className="w-4 h-4" /> {editor.brightness || "Luminosité"}</span>
                    <span>{brightness[0]}%</span>
                  </div>
                  <Slider 
                    value={brightness} 
                    onValueChange={setBrightness} 
                    min={50} 
                    max={150} 
                    step={1}
                    className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-neutral-600">
                    <span className="flex items-center gap-2"><Contrast className="w-4 h-4" /> {editor.contrast || "Contraste"}</span>
                    <span>{contrast[0]}%</span>
                  </div>
                  <Slider 
                    value={contrast} 
                    onValueChange={setContrast} 
                    min={50} 
                    max={150} 
                    step={1}
                    className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
                  />
                </div>
             </div>
             
             <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { 
                    setZoom([1]); 
                    setBrightness([100]); 
                    setContrast([100]); 
                    setPosition({ x: 0, y: 0 }); 
                  }}
                  className="text-neutral-500"
                >
                  <Undo2 className="w-4 h-4 mr-2" /> {editor.reset || "Réinitialiser"}
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
              {saving ? (editor.processing || "Traitement...") : (editor.save || "Enregistrer")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}