import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CreditCard, Clock, ShieldCheck, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import PlanCard from '@/components/subscription/PlanCard';
import PurchaseHistory from '@/components/subscription/PurchaseHistory';
import SEO from '@/components/common/SEO';

const STRIPE_PUBLISHABLE_KEY = "pk_live_51SlUI7Ik6xDX8EoQKAVRNZq0m3IuuYum6XYdF22J9DAZugdU5FFMMhe3OB7bOaXcM2xkp0MPxe66dtNiRxqMHPx200UA20lrl9";

// Updated Buy Button IDs
const PLANS = {

  PLUS: {
    MONTHLY: "buy_btn_1SlrETIk6xDX8EoQVVkoAlEm",
    YEARLY: "buy_btn_1SlrPQIk6xDX8EoQ5lm2peN0"
  }
};

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  // Load Stripe Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if(document.body.contains(script)) {
         document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch user & subscription
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: subscriptions, isLoading: subLoading } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: () => base44.entities.UserSubscription.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const currentSubscription = subscriptions?.find(s => s.status === 'active' || s.status === 'past_due');
  // Determine current plan level if possible (rudimentary check, ideally stored in subscription metadata or plan ID)
  // For now, we assume user knows their plan or we just show "Current" on the card if IDs match (hard to check IDs from stripe subscription object without more data)
  // We'll just display the status at the top.

  if (userLoading || subLoading) {
    return <div className="flex justify-center items-center min-h-[500px]"><Loader2 className="w-8 h-8 animate-spin text-neutral-300" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <SEO title="Mon Compte & Abonnement" />
      
      <div className="mb-10">
        <h1 className="text-3xl font-serif text-neutral-900 mb-2">Mon Compte Client</h1>
        <p className="text-neutral-500">Gérez votre abonnement, vos factures et vos commandes.</p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-8">
        <TabsList className="bg-neutral-100 p-1 rounded-xl w-full md:w-auto flex md:inline-flex">
          <TabsTrigger value="subscription" className="flex-1 md:w-40 rounded-lg"><CreditCard className="w-4 h-4 mr-2" /> Abonnement</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 md:w-40 rounded-lg"><History className="w-4 h-4 mr-2" /> Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-8">
          
          {/* Current Status Section */}
          {currentSubscription && (
             <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm mb-8">
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-green-600" /> Statut Actuel
                </h2>
                <SubscriptionStatus subscription={currentSubscription} />
             </div>
          )}

          {/* Plan Selection */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-4">Nos Offres Premium</h2>
              {/* Billing Toggle */}
              <div className="bg-neutral-100 p-1 rounded-full inline-flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === 'monthly' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === 'yearly' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Annuel <span className="text-green-600 text-xs ml-1 font-bold">-20%</span>
                </button>
              </div>
            </div>

            <div className="flex justify-center max-w-md mx-auto">

              {/* PLUS PLAN */}
              <PlanCard 
                title="Premium Plus"
                description="L'expérience ultime sans aucune limite."
                price={billingCycle === 'monthly' ? 12.99 : 99.00}
                period={billingCycle}
                features={[
                  "Tout ce qu'il y a dans Essentiel",
                  "Garde-robe ILLIMITÉE",
                  "Styliste IA Personnel (Accès complet)",
                  "Collections Exclusives VIP",
                  "Support Prioritaire"
                ]}
                buyButtonId={billingCycle === 'monthly' ? PLANS.PLUS.MONTHLY : PLANS.PLUS.YEARLY}
                stripePublishableKey={STRIPE_PUBLISHABLE_KEY}
                isPopular={true}
                variant="plus"
              />

            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
           <div className="space-y-6">
              <div>
                 <h2 className="text-xl font-serif mb-2">Historique des Achats</h2>
                 <p className="text-neutral-500 text-sm">Retrouvez ici le détail de vos commandes de bijoux et vêtements.</p>
              </div>
              <PurchaseHistory userEmail={user?.email} />
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}