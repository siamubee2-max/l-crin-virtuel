import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield } from "lucide-react";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

export default function StripePaymentForm({ amount, onSuccess, onError, disabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setCardError(error.message);
        onError?.(error.message);
        setProcessing(false);
        return;
      }

      // In a real app, you would send paymentMethod.id to your backend
      // to create a PaymentIntent and confirm the payment
      // For now, we simulate success
      onSuccess?.({
        paymentMethodId: paymentMethod.id,
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand
      });
      
    } catch (err) {
      setCardError(err.message || 'Payment failed');
      onError?.(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-white">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      
      {cardError && (
        <p className="text-sm text-red-600">{cardError}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Shield className="w-4 h-4" />
        Paiement sécurisé via Stripe
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || processing || disabled}
        className="w-full bg-neutral-900 text-white h-12"
      >
        {processing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
        ) : (
          <><Lock className="w-4 h-4 mr-2" /> Payer ${amount?.toFixed(2)}</>
        )}
      </Button>
    </form>
  );
}