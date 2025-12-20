import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OrderList() {
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const allOrders = await base44.entities.Order.list('-created_date');
      return allOrders.filter(o => o.created_by === user.email);
    }
  });

  const { data: items } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list()
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'processing': return "bg-blue-100 text-blue-800";
      case 'shipped': return "bg-purple-100 text-purple-800";
      case 'delivered': return "bg-green-100 text-green-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getItemDetails = (itemId) => items?.find(i => i.id === itemId);

  if (ordersLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-neutral-300" /></div>;
  }

  return (
    <div className="space-y-6">
      {orders?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-neutral-200">
          <Package className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900">No orders yet</h3>
          <p className="text-neutral-500 mb-6">You haven't placed any orders yet.</p>
          <Link to={createPageUrl("Shop")}>
            <Button className="bg-neutral-900 text-white">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map(order => {
            const item = getItemDetails(order.item_id);
            return (
              <Card key={order.id} className="overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-neutral-50 border-b border-neutral-100 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider">Date</p>
                      <p className="text-sm font-medium">{format(new Date(order.created_date), "PPP")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider">Total</p>
                      <p className="text-sm font-medium">${order.total_price}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider">Order #</p>
                      <p className="text-sm font-medium text-neutral-600">{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="ml-auto">
                       <Badge variant="secondary" className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                         {getStatusIcon(order.status)}
                         <span className="capitalize">{order.status}</span>
                       </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-20 h-20 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 border">
                      {item ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-neutral-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                       <h3 className="font-medium text-lg">{item ? item.name : "Unknown Item"}</h3>
                       <p className="text-sm text-neutral-500">{item?.brand || "Brand"} • Qty: {order.quantity}</p>
                       {order.tracking_number && (
                         <div className="pt-2">
                            <p className="text-sm text-amber-600 font-mono bg-amber-50 inline-block px-2 py-1 rounded">
                               Tracking: {order.tracking_number}
                            </p>
                         </div>
                       )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}