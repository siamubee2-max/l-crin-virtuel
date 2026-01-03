import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';

const STRIPE_PUBLISHABLE_KEY = "pk_test_51SlUIJIlDuDg7U168pXJyygXJX5L3Bv9iTwQSqD8sLt3tD4yRwsnd5KLDrruCHd3ugFvOMfZApzfjSbgMmCBYkbM00HfizuI25";
const STRIPE_BUY_BUTTON_MONTHLY = "buy_btn_1SlV73IlDuDg7U16mY7oX1lL";

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const price = billingCycle === 'monthly' ? 10.99 : 99.00;
  const savings = billingCycle === 'yearly' ? Math.round((10.99 * 12 - 99.00) / (10.99 * 12) * 100) : 0;

  // Load Stripe Buy Button script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const features = [
    "Garde-robe illimitée (vs 2 articles gratuits)",
    "Styliste IA illimité dans l'Atelier et le Dressing",
    "Essayages virtuels illimités",
    "Mode AR en direct (webcam)",
    "Accès aux collections et marques exclusives",
    "Export HD de vos créations"
  ];

  // Fetch current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Fetch user's subscription
  const { data: subscriptions, isLoading: subLoading } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: () => base44.entities.UserSubscription.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const currentSubscription = subscriptions?.find(s => s.status === 'active' || s.status === 'past_due');

  const isLoading = userLoading || subLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  // Show subscription status if user has active subscription
  if (currentSubscription) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif mb-4">Mon Abonnement</h1>
          <p className="text-neutral-500">Gérez votre abonnement Premium</p>
        </div>

        <SubscriptionStatus 
          subscription={currentSubscription}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif mb-4">Abonnement Premium</h1>
        <p className="text-neutral-500">Débloquez toutes les fonctionnalités de L'Écrin Virtuel</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-neutral-100 p-1 rounded-full inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'monthly' 
                ? 'bg-white shadow text-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'yearly' 
                ? 'bg-white shadow text-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Annuel
            {savings > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                -{savings}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Pricing Card */}
      <motion.div
        key={billingCycle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-2 border-amber-200 bg-gradient-to-b from-amber-50/50 to-white">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-serif">Premium</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <span className="text-5xl font-bold">{price.toFixed(2)}€</span>
              <span className="text-neutral-500 ml-2">
                /{billingCycle === 'monthly' ? 'mois' : 'an'}
              </span>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-green-600 mt-2">
                  Soit {(99.00 / 12).toFixed(2)}€/mois
                </p>
              )}
            </div>

            <ul className="space-y-3">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-amber-700" />
                  </div>
                  <span className="text-neutral-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Stripe Buy Button */}
            <div className="flex justify-center pt-2">
              <stripe-buy-button
                buy-button-id={STRIPE_BUY_BUTTON_MONTHLY}
                publishable-key={STRIPE_PUBLISHABLE_KEY}
              />
            </div>

            <p className="text-xs text-center text-neutral-400">
              Annulation possible à tout moment. Paiement sécurisé par Stripe.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}