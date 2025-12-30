import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, Camera, Maximize2, RotateCcw } from 'lucide-react';

export default function ProductImageGallery({ 
  mainImage, 
  additionalImages = [], 
  productName,
  onARTryOn 
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Combine main image with additional images
  const allImages = [mainImage, ...additionalImages].filter(Boolean);
  const currentImage = allImages[selectedIndex] || mainImage;

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    const newLevel = zoomLevel - 0.5;
    if (newLevel <= 1) {
      setZoomLevel(1);
      setIsZoomed(false);
    } else {
      setZoomLevel(newLevel);
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setZoomPosition({ x: 50, y: 50 });
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev + 1) % allImages.length);
    resetZoom();
  };

  const goToPrev = () => {
    setSelectedIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    resetZoom();
  };

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative group">
        <div 
          className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden cursor-crosshair relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => !isFullscreen && resetZoom()}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <motion.img 
            src={currentImage} 
            alt={productName}
            className="w-full h-full object-cover transition-transform duration-200"
            style={{
              transform: isZoomed ? `scale(${zoomLevel})` : 'scale(1)',
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
            }}
          />

          {/* Zoom indicator */}
          {isZoomed && (
            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {Math.round(zoomLevel * 100)}%
            </div>
          )}
        </div>

        {/* Navigation Arrows (if multiple images) */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Top Controls */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            disabled={zoomLevel <= 1}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Bottom Controls - AR Try-On */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button
            onClick={(e) => { e.stopPropagation(); onARTryOn?.(); }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            <Camera className="w-4 h-4 mr-2" /> Essai AR Live
          </Button>
        </div>

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedIndex(idx); resetZoom(); }}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedIndex === idx 
                  ? 'border-amber-500 ring-2 ring-amber-200' 
                  : 'border-transparent hover:border-neutral-300'
              }`}
            >
              <img 
                src={img} 
                alt={`${productName} - vue ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {selectedIndex === idx && (
                <div className="absolute inset-0 bg-amber-500/10" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                onClick={handleZoomIn}
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                onClick={resetZoom}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <span className="flex items-center text-white/80 text-sm ml-2">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            {/* Main Image */}
            <div 
              className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair"
              onMouseMove={handleMouseMove}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <motion.img 
                src={currentImage} 
                alt={productName}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: isZoomed ? `scale(${zoomLevel})` : 'scale(1)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                }}
              />
            </div>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Bottom Thumbnails */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedIndex(idx); resetZoom(); }}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedIndex === idx 
                        ? 'border-amber-500' 
                        : 'border-transparent hover:border-white/50'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Vue ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* AR Button in Fullscreen */}
            <Button
              onClick={() => { setIsFullscreen(false); onARTryOn?.(); }}
              className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Camera className="w-4 h-4 mr-2" /> Essai AR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}