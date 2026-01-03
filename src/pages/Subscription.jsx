import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Crown, Loader2, CreditCard, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import SubscriptionPaymentForm from '@/components/subscription/SubscriptionPaymentForm';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function SubscriptionContent() {
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const price = billingCycle === 'monthly' ? 10.99 : 99.00;
  const savings = billingCycle === 'yearly' ? Math.round((10.99 * 12 - 99.00) / (10.99 * 12) * 100) : 0;

  const features = [
    "Essayages virtuels illimités",
    "Mode AR en direct (webcam)",
    "Styliste IA personnalisé",
    "Galerie et collections illimitées",
    "Export HD de vos créations",
    "Accès prioritaire aux nouvelles fonctionnalités"
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

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (paymentData) => {
      // In a real app, you would call a backend function to create the Stripe subscription
      // For now, we simulate by creating a local record
      const now = new Date();
      const periodEnd = new Date();
      if (paymentData.plan === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await base44.entities.UserSubscription.create({
        plan: paymentData.plan,
        status: 'active',
        stripe_customer_id: `cus_demo_${Date.now()}`,
        stripe_subscription_id: `sub_demo_${Date.now()}`,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      setShowPaymentForm(false);
      setPaymentError(null);
    },
    onError: (error) => {
      setPaymentError(error.message || 'Une erreur est survenue');
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!currentSubscription) return;
      await base44.entities.UserSubscription.update(currentSubscription.id, {
        cancel_at_period_end: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
    }
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!currentSubscription) return;
      await base44.entities.UserSubscription.update(currentSubscription.id, {
        cancel_at_period_end: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
    }
  });

  const handlePaymentSuccess = (paymentData) => {
    createSubscriptionMutation.mutate({
      ...paymentData,
      plan: billingCycle
    });
  };

  const handlePaymentError = (errorMessage) => {
    setPaymentError(errorMessage);
  };

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
          onCancel={() => cancelSubscriptionMutation.mutate()}
          onReactivate={() => reactivateSubscriptionMutation.mutate()}
          isLoading={cancelSubscriptionMutation.isPending || reactivateSubscriptionMutation.isPending}
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
            onClick={() => { setBillingCycle('monthly'); setShowPaymentForm(false); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'monthly' 
                ? 'bg-white shadow text-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => { setBillingCycle('yearly'); setShowPaymentForm(false); }}
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

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            )}

            {!user ? (
              <div className="text-center py-4">
                <p className="text-neutral-500 mb-4">Connectez-vous pour vous abonner</p>
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-neutral-900 hover:bg-neutral-800"
                >
                  Se connecter
                </Button>
              </div>
            ) : showPaymentForm ? (
              <div className="space-y-4">
                <SubscriptionPaymentForm 
                  plan={billingCycle}
                  price={price}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  disabled={createSubscriptionMutation.isPending}
                />
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Retour
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowPaymentForm(true)}
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                S'abonner maintenant
              </Button>
            )}

            <p className="text-xs text-center text-neutral-400">
              Annulation possible à tout moment. Paiement sécurisé par Stripe.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function Subscription() {
  if (!stripePromise) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <CreditCard className="w-16 h-16 mx-auto text-neutral-200 mb-4" />
        <h2 className="text-xl font-medium mb-2">Paiement non configuré</h2>
        <p className="text-neutral-500">
          La clé Stripe n'est pas configurée. Veuillez contacter l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <SubscriptionContent />
    </Elements>
  );
}