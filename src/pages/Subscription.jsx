import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CreditCard, ShieldCheck, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import PlanCard from '@/components/subscription/PlanCard';
import PurchaseHistory from '@/components/subscription/PurchaseHistory';
import SEO from '@/components/common/SEO';

// Product IDs for iOS/Android In-App Purchases
const PLANS = {
  PLUS: {
    MONTHLY: "premium_plus_monthly",
    YEARLY: "premium_plus_yearly"
  }
};

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState('monthly');

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

          {/* Plan Selection - Temporarily Disabled */}
          <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
             <ShieldCheck className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-neutral-900">Abonnements indisponibles</h3>
             <p className="text-neutral-500 mt-2">Les nouvelles souscriptions sont temporairement suspendues.</p>
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