import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star, Loader2, Shield } from "lucide-react";

// Detect platform for native payments
const getPlatform = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  return 'web';
};

export default function PlanCard({
  title,
  price,
  period,
  features,
  productId,
  isPopular,
  description,
  variant = "default",
  currentPlan = false
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const platform = getPlatform();

  const handleSubscribe = async () => {
    setIsProcessing(true);

    try {
      // iOS - Apple In-App Purchase
      if (platform === 'ios' && window.webkit?.messageHandlers?.iapHandler) {
        window.webkit.messageHandlers.iapHandler.postMessage({
          action: 'subscribe',
          productId: productId,
          price: price
        });
        return;
      }

      // Android - Google Play Billing
      if (platform === 'android' && window.AndroidBridge?.initiateSubscription) {
        window.AndroidBridge.initiateSubscription(JSON.stringify({
          productId: productId,
          price: price
        }));
        return;
      }

      // Web fallback
      alert('Pour vous abonner, veuillez utiliser notre application mobile iOS ou Android.');
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={`relative flex flex-col h-full ${
      isPopular ? 'border-amber-400 shadow-lg scale-105 z-10' : 'border-neutral-200'
    } ${currentPlan ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>

      {isPopular && (
        <div className="absolute top-0 right-0 -mt-3 mr-4">
          <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
            Recommandé
          </span>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
          variant === 'plus' ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-600'
        }`}>
          {variant === 'plus' ? <Crown className="w-6 h-6" /> : <Star className="w-6 h-6" />}
        </div>
        <CardTitle className="text-xl font-serif">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div className="text-center">
          <span className="text-4xl font-bold">{price}€</span>
          <span className="text-neutral-500 text-sm">/{period === 'monthly' ? 'mois' : 'an'}</span>
        </div>

        <ul className="space-y-3 text-sm">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                variant === 'plus' ? 'text-amber-600' : 'text-neutral-400'
              }`} />
              <span className="text-neutral-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-2 flex flex-col gap-3">
        {currentPlan ? (
          <Button disabled className="w-full bg-green-600 text-white opacity-100">
            Plan Actuel
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className={`w-full h-12 ${
              variant === 'plus'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Chargement...</>
            ) : (
              `S'abonner - ${price}€/${period === 'monthly' ? 'mois' : 'an'}`
            )}
          </Button>
        )}
        <p className="text-[10px] text-center text-neutral-400 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" />
          Paiement sécurisé via {platform === 'ios' ? 'Apple' : platform === 'android' ? 'Google Play' : 'App Store'}
        </p>
      </CardFooter>
    </Card>
  );
}
