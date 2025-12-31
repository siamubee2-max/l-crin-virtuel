import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CreditCard } from "lucide-react";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  }
};

export default function SubscriptionPaymentForm({ plan, price, onSuccess, onError, disabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    
    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (pmError) {
      setError(pmError.message);
      setIsProcessing(false);
      onError?.(pmError.message);
      return;
    }

    // Pass payment method to parent for subscription creation
    onSuccess({
      paymentMethodId: paymentMethod.id,
      plan,
      price
    });
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-medium">Informations de paiement</span>
        </div>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        <p className="font-medium">🧪 Mode Test</p>
        <p className="text-xs mt-1">Utilisez <code className="bg-amber-100 px-1 rounded">4242 4242 4242 4242</code></p>
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing || disabled}
        className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Lock className="w-4 h-4 mr-2" />
        )}
        {isProcessing ? 'Traitement...' : `Payer ${price.toFixed(2)}€`}
      </Button>

      <p className="text-xs text-center text-neutral-400 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> Paiement sécurisé par Stripe
      </p>
    </form>
  );
}