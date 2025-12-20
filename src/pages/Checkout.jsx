import React, { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Truck, CreditCard, ShoppingBag, ArrowLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageProvider';

const STEPS = {
  SHIPPING: 0,
  PAYMENT: 1,
  SUCCESS: 2
};

export default function Checkout() {
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

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me().catch(() => ({ email: formData.email, full_name: formData.name }));
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.zip}, ${formData.country}`;
      const groupID = Math.random().toString(36).substr(2, 9); // Simple grouping ID

      // Create an order record for each item in the cart
      const promises = items.map(item => {
        const price = (item.sale_price && item.sale_price < item.price) ? item.sale_price : item.price;
        return base44.entities.Order.create({
          item_id: item.id,
          quantity: item.quantity,
          total_price: price * item.quantity,
          status: "pending",
          shipping_address: fullAddress,
          customer_email: user.email || formData.email,
          customer_name: user.full_name || formData.name,
          tracking_number: `GRP-${groupID}` // Temporary tracking/group ID
        });
      });

      return Promise.all(promises);
    },
    onSuccess: () => {
      clearCart();
      setStep(STEPS.SUCCESS);
    }
  });

  const handleNext = () => {
    if (step === STEPS.SHIPPING) {
      if (!formData.name || !formData.address || !formData.city) return; // Basic validation
      setStep(STEPS.PAYMENT);
    } else if (step === STEPS.PAYMENT) {
      createOrderMutation.mutate();
    }
  };

  if (items.length === 0 && step !== STEPS.SUCCESS) {
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
                    <Button onClick={() => navigate(createPageUrl('Shop'))} className="bg-green-700 hover:bg-green-800 text-white">
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
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= STEPS.SHIPPING ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>1</div>
                  Shipping
                </div>
                <div className="w-12 h-px bg-neutral-200" />
                <div className={`flex items-center gap-2 ${step >= STEPS.PAYMENT ? "text-neutral-900" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= STEPS.PAYMENT ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>2</div>
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
                     <RadioGroup value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod: v})}>
                        <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-neutral-50">
                           <RadioGroupItem value="card" id="card" />
                           <Label htmlFor="card" className="flex-1 cursor-pointer">Credit Card</Label>
                           <CreditCard className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-neutral-50">
                           <RadioGroupItem value="paypal" id="paypal" />
                           <Label htmlFor="paypal" className="flex-1 cursor-pointer">PayPal</Label>
                        </div>
                     </RadioGroup>

                     {formData.paymentMethod === 'card' && (
                       <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                          <div className="space-y-2">
                             <Label>Card Number</Label>
                             <Input placeholder="0000 0000 0000 0000" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Expiry</Label>
                                <Input placeholder="MM/YY" />
                             </div>
                             <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input placeholder="123" />
                             </div>
                          </div>
                       </div>
                     )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between pt-4">
                {step > STEPS.SHIPPING ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
                ) : (
                   <div />
                )}
                <Button 
                   onClick={handleNext} 
                   className="bg-neutral-900 text-white min-w-[150px]"
                   disabled={createOrderMutation.isPending}
                >
                   {createOrderMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                   {step === STEPS.PAYMENT ? `Pay $${cartTotal.toFixed(2)}` : "Next Step"}
                </Button>
              </div>
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