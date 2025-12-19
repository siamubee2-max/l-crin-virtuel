import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, RefreshCw, X, Maximize2, RotateCw } from "lucide-react";
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
              {t.common.retry}
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
                {/* 
                   We use a container that is full screen but allows pointer events only on the draggable item.
                   However, framer-motion drag works best when the element itself catches events.
                   We put pointer-events-auto on the motion.div
                */}
                <motion.div
                  drag
                  dragMomentum={false}
                  className="absolute cursor-move touch-none pointer-events-auto origin-center"
                  style={{ 
                    left: "50%", 
                    top: "50%",
                    x: "-50%",
                    y: "-50%",
                    width: "200px", // Base width, scaled by transform
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
                  <div className="absolute -inset-4 border-2 border-white/30 rounded-lg opacity-0 hover:opacity-100 transition-opacity border-dashed pointer-events-none" />
                </motion.div>
            </div>
          </>
        )}
      </div>

      {/* Controls Footer */}
      <div className="bg-neutral-900/90 backdrop-blur-md p-6 pb-8 rounded-t-3xl border-t border-white/10 z-20">
        <div className="max-w-md mx-auto space-y-6">
          
          <div className="text-center text-white/60 text-xs mb-4">
            {t.studio.ar.desc}
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/80">
                <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> {t.studio.ar.size}</span>
                <span>{Math.round(scale[0] * 100)}%</span>
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
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/80">
                <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" /> {t.studio.ar.rotation}</span>
                <span>{rotation[0]}°</span>
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

          <div className="flex justify-center gap-4 pt-2">
             <Button 
              size="lg" 
              className="rounded-full w-16 h-16 bg-white hover:bg-neutral-200 text-black p-0 shadow-lg shadow-white/10"
              onClick={() => {
                // In a real app we would capture the canvas, but here we just simulate
                alert("Snapshot feature coming soon!");
              }}
            >
              <div className="w-14 h-14 rounded-full border-2 border-black/10" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-12 h-12 bg-neutral-800 border-neutral-700 text-white absolute right-8 bottom-8"
              onClick={toggleCamera}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}