import React, { useState, useEffect } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Truck, CreditCard, ShoppingBag, ArrowLeft, Lock, Shield, AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import StripePaymentForm from '@/components/checkout/StripePaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const STEPS = {
  SHIPPING: 0,
  PAYMENT: 1,
  PROCESSING: 2,
  SUCCESS: 3
};

function CheckoutContent() {
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(STEPS.SHIPPING);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    paymentMethod: "card",
    cardNumber: "",
    expiry: "",
    cvc: ""
  });
  
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [paymentError, setPaymentError] = useState(null);

  // Simulate payment gateway processing
  const simulatePaymentGateway = async () => {
    setPaymentError(null);
    
    // Simulate card validation
    await new Promise(resolve => setTimeout(resolve, 500));
    setPaymentProgress(20);
    
    // Simulate connecting to payment gateway
    await new Promise(resolve => setTimeout(resolve, 800));
    setPaymentProgress(40);
    
    // Simulate authorization
    await new Promise(resolve => setTimeout(resolve, 600));
    setPaymentProgress(60);
    
    // Test card number validation (4242... is test success, 4000... is test failure)
    const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.startsWith('4000')) {
      throw new Error('Card declined. Please try a different card.');
    }
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 700));
    setPaymentProgress(80);
    
    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 500));
    setPaymentProgress(100);
    
    return { success: true, transactionId: `TXN-${Date.now()}` };
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // First, process payment
      const paymentResult = await simulatePaymentGateway();
      
      const user = await base44.auth.me().catch(() => ({ email: formData.email, full_name: formData.name }));
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.zip}, ${formData.country}`;
      const groupID = Math.random().toString(36).substr(2, 9);

      // Create order records
      const promises = items.map(item => {
        const price = (item.sale_price && item.sale_price < item.price) ? item.sale_price : item.price;
        return base44.entities.Order.create({
          item_id: item.id,
          quantity: item.quantity,
          total_price: price * item.quantity,
          status: "processing",
          shipping_address: fullAddress,
          customer_email: user.email || formData.email,
          customer_name: user.full_name || formData.name,
          tracking_number: `ORD-${groupID}-${paymentResult.transactionId}`
        });
      });

      return Promise.all(promises);
    },
    onSuccess: () => {
      clearCart();
      setStep(STEPS.SUCCESS);
    },
    onError: (error) => {
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setStep(STEPS.PAYMENT);
      setPaymentProgress(0);
    }
  });

  const handleNext = () => {
    if (step === STEPS.SHIPPING) {
      if (!formData.name || !formData.email || !formData.address || !formData.city) return;
      setStep(STEPS.PAYMENT);
    } else if (step === STEPS.PAYMENT) {
      if (formData.paymentMethod === 'card' && (!formData.cardNumber || !formData.expiry || !formData.cvc)) {
        setPaymentError('Please fill in all card details');
        return;
      }
      setStep(STEPS.PROCESSING);
      setPaymentProgress(0);
      createOrderMutation.mutate();
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };
  
  // Format expiry date
  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
  };

  if (items.length === 0 && step !== STEPS.SUCCESS && step !== STEPS.PROCESSING) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-neutral-200" />
        <h2 className="text-xl font-medium">Your cart is empty</h2>
        <Button onClick={() => navigate(createPageUrl('JewelryBox'))}>
          Browse Jewelry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Form Steps */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="pl-0 hover:bg-transparent">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-3xl font-serif">Checkout</h1>
          </div>

          {step === STEPS.SUCCESS ? (
             <Card className="border-green-100 bg-green-50/50">
               <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                   <CheckCircle2 className="w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-serif text-green-900">Order Placed Successfully!</h2>
                 <p className="text-green-800 max-w-md">
                   Thank you for your purchase. We have sent a confirmation email to {formData.email}.
                 </p>
                 <div className="flex gap-4 pt-4">
                    <Button onClick={() => navigate(createPageUrl('Orders'))} variant="outline" className="bg-white">
                      View Order
                    </Button>
                    <Button onClick={() => navigate(createPageUrl('Gallery'))} className="bg-green-700 hover:bg-green-800 text-white">
                      Continue Shopping
                    </Button>
                 </div>
               </CardContent>
             </Card>
          ) : (
            <div className="space-y-6">
              {/* Step Indicators */}
              <div className="flex items-center gap-4 text-sm font-medium text-neutral-500 mb-8">
                <div className={`flex items-center gap-2 ${step >= STEPS.SHIPPING ? "text-neutral-900" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= STEPS.SHIPPING ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                    {step > STEPS.SHIPPING ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                  </div>
                  Shipping
                </div>
                <div className={`w-12 h-px ${step > STEPS.SHIPPING ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                <div className={`flex items-center gap-2 ${step >= STEPS.PAYMENT ? "text-neutral-900" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= STEPS.PAYMENT ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                    {step > STEPS.PAYMENT ? <CheckCircle2 className="w-4 h-4" /> : "2"}
                  </div>
                  Payment
                </div>
              </div>

              {step === STEPS.SHIPPING && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
                      </div>
                      <div className="space-y-2">
                         <Label>Email</Label>
                         <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@example.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Fashion St" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       <div className="space-y-2">
                         <Label>City</Label>
                         <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="New York" />
                       </div>
                       <div className="space-y-2">
                         <Label>Zip Code</Label>
                         <Input value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} placeholder="10001" />
                       </div>
                       <div className="space-y-2 col-span-2 md:col-span-1">
                         <Label>Country</Label>
                         <Input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="United States" />
                       </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === STEPS.PAYMENT && (
                <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     {paymentError && (
                       <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                         <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                         <div>
                           <p className="font-medium text-red-800">Payment Failed</p>
                           <p className="text-sm text-red-600">{paymentError}</p>
                         </div>
                       </div>
                     )}
                     
                     <RadioGroup value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod: v})}>
                        <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-neutral-50 ${formData.paymentMethod === 'card' ? 'border-neutral-900 bg-neutral-50' : ''}`}>
                           <RadioGroupItem value="card" id="card" />
                           <Label htmlFor="card" className="flex-1 cursor-pointer">Credit / Debit Card</Label>
                           <div className="flex gap-1">
                             <div className="w-8 h-5 bg-blue-600 rounded text-white text-[8px] flex items-center justify-center font-bold">VISA</div>
                             <div className="w-8 h-5 bg-red-500 rounded text-white text-[8px] flex items-center justify-center font-bold">MC</div>
                           </div>
                        </div>
                        <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-neutral-50 ${formData.paymentMethod === 'paypal' ? 'border-neutral-900 bg-neutral-50' : ''}`}>
                           <RadioGroupItem value="paypal" id="paypal" />
                           <Label htmlFor="paypal" className="flex-1 cursor-pointer">PayPal</Label>
                           <div className="w-16 h-5 bg-blue-700 rounded text-white text-[8px] flex items-center justify-center font-bold">PayPal</div>
                        </div>
                     </RadioGroup>

                     <AnimatePresence>
                       {formData.paymentMethod === 'card' && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="space-y-4 pt-2 overflow-hidden"
                         >
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                              <p className="font-medium">🧪 Test Mode</p>
                              <p className="text-xs mt-1">Use card <code className="bg-amber-100 px-1 rounded">4242 4242 4242 4242</code> for success</p>
                              <p className="text-xs">Use card <code className="bg-amber-100 px-1 rounded">4000 0000 0000 0000</code> to test failure</p>
                            </div>
                            
                            <div className="space-y-2">
                               <Label>Card Number</Label>
                               <div className="relative">
                                 <Input 
                                   value={formData.cardNumber}
                                   onChange={e => setFormData({...formData, cardNumber: formatCardNumber(e.target.value)})}
                                   placeholder="0000 0000 0000 0000" 
                                   className="pr-10"
                                 />
                                 <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label>Expiry Date</Label>
                                  <Input 
                                    value={formData.expiry}
                                    onChange={e => setFormData({...formData, expiry: formatExpiry(e.target.value)})}
                                    placeholder="MM/YY" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <Label>CVC</Label>
                                  <Input 
                                    value={formData.cvc}
                                    onChange={e => setFormData({...formData, cvc: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                                    placeholder="123" 
                                    type="password"
                                  />
                               </div>
                            </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                     
                     <div className="flex items-center gap-2 text-xs text-neutral-500 pt-2">
                       <Shield className="w-4 h-4" />
                       Your payment info is encrypted and secure
                     </div>
                  </CardContent>
                </Card>
              )}
              
              {step === STEPS.PROCESSING && (
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium mb-2">Processing Payment</h3>
                        <p className="text-neutral-500 text-sm">Please wait while we securely process your payment...</p>
                      </div>
                      <div className="max-w-xs mx-auto space-y-2">
                        <Progress value={paymentProgress} className="h-2" />
                        <p className="text-xs text-neutral-400">
                          {paymentProgress < 30 && "Validating card details..."}
                          {paymentProgress >= 30 && paymentProgress < 60 && "Connecting to payment gateway..."}
                          {paymentProgress >= 60 && paymentProgress < 90 && "Authorizing transaction..."}
                          {paymentProgress >= 90 && "Finalizing order..."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step !== STEPS.PROCESSING && (
                <div className="flex justify-between pt-4">
                  {step > STEPS.SHIPPING && step < STEPS.PROCESSING ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
                  ) : (
                     <div />
                  )}
                  <Button 
                     onClick={handleNext} 
                     className="bg-neutral-900 text-white min-w-[180px] h-12"
                     disabled={createOrderMutation.isPending}
                  >
                     {step === STEPS.PAYMENT ? (
                       <><Lock className="w-4 h-4 mr-2" /> Pay ${cartTotal.toFixed(2)}</>
                     ) : (
                       "Continue to Payment"
                     )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        {step !== STEPS.SUCCESS && (
          <div className="w-full md:w-80 lg:w-96">
            <Card className="bg-neutral-50 border-neutral-200 sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                   {items.map(item => {
                     const price = (item.sale_price && item.sale_price < item.price) ? item.sale_price : item.price;
                     return (
                       <div key={item.id} className="flex gap-3 text-sm">
                          <div className="w-12 h-12 bg-white rounded-md overflow-hidden flex-shrink-0 border">
                             <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                             <p className="font-medium">{item.name}</p>
                             <p className="text-neutral-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">${(price * item.quantity).toFixed(2)}</p>
                       </div>
                     );
                   })}
                 </div>
                 
                 <div className="border-t border-neutral-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                       <span className="text-neutral-500">Subtotal</span>
                       <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-neutral-500">Shipping</span>
                       <span>Free</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-200">
                       <span>Total</span>
                       <span>${cartTotal.toFixed(2)}</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}