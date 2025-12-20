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

  // Fetch details for the selected order
  const { data: orderItem } = useQuery({
    queryKey: ['orderItem', selectedOrder?.item_id],
    queryFn: async () => {
      const items = await base44.entities.JewelryItem.filter({ id: selectedOrder.item_id });
      return items[0];
    },
    enabled: !!selectedOrder?.item_id
  });

  const { data: orderCustomer } = useQuery({
    queryKey: ['orderCustomer', selectedOrder?.customer_email],
    queryFn: async () => {
       const users = await base44.entities.User.list(); 
       return users.find(u => u.email === selectedOrder.customer_email);
    },
    enabled: !!selectedOrder?.customer_email
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
      case 'pending': return "bg-amber-900/30 text-amber-400 border border-amber-700/50";
      case 'processing': return "bg-blue-900/30 text-blue-400 border border-blue-700/50";
      case 'shipped': return "bg-purple-900/30 text-purple-400 border border-purple-700/50";
      case 'delivered': return "bg-emerald-900/30 text-emerald-400 border border-emerald-700/50";
      case 'cancelled': return "bg-red-900/30 text-red-400 border border-red-700/50";
      default: return "bg-neutral-800 text-neutral-400 border border-neutral-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-6 md:p-10 -m-6 md:-m-8">
      {/* Luxury Header */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h1 className="text-4xl font-serif text-white tracking-tight">Order Management</h1>
            </div>
            <p className="text-neutral-500 ml-4">Exclusive client orders & fulfillment</p>
          </div>
          
          {/* Stats Cards */}
          <div className="flex gap-3">
            <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-light text-amber-400">{orders?.length || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Total</p>
            </div>
            <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-light text-emerald-400">{orders?.filter(o => o.status === 'delivered').length || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Delivered</p>
            </div>
            <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-light text-purple-400">{orders?.filter(o => o.status === 'shipped').length || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">In Transit</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
            <Input
              placeholder="Search by order ID, name or email..."
              className="pl-11 h-12 bg-neutral-900/80 border-neutral-800 text-white placeholder:text-neutral-600 rounded-xl focus:border-amber-600 focus:ring-amber-600/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] h-12 bg-neutral-900/80 border-neutral-800 text-white rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-amber-500" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              <SelectItem value="all" className="text-white focus:bg-neutral-800">All Status</SelectItem>
              <SelectItem value="pending" className="text-white focus:bg-neutral-800">Pending</SelectItem>
              <SelectItem value="processing" className="text-white focus:bg-neutral-800">Processing</SelectItem>
              <SelectItem value="shipped" className="text-white focus:bg-neutral-800">Shipped</SelectItem>
              <SelectItem value="delivered" className="text-white focus:bg-neutral-800">Delivered</SelectItem>
              <SelectItem value="cancelled" className="text-white focus:bg-neutral-800">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table - Dark Luxury Style */}
        <div className="bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl shadow-black/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-900/80 border-b border-neutral-800 hover:bg-neutral-900/80">
                <TableHead className="text-amber-500/80 font-medium tracking-wider text-xs uppercase">Order ID</TableHead>
                <TableHead className="text-amber-500/80 font-medium tracking-wider text-xs uppercase">Date</TableHead>
                <TableHead className="text-amber-500/80 font-medium tracking-wider text-xs uppercase">Client</TableHead>
                <TableHead className="text-amber-500/80 font-medium tracking-wider text-xs uppercase">Amount</TableHead>
                <TableHead className="text-amber-500/80 font-medium tracking-wider text-xs uppercase">Status</TableHead>
                <TableHead className="text-amber-500/80 font-medium tracking-wider text-xs uppercase">Tracking</TableHead>
                <TableHead className="text-amber-500/80 font-medium tracking-wider text-xs uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center bg-transparent">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                  </TableCell>
                </TableRow>
              ) : filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-neutral-600 bg-transparent">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order, idx) => (
                  <TableRow 
                    key={order.id} 
                    className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-amber-400/80">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-neutral-400 text-sm">{format(new Date(order.created_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-xs font-medium">
                          {(order.customer_name || "G")[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-sm">{order.customer_name || "Guest"}</span>
                          <span className="text-xs text-neutral-600">{order.customer_email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-semibold">${order.total_price?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)} font-medium text-xs uppercase tracking-wide`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-neutral-500">
                      {order.tracking_number || <span className="text-neutral-700">—</span>}
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-amber-700/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-600 rounded-lg"
                          >
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-950 border-neutral-800 text-white max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-serif flex items-center gap-3">
                              <span className="text-amber-500">Order</span> 
                              <span className="font-mono text-neutral-400 text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            {/* Item Details - Dark */}
                            {orderItem && (
                              <div className="flex gap-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                                <div className="w-20 h-20 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={orderItem.image_url} alt={orderItem.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-white">{orderItem.name}</h4>
                                  <p className="text-xs text-neutral-500 mt-1">{orderItem.brand} • {orderItem.type}</p>
                                  <p className="text-lg font-semibold text-amber-400 mt-2">${order.total_price?.toLocaleString()}</p>
                                </div>
                              </div>
                            )}

                            {/* Customer Details - Dark */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium flex items-center gap-2 text-amber-500 uppercase tracking-wider">
                                <span className="w-1 h-4 bg-amber-500 rounded-full" />
                                Client Information
                                {orderCustomer && <Badge className="bg-emerald-900/30 text-emerald-400 border border-emerald-700/50 text-[10px]">VIP</Badge>}
                              </h4>
                              <div className="text-sm bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-2">
                                <p className="flex justify-between"><span className="text-neutral-500">Name</span> <span className="text-white">{order.customer_name}</span></p>
                                <p className="flex justify-between"><span className="text-neutral-500">Email</span> <span className="text-neutral-300">{order.customer_email}</span></p>
                                {orderCustomer?.style_preferences && (
                                  <p className="flex justify-between pt-2 border-t border-neutral-800">
                                    <span className="text-neutral-500">Style</span>
                                    <span className="text-amber-400">{orderCustomer.style_preferences.jewelry_preference_type || "Classic"}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-neutral-400 text-xs uppercase tracking-wider">Status</Label>
                                <Select value={statusInput} onValueChange={setStatusInput}>
                                  <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-neutral-900 border-neutral-800">
                                    <SelectItem value="pending" className="text-white focus:bg-neutral-800">Pending</SelectItem>
                                    <SelectItem value="processing" className="text-white focus:bg-neutral-800">Processing</SelectItem>
                                    <SelectItem value="shipped" className="text-white focus:bg-neutral-800">Shipped</SelectItem>
                                    <SelectItem value="delivered" className="text-white focus:bg-neutral-800">Delivered</SelectItem>
                                    <SelectItem value="cancelled" className="text-white focus:bg-neutral-800">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-neutral-400 text-xs uppercase tracking-wider">Tracking</Label>
                                <Input 
                                  value={trackingInput}
                                  onChange={(e) => setTrackingInput(e.target.value)}
                                  placeholder="UPS123456789"
                                  className="bg-neutral-900 border-neutral-800 text-white h-11 placeholder:text-neutral-600"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-neutral-400 text-xs uppercase tracking-wider">Shipping Address</Label>
                              <p className="text-sm text-neutral-300 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                                {order.shipping_address}
                              </p>
                            </div>
                          </div>
                          <DialogFooter className="gap-2">
                            <Button 
                              variant="ghost"
                              onClick={() => setSelectedOrder(null)}
                              className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleUpdate} 
                              disabled={updateOrderMutation.isPending}
                              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium"
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
        
        {/* Footer branding */}
        <div className="text-center pt-4">
          <p className="text-neutral-700 text-xs uppercase tracking-[0.3em]">L'Écrin Virtuel • Admin Console</p>
        </div>
      </div>
    </div>
  );
}