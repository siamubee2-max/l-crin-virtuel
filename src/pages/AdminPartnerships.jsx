import React, { useState, useMemo } from 'react';
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
import { Loader2, Plus, Crown, Users, Package, TrendingUp, DollarSign, Edit, Trash2, CheckCircle2, XCircle, Eye, BarChart3, MousePointerClick } from "lucide-react";
import { format, subDays, parseISO, isWithinInterval } from "date-fns";
import StatsCard from '@/components/analytics/StatsCard';
import { RevenueChart, ClicksChart, CategoryPieChart } from '@/components/analytics/AnalyticsCharts';
import { TopProductsWidget, useWidgetConfig, WidgetConfigDialog } from '@/components/analytics/DashboardWidgets';
import DateRangeSelector from '@/components/analytics/DateRangeSelector';
import ExportButton from '@/components/analytics/ExportButton';

export default function AdminPartnerships() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("analytics");
  const [brandDialog, setBrandDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const { widgets, toggleWidget, reorderWidgets, resetWidgets } = useWidgetConfig('admin_dashboard_widgets');
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

  // Filter clicks by date range
  const filteredClicks = useMemo(() => {
    if (!clicks) return [];
    return clicks.filter(click => {
      try {
        const clickDate = parseISO(click.created_date);
        return isWithinInterval(clickDate, { start: dateRange.from, end: dateRange.to });
      } catch {
        return false;
      }
    });
  }, [clicks, dateRange]);

  // Stats
  const totalClicks = filteredClicks.length;
  const conversions = filteredClicks.filter(c => c.converted).length;
  const totalCommissions = filteredClicks.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : 0;

  // Chart data
  const chartData = useMemo(() => {
    const clicksByDate = {};
    filteredClicks.forEach(click => {
      const date = format(parseISO(click.created_date), 'dd/MM');
      if (!clicksByDate[date]) {
        clicksByDate[date] = { date, clicks: 0, conversions: 0, revenue: 0 };
      }
      clicksByDate[date].clicks++;
      if (click.converted) clicksByDate[date].conversions++;
      clicksByDate[date].revenue += click.commission_amount || 0;
    });
    
    const timeSeries = Object.values(clicksByDate).sort((a, b) => a.date.localeCompare(b.date));
    
    // By creator
    const byCreator = {};
    filteredClicks.forEach(click => {
      const id = click.creator_id || 'unknown';
      if (!byCreator[id]) byCreator[id] = { clicks: 0, revenue: 0 };
      byCreator[id].clicks++;
      byCreator[id].revenue += click.commission_amount || 0;
    });
    
    const creatorData = Object.entries(byCreator).map(([id, data]) => {
      const creator = creators?.find(c => c.id === id);
      return { id, name: creator?.display_name || 'Inconnu', ...data };
    }).sort((a, b) => b.revenue - a.revenue);

    // Category breakdown
    const categoryData = {};
    filteredClicks.forEach(click => {
      const type = click.item_type || 'other';
      if (!categoryData[type]) categoryData[type] = 0;
      categoryData[type]++;
    });
    const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

    return { timeSeries, creatorData, pieData };
  }, [filteredClicks, creators]);

  // Export data
  const exportData = useMemo(() => {
    return filteredClicks.map(click => {
      const creator = creators?.find(c => c.id === click.creator_id);
      return {
        date: click.created_date,
        creator: creator?.display_name || 'N/A',
        item_id: click.item_id,
        item_type: click.item_type,
        converted: click.converted ? 'Oui' : 'Non',
        commission: click.commission_amount || 0
      };
    });
  }, [filteredClicks, creators]);

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
        <p className="text-sm text-neutral-400 mt-1">
          Pour toute demande de partenariat : <a href="mailto:inferencevision@inference.store" className="text-amber-600 hover:underline">inferencevision@inference.store</a>
        </p>
      </div>

      {/* Date Range & Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename="partnership_analytics" />
          <WidgetConfigDialog 
            widgets={widgets} 
            onToggle={toggleWidget} 
            onReorder={reorderWidgets} 
            onReset={resetWidgets} 
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Marques Partenaires" value={brands?.length || 0} icon={Crown} color="purple" />
        <StatsCard title="Créateurs" value={creators?.length || 0} icon={Users} color="blue" />
        <StatsCard title="Clics Affiliés" value={totalClicks} icon={MousePointerClick} color="green" change={8} />
        <StatsCard title="Commissions" value={totalCommissions.toFixed(2)} prefix="$" icon={DollarSign} color="amber" change={12} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Conversions" value={conversions} icon={TrendingUp} color="pink" />
        <StatsCard title="Taux Conversion" value={conversionRate} suffix="%" icon={BarChart3} color="blue" />
        <StatsCard title="Collections" value={collections?.length || 0} icon={Package} color="amber" />
        <StatsCard title="Créateurs Approuvés" value={creators?.filter(c => c.status === 'approved').length || 0} icon={CheckCircle2} color="green" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <RevenueChart data={chartData.timeSeries.map(d => ({ date: d.date, revenue: d.revenue }))} title="Revenus des Commissions" />
            <ClicksChart data={chartData.timeSeries} title="Clics & Conversions" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <CategoryPieChart data={chartData.pieData} title="Clics par Catégorie" />
            <TopProductsWidget data={chartData.creatorData} title="Top Créateurs" />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance par Marque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {brands?.slice(0, 5).map((brand, idx) => (
                    <div key={brand.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {brand.logo_url && (
                          <img src={brand.logo_url} alt="" className="w-6 h-6 rounded object-contain" />
                        )}
                        <span className="text-sm font-medium">{brand.brand_name}</span>
                      </div>
                      <Badge variant="secondary">{brand.commission_rate}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
        <TabsContent value="creators" className="space-y-6">
          {/* Pending Applications Alert */}
          {creators?.filter(c => c.status === 'pending').length > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-800">
                        {creators.filter(c => c.status === 'pending').length} Pending Applications
                      </p>
                      <p className="text-sm text-amber-600">Review and approve creator applications</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Applications Section */}
          {creators?.filter(c => c.status === 'pending').length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Pending Review</h3>
              <div className="grid gap-4">
                {creators?.filter(c => c.status === 'pending').map(creator => (
                  <Card key={creator.id} className="border-amber-200">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 rounded-full bg-neutral-100 overflow-hidden flex-shrink-0">
                            {creator.profile_image ? (
                              <img src={creator.profile_image} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl font-medium text-neutral-400">
                                {creator.display_name?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-lg">{creator.display_name}</h4>
                            <p className="text-sm text-neutral-500 mb-2">{creator.created_by}</p>
                            {creator.bio && (
                              <p className="text-sm text-neutral-600 line-clamp-2 mb-2">{creator.bio}</p>
                            )}
                            {creator.specialties?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {creator.specialties.map((s, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                                ))}
                              </div>
                            )}
                            {creator.social_links && (
                              <div className="flex gap-3 mt-3 text-xs text-neutral-500">
                                {creator.social_links.instagram && <span>IG: @{creator.social_links.instagram}</span>}
                                {creator.social_links.tiktok && <span>TT: @{creator.social_links.tiktok}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex md:flex-col gap-2 md:w-32">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateCreator.mutate({ id: creator.id, data: { status: 'approved' } })}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => updateCreator.mutate({ id: creator.id, data: { status: 'suspended' } })}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Creators Table */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">All Creators</h3>
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
                            {creator.profile_image ? <img src={creator.profile_image} className="w-full h-full object-cover" alt="" /> : creator.display_name?.[0]}
                          </div>
                          <span className="font-medium">{creator.display_name}</span>
                          {creator.verified && <Badge className="bg-blue-500 text-white text-[8px]">✓</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{creator.specialties?.slice(0, 2).join(', ') || '-'}</TableCell>
                      <TableCell>{creator.commission_rate || 10}%</TableCell>
                      <TableCell>${creator.total_earnings?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge className={creator.status === 'approved' ? 'bg-green-100 text-green-700' : creator.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                          {creator.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {creator.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => updateCreator.mutate({ id: creator.id, data: { status: 'approved' } })}>
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
                        {creator.status === 'suspended' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateCreator.mutate({ id: creator.id, data: { status: 'approved' } })}>
                            Reinstate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
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