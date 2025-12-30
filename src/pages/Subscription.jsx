import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const price = billingCycle === 'monthly' ? 9.99 : 99.90;
  const savings = billingCycle === 'yearly' ? Math.round((9.99 * 12 - 99.90) / (9.99 * 12) * 100) : 0;

  const features = [
    "Essayages virtuels illimités",
    "Mode AR en direct (webcam)",
    "Styliste IA personnalisé",
    "Galerie et collections illimitées",
    "Export HD de vos créations",
    "Accès prioritaire aux nouvelles fonctionnalités"
  ];

  const handleSubscribe = () => {
    // TODO: Intégrer Stripe Checkout pour les abonnements
    alert('Redirection vers le paiement Stripe...');
  };

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
                  Soit {(99.90 / 12).toFixed(2)}€/mois
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

            <Button 
              onClick={handleSubscribe}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              S'abonner maintenant
            </Button>

            <p className="text-xs text-center text-neutral-400">
              Annulation possible à tout moment. Paiement sécurisé par Stripe.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}