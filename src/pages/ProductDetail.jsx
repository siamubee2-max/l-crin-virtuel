import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Heart, Star, Sparkles, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReviewSection from '@/components/reviews/ProductReviewSection';
import ARLiveTryOn from '@/components/studio/ARLiveTryOn';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import { useLanguage } from '@/components/LanguageProvider';
import ShareButton from "@/components/common/ShareButton";
import SEO from '@/components/common/SEO';

export default function ProductDetail() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showARTryOn, setShowARTryOn] = useState(false);

  // Get product ID and type from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const productType = urlParams.get('type') || 'jewelry'; // 'jewelry' or 'clothing'

  // Fetch product based on type
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId, productType],
    queryFn: async () => {
      if (productType === 'clothing') {
        const items = await base44.entities.ClothingItem.filter({ id: productId });
        return items[0];
      } else {
        const items = await base44.entities.JewelryItem.filter({ id: productId });
        return items[0];
      }
    },
    enabled: !!productId
  });

  // Fetch reviews
  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => base44.entities.Review.filter({ jewelry_item_id: productId }),
    enabled: !!productId
  });

  // Wishlist
  const { data: wishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => base44.entities.WishlistItem.list()
  });

  const isWishlisted = wishlist?.some(w => w.jewelry_item_id === productId);

  const toggleWishlist = async () => {
    const existing = wishlist?.find(w => w.jewelry_item_id === productId);
    if (existing) {
      await base44.entities.WishlistItem.delete(existing.id);
    } else {
      await base44.entities.WishlistItem.create({ jewelry_item_id: productId });
    }
    queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
  };

  // Calculate average rating
  const avgRating = reviews?.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const isOnSale = product?.sale_price && product.sale_price < product.price;
  const displayPrice = isOnSale ? product.sale_price : product?.price;
  const discountPercent = isOnSale ? Math.round((1 - product.sale_price / product.price) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Product not found</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">Go Back</Button>
      </div>
    );
  }

  // AR Try-On Mode
  if (showARTryOn) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <ARLiveTryOn 
          jewelryImage={product.image_url}
          jewelryType={product.type}
          mode={productType === 'clothing' ? 'clothing' : 'jewelry'}
          onBack={() => setShowARTryOn(false)}
          onSaveToGallery={(url) => {
            setShowARTryOn(false);
            // Could navigate to gallery or show success message
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {product && (
        <SEO 
          title={product.name}
          description={product.description?.substring(0, 160) || `Découvrez ${product.name} chez L'Écrin Virtuel.`}
          image={product.image_url}
          type="product"
          keywords={[product.brand, product.type, product.material, product.gemstone_type].filter(Boolean)}
        />
      )}
      {/* Back Button */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          className="pl-0 hover:bg-transparent text-neutral-500"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.product?.back || "Back"}
        </Button>
        {product && (
          <ShareButton 
             text={`Check out ${product.name} on L'Écrin Virtuel!`} 
             url={window.location.href}
             imageUrl={product.image_url}
          >
             {t.product?.share || "Partager"}
          </ShareButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image Gallery */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          {/* Sale Badge */}
          {isOnSale && (
            <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white text-sm px-3 py-1">
              -{discountPercent}% {t.product?.off || "OFF"}
            </Badge>
          )}

          <ProductImageGallery
            mainImage={product.image_url}
            additionalImages={product.additional_images || []}
            productName={product.name}
            onARTryOn={() => setShowARTryOn(true)}
          />

          {/* Studio IA Button */}
          <Button
            onClick={() => navigate(createPageUrl('Studio'))}
            variant="secondary"
            className="w-full mt-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900"
          >
            <Sparkles className="w-4 h-4 mr-2" /> {t.product?.tryInStudio || "Try in AI Studio"}
          </Button>
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Brand & Type */}
          <div className="flex items-center gap-2">
            {product.brand && (
              <Badge variant="outline" className="text-xs uppercase tracking-wider">
                {product.brand}
              </Badge>
            )}
            <Badge variant="secondary" className="capitalize text-xs">
              {product.type}
            </Badge>
          </div>

          {/* Name */}
          <h1 className="text-3xl lg:text-4xl font-serif text-neutral-900">
            {product.name}
          </h1>

          {/* Rating */}
          {avgRating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{avgRating}</span>
              <span className="text-sm text-neutral-500">({reviews?.length} {t.product?.reviews || "reviews"})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900">
              ${displayPrice?.toFixed(2) || '0.00'}
            </span>
            {isOnSale && (
              <span className="text-xl text-neutral-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-neutral-600 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Material Options */}
          {product.material_options?.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700">{t.product?.materialOptions || "Material"}</label>
              <div className="flex flex-wrap gap-2">
                {product.material_options.map(material => (
                  <button
                    key={material}
                    onClick={() => setSelectedMaterial(material)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      (selectedMaterial || product.material_options[0]) === material
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white hover:border-neutral-400'
                    }`}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-100">
            {product.metal_type && (
              <div>
                <p className="text-xs text-neutral-500 uppercase">{t.product?.metal || "Metal"}</p>
                <p className="font-medium">{product.metal_type}</p>
              </div>
            )}
            {product.gemstone_type && (
              <div>
                <p className="text-xs text-neutral-500 uppercase">{t.product?.gemstone || "Gemstone"}</p>
                <p className="font-medium">{product.gemstone_type}</p>
              </div>
            )}
            {product.collection_name && (
              <div>
                <p className="text-xs text-neutral-500 uppercase">{t.product?.collection || "Collection"}</p>
                <p className="font-medium">{product.collection_name}</p>
              </div>
            )}
            {(product.material || product.color) && (
              <div>
                <p className="text-xs text-neutral-500 uppercase">{product.material ? (t.product?.material || "Material") : (t.product?.color || "Color")}</p>
                <p className="font-medium">{product.material || product.color}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={toggleWishlist}
              className={`flex-1 h-12 text-base transition-all ${
                isWishlisted 
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
              variant={isWishlisted ? "outline" : "default"}
            >
              <Heart className={`w-5 h-5 mr-2 ${isWishlisted ? 'fill-red-500' : ''}`} />
              {isWishlisted ? (t.product?.inWishlist || 'Dans mes favoris') : (t.product?.addToWishlist || 'Ajouter aux favoris')}
            </Button>
          </div>
          


          {/* Affiliate Link */}
          {product.affiliate_link && (
            <a 
              href={product.affiliate_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full h-11">
                {t.product?.viewPartner || "View on Partner Store"}
              </Button>
            </a>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center text-center p-3 bg-neutral-50 rounded-xl">
              <Truck className="w-5 h-5 text-neutral-600 mb-1" />
              <span className="text-xs text-neutral-600">{t.product?.freeShipping || "Free Shipping"}</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-neutral-50 rounded-xl">
              <Shield className="w-5 h-5 text-neutral-600 mb-1" />
              <span className="text-xs text-neutral-600">{t.product?.securePayment || "Secure Payment"}</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-neutral-50 rounded-xl">
              <RotateCcw className="w-5 h-5 text-neutral-600 mb-1" />
              <span className="text-xs text-neutral-600">{t.product?.returns || "30-Day Returns"}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="bg-neutral-100 p-1">
            <TabsTrigger value="reviews">{t.product?.reviews || "Reviews"} ({reviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="details">{t.product?.details || "Details"}</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            <ReviewSection itemId={productId} reviews={reviews || []} />
          </TabsContent>

          <TabsContent value="details">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h3 className="font-medium text-lg">{t.product?.details || "Product Details"}</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">{t.product?.type || "Type"}</span>
                  <span className="capitalize">{product.type}</span>
                </div>
                {product.brand && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-neutral-500">{t.product?.brand || "Brand"}</span>
                    <span>{product.brand}</span>
                  </div>
                )}
                {product.metal_type && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-neutral-500">{t.product?.metal || "Metal Type"}</span>
                    <span>{product.metal_type}</span>
                  </div>
                )}
                {product.gemstone_type && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-neutral-500">{t.product?.gemstone || "Gemstone"}</span>
                    <span>{product.gemstone_type}</span>
                  </div>
                )}
                {product.collection_name && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-neutral-500">{t.product?.collection || "Collection"}</span>
                    <span>{product.collection_name}</span>
                  </div>
                )}
              </div>
              
              {product.tags?.length > 0 && (
                <div className="pt-4">
                  <p className="text-sm text-neutral-500 mb-2">{t.product?.tags || "Tags"}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}