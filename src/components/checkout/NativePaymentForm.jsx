import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield, Smartphone } from "lucide-react";
import { base44 } from '@/api/base44Client';

// Detect platform for native payments
const getPlatform = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  return 'web';
};

export default function NativePaymentForm({ amount, onSuccess, onError, disabled, productId }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const platform = getPlatform();

  const recordPaymentToSupabase = async (paymentData) => {
    try {
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        // Payment recording logic commented out as Supabase integration is not available
        console.log('Payment recorded:', {
          userId: user.id || user.email,
          productId: productId,
          amount: amount,
          platform: paymentData.platform,
          transactionId: paymentData.transactionId
        });
      }
    } catch (err) {
      console.error('Error recording payment:', err);
    }
  };

  const handleNativePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // iOS - Apple Pay / In-App Purchase
      if (platform === 'ios' && window.webkit?.messageHandlers?.iapHandler) {
        window.webkit.messageHandlers.iapHandler.postMessage({
          action: 'purchase',
          productId: productId || 'default_product',
          amount: amount
        });

        // Listen for response from native
        window.handleIAPResponse = async (response) => {
          if (response.success) {
            const paymentData = {
              transactionId: response.transactionId,
              platform: 'ios',
              receipt: response.receipt
            };
            await recordPaymentToSupabase(paymentData);
            onSuccess?.(paymentData);
          } else {
            setError(response.error || 'Paiement annulé');
            onError?.(response.error);
          }
          setProcessing(false);
        };
        return;
      }

      // Android - Google Pay / In-App Billing
      if (platform === 'android' && window.AndroidBridge?.initiatePayment) {
        window.AndroidBridge.initiatePayment(
          JSON.stringify({
            productId: productId || 'default_product',
            amount: amount
          })
        );

        // Listen for response from native
        window.handleAndroidPaymentResponse = async (responseJson) => {
          const response = JSON.parse(responseJson);
          if (response.success) {
            const paymentData = {
              transactionId: response.purchaseToken,
              platform: 'android',
              receipt: response.receipt
            };
            await recordPaymentToSupabase(paymentData);
            onSuccess?.(paymentData);
          } else {
            setError(response.error || 'Paiement annulé');
            onError?.(response.error);
          }
          setProcessing(false);
        };
        return;
      }

      // Web fallback - show message to use mobile app
      setError('Pour effectuer un achat, veuillez utiliser notre application mobile iOS ou Android.');
      setProcessing(false);

    } catch (err) {
      setError(err.message || 'Erreur de paiement');
      onError?.(err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-gradient-to-r from-neutral-50 to-neutral-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm">Paiement sécurisé</p>
            <p className="text-xs text-neutral-500">
              {platform === 'ios' ? 'Apple Pay / In-App Purchase' :
               platform === 'android' ? 'Google Pay / Play Store' :
               'Application mobile requise'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Shield className="w-4 h-4" />
        Paiement sécurisé via {platform === 'ios' ? 'Apple' : platform === 'android' ? 'Google' : 'votre store'}
      </div>

      <Button
        onClick={handleNativePayment}
        disabled={processing || disabled}
        className="w-full bg-neutral-900 text-white h-12"
      >
        {processing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
        ) : (
          <><Lock className="w-4 h-4 mr-2" /> Payer {amount?.toFixed(2)}€</>
        )}
      </Button>
    </div>
  );
}