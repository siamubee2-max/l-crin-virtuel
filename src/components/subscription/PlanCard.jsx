import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star } from "lucide-react";

export default function PlanCard({ 
  title, 
  price, 
  period, 
  features, 
  buyButtonId, 
  stripePublishableKey, 
  isPopular, 
  description,
  variant = "default",
  currentPlan = false
}) {
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
          <div className="w-full flex justify-center">
            <stripe-buy-button
              buy-button-id={buyButtonId}
              publishable-key={stripePublishableKey}
            />
          </div>
        )}
        <p className="text-[10px] text-center text-neutral-400">
          Paiement sécurisé via Stripe
        </p>
      </CardFooter>
    </Card>
  );
}