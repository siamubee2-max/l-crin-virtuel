import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Filter, Truck, Package, Save, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [statusInput, setStatusInput] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    enabled: !!user // Only fetch if user is loaded
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      setSelectedOrder(null);
    }
  });

  const handleUpdate = () => {
    if (!selectedOrder) return;
    updateOrderMutation.mutate({
      id: selectedOrder.id,
      data: {
        status: statusInput || selectedOrder.status,
        tracking_number: trackingInput || selectedOrder.tracking_number
      }
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-neutral-900">Access Denied</h1>
        <p className="text-neutral-500 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const filteredOrders = orders?.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = 
      order.id.includes(searchTerm) || 
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-neutral-900">Order Management</h1>
          <p className="text-neutral-500">View and update customer orders.</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
             <Input
               placeholder="Search orders..."
               className="pl-9 w-[250px]"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <Select value={statusFilter} onValueChange={setStatusFilter}>
             <SelectTrigger className="w-[150px]">
               <SelectValue placeholder="Status" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Status</SelectItem>
               <SelectItem value="pending">Pending</SelectItem>
               <SelectItem value="processing">Processing</SelectItem>
               <SelectItem value="shipped">Shipped</SelectItem>
               <SelectItem value="delivered">Delivered</SelectItem>
               <SelectItem value="cancelled">Cancelled</SelectItem>
             </SelectContent>
           </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50">
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
                </TableCell>
              </TableRow>
            ) : filteredOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-neutral-500">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{format(new Date(order.created_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customer_name || "Guest"}</span>
                      <span className="text-xs text-neutral-500">{order.customer_email}</span>
                    </div>
                  </TableCell>
                  <TableCell>${order.total_price}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {order.tracking_number || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={selectedOrder?.id === order.id} onOpenChange={(open) => {
                      if (open) {
                        setSelectedOrder(order);
                        setTrackingInput(order.tracking_number || "");
                        setStatusInput(order.status);
                      } else {
                        setSelectedOrder(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Manage</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Order #{order.id.slice(0, 8)}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                             <Label>Status</Label>
                             <Select value={statusInput} onValueChange={setStatusInput}>
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="pending">Pending</SelectItem>
                                 <SelectItem value="processing">Processing</SelectItem>
                                 <SelectItem value="shipped">Shipped</SelectItem>
                                 <SelectItem value="delivered">Delivered</SelectItem>
                                 <SelectItem value="cancelled">Cancelled</SelectItem>
                               </SelectContent>
                             </Select>
                          </div>
                          <div className="space-y-2">
                             <Label>Tracking Number</Label>
                             <Input 
                               value={trackingInput}
                               onChange={(e) => setTrackingInput(e.target.value)}
                               placeholder="e.g. UPS123456789"
                             />
                          </div>
                          <div className="space-y-2 pt-2 border-t">
                             <Label>Shipping Address</Label>
                             <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-md">
                               {order.shipping_address}
                             </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleUpdate} 
                            disabled={updateOrderMutation.isPending}
                            className="bg-neutral-900 text-white"
                          >
                            {updateOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}