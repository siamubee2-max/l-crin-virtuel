import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, RefreshCw, X, Maximize2, RotateCw, Move } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';

export default function ARLiveTryOn({ jewelryImage, onBack }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  
  // Jewelry Adjustments
  const [scale, setScale] = useState([1]);
  const [rotation, setRotation] = useState([0]);
  
  // Start Camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError(t.studio.ar.permissionDenied);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <h2 className="text-white font-serif text-lg">{t.studio.ar.title}</h2>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={onBack}>
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Main AR View */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4">{error}</p>
            <Button onClick={startCamera} variant="outline" className="text-black border-white bg-white">
              {t.common.retry || "Retry"}
            </Button>
          </div>
        ) : (
          <>
            {/* Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Draggable Jewelry Overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  drag
                  dragMomentum={false}
                  className="absolute cursor-move touch-none pointer-events-auto origin-center"
                  style={{ 
                    left: "50%", 
                    top: "50%",
                    x: "-50%",
                    y: "-50%",
                    width: "200px", 
                  }}
                  animate={{ 
                    scale: scale[0], 
                    rotate: rotation[0] 
                  }}
                >
                  <img 
                    src={jewelryImage} 
                    alt="Jewelry" 
                    className="w-full h-auto drop-shadow-2xl filter brightness-110" 
                    draggable={false}
                  />
                  
                  {/* Visual Guide for Interaction */}
                  <div className="absolute -inset-4 border-2 border-white/50 rounded-lg border-dashed opacity-50 pointer-events-none" />
                  
                  {/* Rotate Handle Visual (Non-functional, just visual cue) */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg opacity-80">
                     <RotateCw className="w-3 h-3 text-black" />
                  </div>
                </motion.div>
            </div>
            
            {/* Gesture Hint */}
            <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none opacity-70">
              <span className="bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-2 w-fit mx-auto">
                <Move className="w-3 h-3" /> Drag to move • Pinch to zoom
              </span>
            </div>
          </>
        )}
      </div>

      {/* Improved Controls Footer */}
      <div className="absolute bottom-8 left-4 right-4 z-20 flex gap-4 items-end">
         {/* Controls Pill */}
         <div className="flex-1 bg-black/60 backdrop-blur-lg rounded-2xl p-4 border border-white/10 text-white shadow-xl">
            <div className="space-y-4">
               <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-white/80">
                    <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Size</span>
                  </div>
                  <Slider 
                    value={scale} 
                    onValueChange={setScale} 
                    min={0.2} 
                    max={3} 
                    step={0.1}
                    className="cursor-pointer" 
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-white/80">
                    <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" /> Rotate</span>
                  </div>
                  <Slider 
                    value={rotation} 
                    onValueChange={setRotation} 
                    min={-180} 
                    max={180} 
                    step={5}
                    className="cursor-pointer"
                  />
                </div>
            </div>
         </div>

         {/* Actions */}
         <div className="flex flex-col gap-3">
             <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-full w-12 h-12 bg-white/90 hover:bg-white text-black shadow-lg"
              onClick={toggleCamera}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            
            <Button 
              size="icon" 
              className="rounded-full w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white shadow-lg border-4 border-white/20"
              onClick={() => alert("Snapshot saved to gallery!")}
            >
              <Camera className="w-6 h-6" />
            </Button>
         </div>
      </div>
    </div>
  );
}