import React, { useRef, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, RefreshCw, X, Maximize2, RotateCw, Move, Loader2, Check, Sparkles, Eye, EyeOff, Gem, Shirt, Scan, Zap, Sun, Contrast, Share2, Link as LinkIcon, Download, Instagram, Facebook } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import { useQueryClient } from '@tanstack/react-query';

// Positioning presets based on jewelry type
const JEWELRY_PRESETS = {
  earrings: { x: 70, y: -60, scale: 0.35 },
  necklace: { x: 0, y: 80, scale: 0.7 },
  ring: { x: 80, y: 120, scale: 0.25 },
  bracelet: { x: 100, y: 100, scale: 0.4 },
  anklet: { x: 0, y: 200, scale: 0.3 },
  default: { x: 0, y: 0, scale: 1 }
};

const CLOTHING_PRESETS = {
  top: { x: 0, y: 50, scale: 1.2 },
  dress: { x: 0, y: 80, scale: 1.5 },
  outerwear: { x: 0, y: 40, scale: 1.3 },
  default: { x: 0, y: 0, scale: 1 }
};

export default function ARLiveTryOn({ jewelryImage, jewelryType = "necklace", clothingImage, clothingType = "top", mode = "jewelry", onBack, onSaveToGallery }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  
  // Face detection state
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState(null);
  const [autoTrack, setAutoTrack] = useState(true);
  
  // Visual effects
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [showEffects, setShowEffects] = useState(false);
  
  // Get preset based on item type
  const preset = mode === "jewelry" 
    ? (JEWELRY_PRESETS[jewelryType] || JEWELRY_PRESETS.default)
    : (CLOTHING_PRESETS[clothingType] || CLOTHING_PRESETS.default);
  
  // Jewelry/Clothing Adjustments
  const [position, setPosition] = useState({ x: preset.x, y: preset.y });
  const [scale, setScale] = useState([preset.scale]);
  const [rotation, setRotation] = useState([0]);
  const [opacity, setOpacity] = useState([1]);
  
  // For earrings, we need two positions (mirrored)
  const [isSymmetric, setIsSymmetric] = useState(jewelryType === 'earrings');
  
  // Face detection using canvas-based approach
  const detectFace = useCallback(() => {
    if (!videoRef.current || !detectionCanvasRef.current || !autoTrack) return;
    
    const video = videoRef.current;
    const canvas = detectionCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (video.readyState !== 4) return;
    
    canvas.width = 160; // Small for performance
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, 160, 120);
    
    const imageData = ctx.getImageData(0, 0, 160, 120);
    const data = imageData.data;
    
    // Simple skin tone detection for face region estimation
    let skinPixels = [];
    for (let y = 0; y < 120; y++) {
      for (let x = 0; x < 160; x++) {
        const i = (y * 160 + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        
        // Skin tone detection heuristic (works for various skin tones)
        const isSkin = (
          r > 60 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15 &&
          r - b > 15 && r - b < 170
        );
        
        if (isSkin) {
          skinPixels.push({ x, y });
        }
      }
    }
    
    if (skinPixels.length > 200) {
      // Calculate centroid of skin pixels (approximates face center)
      const avgX = skinPixels.reduce((sum, p) => sum + p.x, 0) / skinPixels.length;
      const avgY = skinPixels.reduce((sum, p) => sum + p.y, 0) / skinPixels.length;
      
      // Find bounding box
      const minY = Math.min(...skinPixels.map(p => p.y));
      const maxY = Math.max(...skinPixels.map(p => p.y));
      const faceHeight = maxY - minY;
      
      // Convert to screen coordinates
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const scaleX = containerRect.width / 160;
        const scaleY = containerRect.height / 120;
        
        setFacePosition({
          x: (facingMode === "user" ? (160 - avgX) : avgX) * scaleX - containerRect.width / 2,
          y: avgY * scaleY - containerRect.height / 2,
          width: faceHeight * scaleX * 0.8,
          height: faceHeight * scaleY
        });
        setFaceDetected(true);
        
        // Auto-position jewelry based on face
        if (autoTrack && mode === "jewelry") {
          const faceX = (facingMode === "user" ? (160 - avgX) : avgX) * scaleX - containerRect.width / 2;
          const faceY = avgY * scaleY - containerRect.height / 2;
          const faceScale = faceHeight / 60; // Normalize
          
          if (jewelryType === 'necklace') {
            setPosition({ x: faceX, y: faceY + faceHeight * scaleY * 0.6 });
            setScale([0.7 * faceScale]);
          } else if (jewelryType === 'earrings') {
            setPosition({ x: faceHeight * scaleX * 0.4, y: faceY - 10 });
            setScale([0.3 * faceScale]);
          }
        }
      }
    } else {
      setFaceDetected(false);
    }
    
    animationFrameRef.current = requestAnimationFrame(detectFace);
  }, [autoTrack, facingMode, mode, jewelryType]);
  
  useEffect(() => {
    if (stream && autoTrack) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream, autoTrack, detectFace]);

  // Start Camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError(t.studio?.ar?.permissionDenied || "Camera access denied");
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

  const captureSnapshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsSaving(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame
      ctx.drawImage(video, 0, 0);
      
      // Calculate overlay position relative to video dimensions
      const containerRect = containerRef.current?.getBoundingClientRect();
      const scaleFactorX = video.videoWidth / (containerRect?.width || 1);
      const scaleFactorY = video.videoHeight / (containerRect?.height || 1);
      
      // Draw jewelry/clothing overlay
      const itemImage = mode === "jewelry" ? jewelryImage : clothingImage;
      if (itemImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = itemImage;
        });
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const itemWidth = 200 * scale[0] * scaleFactorX;
        const itemHeight = (img.height / img.width) * itemWidth;
        
        ctx.save();
        ctx.globalAlpha = opacity[0];
        ctx.translate(centerX + position.x * scaleFactorX, centerY + position.y * scaleFactorY);
        ctx.rotate((rotation[0] * Math.PI) / 180);
        ctx.drawImage(img, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight);
        
        // Draw symmetric item for earrings
        if (isSymmetric && mode === "jewelry") {
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = opacity[0];
          ctx.translate(centerX - position.x * scaleFactorX, centerY + position.y * scaleFactorY);
          ctx.rotate((-rotation[0] * Math.PI) / 180);
          ctx.scale(-1, 1); // Mirror
          ctx.drawImage(img, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight);
        }
        
        ctx.restore();
      }
      
      // Add watermark
      const watermarkText = "L'Écrin Virtuel";
      ctx.save();
      ctx.font = `bold ${Math.max(16, canvas.width * 0.025)}px serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      const textMetrics = ctx.measureText(watermarkText);
      const padding = 20;
      const textX = canvas.width - textMetrics.width - padding;
      const textY = canvas.height - padding;
      ctx.strokeText(watermarkText, textX, textY);
      ctx.fillText(watermarkText, textX, textY);
      
      // Add small logo icon (É)
      ctx.font = `bold ${Math.max(20, canvas.width * 0.03)}px serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      const logoX = textX - 30;
      ctx.fillText("É", logoX, textY);
      ctx.restore();
      
      // Convert to blob and upload
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      const file = new File([blob], `ar-tryon-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Save to Creation entity
      await base44.entities.Creation.create({
        jewelry_image_url: mode === "jewelry" ? jewelryImage : null,
        result_image_url: file_url,
        description: `AR Try-On - ${mode === "jewelry" ? jewelryType : "Clothing"}`,
        jewelry_type: mode === "jewelry" ? jewelryType : null
      });
      
      // Invalidate gallery query
      queryClient.invalidateQueries({ queryKey: ['creations'] });
      
      setSavedImageUrl(file_url);
      setSavedSuccess(true);
      setShowSharePanel(true);
      
    } catch (err) {
      console.error("Capture failed:", err);
      alert("Failed to save snapshot. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [jewelryImage, clothingImage, mode, jewelryType, scale, rotation, opacity, position, isSymmetric, queryClient, onSaveToGallery]);

  const itemImage = mode === "jewelry" ? jewelryImage : clothingImage;
  
  const videoStyle = {
    transform: facingMode === "user" ? "scaleX(-1)" : "none",
    filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%)`
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={detectionCanvasRef} className="hidden" />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-serif text-lg flex items-center gap-2">
            {mode === "jewelry" ? <Gem className="w-5 h-5 text-amber-400" /> : <Shirt className="w-5 h-5 text-blue-400" />}
            {t.studio?.ar?.title || "Virtual Mirror"}
          </h2>
          {jewelryType && mode === "jewelry" && (
            <span className="text-xs bg-white/20 text-white/80 px-2 py-1 rounded-full capitalize">
              {jewelryType}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {/* Auto-track toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full ${autoTrack ? 'text-green-400 bg-green-400/20' : 'text-white/70 hover:text-white hover:bg-white/20'}`}
            onClick={() => setAutoTrack(!autoTrack)}
            title="Auto-track face"
          >
            <Scan className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full ${showEffects ? 'text-amber-400 bg-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/20'}`}
            onClick={() => setShowEffects(!showEffects)}
            title="Visual effects"
          >
            <Zap className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/70 hover:text-white hover:bg-white/20 rounded-full"
            onClick={() => setShowGuides(!showGuides)}
          >
            {showGuides ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-full" 
            onClick={onBack}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      {/* Face Detection Indicator */}
      <AnimatePresence>
        {autoTrack && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20"
          >
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
              faceDetected 
                ? 'bg-green-500/80 text-white' 
                : 'bg-yellow-500/80 text-white'
            }`}>
              <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
              {faceDetected ? 'Face detected - Auto-positioning' : 'Looking for face...'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main AR View */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4">{error}</p>
            <Button onClick={startCamera} variant="outline" className="text-black border-white bg-white">
              Retry
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
              style={videoStyle}
            />
            
            {/* Face detection box overlay */}
            {showGuides && faceDetected && facePosition && autoTrack && (
              <motion.div
                className="absolute border-2 border-green-400/50 rounded-2xl pointer-events-none"
                style={{
                  left: `calc(50% + ${facePosition.x}px - ${facePosition.width/2}px)`,
                  top: `calc(50% + ${facePosition.y}px - ${facePosition.height/2}px)`,
                  width: facePosition.width,
                  height: facePosition.height
                }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            {/* Face/Body Guide Overlay */}
            {showGuides && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative">
                  {/* Face outline guide */}
                  <div className="w-48 h-64 border-2 border-dashed border-white/30 rounded-[50%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  {/* Neck guide for necklaces */}
                  {jewelryType === 'necklace' && (
                    <div className="w-32 h-16 border-2 border-dashed border-amber-400/40 rounded-b-full absolute top-[calc(50%+100px)] left-1/2 -translate-x-1/2" />
                  )}
                  {/* Ear guides for earrings */}
                  {jewelryType === 'earrings' && (
                    <>
                      <div className="w-6 h-10 border-2 border-dashed border-amber-400/40 rounded-full absolute top-[calc(50%-40px)] left-[calc(50%-90px)]" />
                      <div className="w-6 h-10 border-2 border-dashed border-amber-400/40 rounded-full absolute top-[calc(50%-40px)] left-[calc(50%+84px)]" />
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Draggable Item Overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                drag
                dragMomentum={false}
                onDragEnd={(e, info) => {
                  setPosition(prev => ({
                    x: prev.x + info.offset.x,
                    y: prev.y + info.offset.y
                  }));
                }}
                className="absolute cursor-move touch-none pointer-events-auto origin-center"
                style={{ 
                  left: "50%", 
                  top: "50%",
                  x: position.x - 100,
                  y: position.y - 100,
                  width: "200px", 
                }}
                animate={{ 
                  scale: scale[0], 
                  rotate: rotation[0],
                  opacity: opacity[0]
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <img 
                  src={itemImage} 
                  alt="Item" 
                  className="w-full h-auto drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] filter brightness-105 contrast-105" 
                  draggable={false}
                />
                
                {/* Visual Guide for Interaction */}
                {showGuides && (
                  <div className="absolute -inset-4 border-2 border-white/40 rounded-lg border-dashed pointer-events-none" />
                )}
              </motion.div>
              
              {/* Symmetric item for earrings */}
              {isSymmetric && mode === "jewelry" && (
                <motion.div
                  className="absolute pointer-events-none origin-center"
                  style={{ 
                    left: "50%", 
                    top: "50%",
                    x: -position.x - 100,
                    y: position.y - 100,
                    width: "200px",
                    transform: "scaleX(-1)"
                  }}
                  animate={{ 
                    scale: scale[0], 
                    rotate: -rotation[0],
                    opacity: opacity[0]
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <img 
                    src={itemImage} 
                    alt="Item Mirror" 
                    className="w-full h-auto drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] filter brightness-105 contrast-105" 
                    draggable={false}
                  />
                </motion.div>
              )}
            </div>
            
            {/* Gesture Hint */}
            <AnimatePresence>
              {showGuides && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-36 left-0 right-0 text-center pointer-events-none"
                >
                  <span className="bg-black/50 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-3 w-fit mx-auto">
                    <Move className="w-4 h-4" /> Drag to position
                    <span className="w-px h-4 bg-white/30" />
                    Use sliders to adjust
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Share Panel Overlay */}
            <AnimatePresence>
              {showSharePanel && savedImageUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 flex items-center justify-center z-30 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl p-6 text-center shadow-2xl max-w-sm w-full"
                  >
                    {/* Preview Image */}
                    <div className="relative mb-4 rounded-xl overflow-hidden aspect-[3/4] bg-neutral-100">
                      <img src={savedImageUrl} alt="Your try-on" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        L'Écrin Virtuel
                      </div>
                    </div>
                    
                    {/* Success Message */}
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Saved to Gallery!</span>
                    </div>
                    
                    {/* Share Title */}
                    <h3 className="font-serif text-lg mb-4">Share your look</h3>
                    
                    {/* Social Share Buttons */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <button
                        onClick={() => {
                          const url = `https://www.instagram.com/`;
                          navigator.clipboard.writeText(`Check out my virtual try-on! ${savedImageUrl}`);
                          window.open(url, '_blank');
                        }}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white hover:opacity-90 transition-opacity"
                      >
                        <Instagram className="w-5 h-5" />
                        <span className="text-[10px]">Instagram</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(savedImageUrl)}`;
                          window.open(shareUrl, '_blank', 'width=600,height=400');
                        }}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
                      >
                        <Facebook className="w-5 h-5" />
                        <span className="text-[10px]">Facebook</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(savedImageUrl)}&description=${encodeURIComponent("My virtual try-on from L'Écrin Virtuel")}`;
                          window.open(shareUrl, '_blank', 'width=600,height=400');
                        }}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#E60023] text-white hover:opacity-90 transition-opacity"
                      >
                        <span className="font-bold text-lg">P</span>
                        <span className="text-[10px]">Pinterest</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(savedImageUrl);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${linkCopied ? 'bg-green-500 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                      >
                        {linkCopied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                        <span className="text-[10px]">{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                    
                    {/* Download Button */}
                    <Button
                      variant="outline"
                      className="w-full mb-3"
                      onClick={() => window.open(savedImageUrl, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Image
                    </Button>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => {
                          setShowSharePanel(false);
                          setSavedSuccess(false);
                          setSavedImageUrl(null);
                        }}
                      >
                        Take Another
                      </Button>
                      <Button
                        className="flex-1 bg-amber-600 hover:bg-amber-700"
                        onClick={() => {
                          if (onSaveToGallery) {
                            onSaveToGallery(savedImageUrl);
                          }
                        }}
                      >
                        View in Gallery
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Controls Footer */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex gap-4 items-end">
        {/* Controls Panel */}
        <div className="flex-1 bg-black/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-white shadow-2xl">
          <div className="space-y-4">
            {/* Size Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-white/70">
                <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Size</span>
                <span>{Math.round(scale[0] * 100)}%</span>
              </div>
              <Slider 
                value={scale} 
                onValueChange={setScale} 
                min={0.1} 
                max={3} 
                step={0.05}
                className="cursor-pointer" 
              />
            </div>
            
            {/* Rotation Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-white/70">
                <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" /> Rotate</span>
                <span>{rotation[0]}°</span>
              </div>
              <Slider 
                value={rotation} 
                onValueChange={setRotation} 
                min={-180} 
                max={180} 
                step={1}
                className="cursor-pointer"
              />
            </div>
            
            {/* Opacity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-white/70">
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Blend</span>
                <span>{Math.round(opacity[0] * 100)}%</span>
              </div>
              <Slider 
                value={opacity} 
                onValueChange={setOpacity} 
                min={0.3} 
                max={1} 
                step={0.05}
                className="cursor-pointer"
              />
            </div>

            {/* Symmetric toggle for earrings */}
            {jewelryType === 'earrings' && mode === "jewelry" && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-white/70">Mirror for pair</span>
                <button
                  onClick={() => setIsSymmetric(!isSymmetric)}
                  className={`w-10 h-6 rounded-full transition-colors ${isSymmetric ? 'bg-amber-500' : 'bg-white/20'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${isSymmetric ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            )}
            
            {/* Visual Effects Panel */}
            <AnimatePresence>
              {showEffects && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pt-3 mt-3 border-t border-white/10 space-y-3 overflow-hidden"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/70">
                      <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                      <span>{brightness[0]}%</span>
                    </div>
                    <Slider value={brightness} onValueChange={setBrightness} min={50} max={150} step={5} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/70">
                      <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                      <span>{contrast[0]}%</span>
                    </div>
                    <Slider value={contrast} onValueChange={setContrast} min={50} max={150} step={5} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
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
            className="rounded-full w-16 h-16 bg-amber-500 hover:bg-amber-600 text-white shadow-xl border-4 border-white/30 disabled:opacity-50"
            onClick={captureSnapshot}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Camera className="w-7 h-7" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}