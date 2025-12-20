import React from 'react';
import { useCart } from './CartProvider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SalesBadge from '@/components/jewelry/SalesBadge';

export default function CartSheet() {
  const { items, removeFromCart, updateQuantity, cartTotal, isOpen, setIsOpen } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate(createPageUrl('Checkout'));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Shopping Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <ShoppingBag className="w-16 h-16 text-neutral-200" />
            <p className="text-neutral-500">Your cart is empty</p>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 my-4">
              <div className="space-y-4">
                {items.map((item) => {
                  const price = (item.sale_price && item.sale_price < item.price) ? item.sale_price : item.price;
                  return (
                    <div key={item.id} className="flex gap-4 py-4 border-b border-neutral-100 last:border-0">
                      <div className="h-20 w-20 rounded-lg bg-neutral-50 overflow-hidden relative flex-shrink-0">
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-neutral-500">{item.brand || item.type}</p>
                          </div>
                          <p className="font-medium text-sm">${price * item.quantity}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2 border rounded-md p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-neutral-100 rounded">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-neutral-100 rounded">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full bg-neutral-900 text-white h-12" onClick={handleCheckout}>
                Checkout <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}