import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function PurchaseHistory({ userEmail }) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['myOrders', userEmail],
    queryFn: () => base44.entities.Order.filter({ created_by: userEmail }), // Assuming filtered by user
    enabled: !!userEmail,
  });

  // Fetch items to display names if needed, or assume item_id link
  const { data: jewelryItems } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });
  
  const { data: clothingItems } = useQuery({
    queryKey: ['clothingItems'],
    queryFn: () => base44.entities.ClothingItem.list(),
  });

  const getItemName = (id) => {
    const jewelry = jewelryItems?.find(i => i.id === id);
    if (jewelry) return jewelry.name;
    const clothing = clothingItems?.find(i => i.id === id);
    if (clothing) return clothing.name;
    return "Article inconnu";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return "bg-green-100 text-green-800";
      case 'shipped': return "bg-blue-100 text-blue-800";
      case 'processing': return "bg-amber-100 text-amber-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-neutral-300" /></div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-xl border-neutral-200">
        <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">Aucun achat effectué pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Article</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {format(new Date(order.created_date), 'dd MMM yyyy', { locale: fr })}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{getItemName(order.item_id)}</span>
                  <span className="text-xs text-neutral-400">Qté: {order.quantity}</span>
                </div>
              </TableCell>
              <TableCell>{order.total_price?.toFixed(2)} €</TableCell>
              <TableCell>
                <Badge variant="outline" className={`border-0 ${getStatusColor(order.status)}`}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="cursor-pointer hover:bg-neutral-50">
                   Détails
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}