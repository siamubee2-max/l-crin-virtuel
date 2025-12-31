import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SubscriptionStatus({ subscription, onCancel, onReactivate, isLoading }) {
  if (!subscription) return null;

  const statusConfig = {
    active: { label: 'Actif', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
    past_due: { label: 'Paiement en retard', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    expired: { label: 'Expiré', color: 'bg-neutral-100 text-neutral-700', icon: XCircle },
  };

  const status = statusConfig[subscription.status] || statusConfig.active;
  const StatusIcon = status.icon;

  const planLabel = subscription.plan === 'yearly' ? 'Annuel' : 'Mensuel';
  const nextBillingDate = subscription.current_period_end 
    ? format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })
    : '-';

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-b from-green-50/50 to-white">
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-serif text-xl">Premium {planLabel}</h3>
              <Badge className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-neutral-50 p-3 rounded-lg">
            <p className="text-neutral-500">Prochain paiement</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {nextBillingDate}
            </p>
          </div>
          <div className="bg-neutral-50 p-3 rounded-lg">
            <p className="text-neutral-500">Montant</p>
            <p className="font-medium">
              {subscription.plan === 'yearly' ? '99.90€/an' : '9.99€/mois'}
            </p>
          </div>
        </div>

        {subscription.cancel_at_period_end && subscription.status === 'active' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <p className="text-amber-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Votre abonnement sera annulé le {nextBillingDate}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <Button 
              variant="outline" 
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler l'abonnement
            </Button>
          )}
          
          {subscription.cancel_at_period_end && subscription.status === 'active' && (
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onReactivate}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réactiver
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}