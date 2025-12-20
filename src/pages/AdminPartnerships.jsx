import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Crown, Users, Package, TrendingUp, DollarSign, Edit, Trash2, CheckCircle2, XCircle, Eye } from "lucide-react";

export default function AdminPartnerships() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("brands");
  const [brandDialog, setBrandDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandForm, setBrandForm] = useState({
    brand_name: '', description: '', logo_url: '', website_url: '',
    commission_rate: 10, tier: 'basic', featured: false, contact_email: '', status: 'pending'
  });

  // Auth check
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch data
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['allBrands'],
    queryFn: () => base44.entities.BrandPartnership.list()
  });

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ['allCreators'],
    queryFn: () => base44.entities.CreatorProfile.list()
  });

  const { data: collections } = useQuery({
    queryKey: ['allCollections'],
    queryFn: () => base44.entities.CuratedCollection.list()
  });

  const { data: clicks } = useQuery({
    queryKey: ['affiliateClicks'],
    queryFn: () => base44.entities.AffiliateClick.list()
  });

  // Mutations
  const saveBrand = useMutation({
    mutationFn: (data) => editingBrand 
      ? base44.entities.BrandPartnership.update(editingBrand.id, data)
      : base44.entities.BrandPartnership.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBrands'] });
      setBrandDialog(false);
      setEditingBrand(null);
      setBrandForm({ brand_name: '', description: '', logo_url: '', website_url: '', commission_rate: 10, tier: 'basic', featured: false, contact_email: '', status: 'pending' });
    }
  });

  const deleteBrand = useMutation({
    mutationFn: (id) => base44.entities.BrandPartnership.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allBrands'] })
  });

  const updateCreator = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CreatorProfile.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allCreators'] })
  });

  const openEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandForm(brand);
    setBrandDialog(true);
  };

  // Stats
  const totalClicks = clicks?.length || 0;
  const conversions = clicks?.filter(c => c.converted).length || 0;
  const totalCommissions = clicks?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-neutral-700">Access Denied</h2>
        <p className="text-neutral-500">Admin privileges required</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif">Partnership Management</h1>
        <p className="text-neutral-500">Manage brands, creators, and affiliate performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brands?.length || 0}</p>
                <p className="text-xs text-neutral-500">Partner Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{creators?.length || 0}</p>
                <p className="text-xs text-neutral-500">Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClicks}</p>
                <p className="text-xs text-neutral-500">Affiliate Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalCommissions.toFixed(0)}</p>
                <p className="text-xs text-neutral-500">Commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        {/* Brands Tab */}
        <TabsContent value="brands" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={brandDialog} onOpenChange={setBrandDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingBrand(null); setBrandForm({ brand_name: '', description: '', logo_url: '', website_url: '', commission_rate: 10, tier: 'basic', featured: false, contact_email: '', status: 'pending' }); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Brand
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Partner Brand'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Brand Name *</Label>
                      <Input value={brandForm.brand_name} onChange={e => setBrandForm({...brandForm, brand_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tier</Label>
                      <Select value={brandForm.tier} onValueChange={v => setBrandForm({...brandForm, tier: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={brandForm.description} onChange={e => setBrandForm({...brandForm, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input value={brandForm.logo_url} onChange={e => setBrandForm({...brandForm, logo_url: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={brandForm.website_url} onChange={e => setBrandForm({...brandForm, website_url: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission %</Label>
                      <Input type="number" value={brandForm.commission_rate} onChange={e => setBrandForm({...brandForm, commission_rate: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={brandForm.status} onValueChange={v => setBrandForm({...brandForm, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input value={brandForm.contact_email} onChange={e => setBrandForm({...brandForm, contact_email: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={brandForm.featured} onCheckedChange={v => setBrandForm({...brandForm, featured: v})} />
                    <Label>Featured on homepage</Label>
                  </div>
                  <Button onClick={() => saveBrand.mutate(brandForm)} className="w-full" disabled={saveBrand.isPending || !brandForm.brand_name}>
                    {saveBrand.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingBrand ? 'Update' : 'Create'} Brand
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands?.map(brand => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.brand_name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{brand.tier}</Badge></TableCell>
                    <TableCell>{brand.commission_rate}%</TableCell>
                    <TableCell>
                      <Badge className={brand.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}>
                        {brand.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{brand.featured ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditBrand(brand)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteBrand.mutate(brand.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Creators Tab */}
        <TabsContent value="creators" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creators?.map(creator => (
                  <TableRow key={creator.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 overflow-hidden">
                          {creator.profile_image ? <img src={creator.profile_image} className="w-full h-full object-cover" /> : creator.display_name?.[0]}
                        </div>
                        <span className="font-medium">{creator.display_name}</span>
                        {creator.verified && <Badge className="bg-blue-500 text-white text-[8px]">✓</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{creator.specialties?.slice(0, 2).join(', ')}</TableCell>
                    <TableCell>{creator.commission_rate}%</TableCell>
                    <TableCell>${creator.total_earnings?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge className={creator.status === 'approved' ? 'bg-green-100 text-green-700' : creator.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                        {creator.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {creator.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateCreator.mutate({ id: creator.id, data: { status: 'approved' } })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => updateCreator.mutate({ id: creator.id, data: { status: 'suspended' } })}>
                            Reject
                          </Button>
                        </>
                      )}
                      {creator.status === 'approved' && (
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => updateCreator.mutate({ id: creator.id, data: { verified: !creator.verified } })}>
                          {creator.verified ? 'Unverify' : 'Verify'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Saves</TableHead>
                  <TableHead>Featured</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections?.map(col => {
                  const creator = creators?.find(c => c.id === col.creator_id);
                  return (
                    <TableRow key={col.id}>
                      <TableCell className="font-medium">{col.title}</TableCell>
                      <TableCell>{creator?.display_name || '-'}</TableCell>
                      <TableCell>{col.items?.length || 0}</TableCell>
                      <TableCell>{col.views || 0}</TableCell>
                      <TableCell>{col.saves || 0}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={col.featured} 
                          onCheckedChange={(v) => base44.entities.CuratedCollection.update(col.id, { featured: v }).then(() => queryClient.invalidateQueries({ queryKey: ['allCollections'] }))}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}