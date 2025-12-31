import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, MousePointerClick, Eye, Users, TrendingUp, ShoppingBag, Bookmark } from "lucide-react";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import StatsCard from '@/components/analytics/StatsCard';
import { RevenueChart, ClicksChart, EngagementChart, CategoryPieChart, GrowthChart } from '@/components/analytics/AnalyticsCharts';
import { TopProductsWidget, useWidgetConfig, WidgetConfigDialog } from '@/components/analytics/DashboardWidgets';
import DateRangeSelector from '@/components/analytics/DateRangeSelector';
import ExportButton from '@/components/analytics/ExportButton';

export default function CreatorDashboard() {
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const { widgets, toggleWidget, reorderWidgets, resetWidgets } = useWidgetConfig('creator_dashboard_widgets');

  // Fetch current user & creator profile
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: creatorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['myCreatorProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.CreatorProfile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  // Fetch analytics data
  const { data: clicks } = useQuery({
    queryKey: ['creatorClicks', creatorProfile?.id],
    queryFn: () => base44.entities.AffiliateClick.filter({ creator_id: creatorProfile?.id }),
    enabled: !!creatorProfile?.id
  });

  const { data: collections } = useQuery({
    queryKey: ['creatorCollections', creatorProfile?.id],
    queryFn: () => base44.entities.CuratedCollection.filter({ creator_id: creatorProfile?.id }),
    enabled: !!creatorProfile?.id
  });

  const { data: jewelry } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list()
  });

  // Filter data by date range
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

  // Calculate stats
  const stats = useMemo(() => {
    const totalClicks = filteredClicks.length;
    const conversions = filteredClicks.filter(c => c.converted).length;
    const revenue = filteredClicks.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : 0;
    
    const totalViews = collections?.reduce((sum, c) => sum + (c.views || 0), 0) || 0;
    const totalSaves = collections?.reduce((sum, c) => sum + (c.saves || 0), 0) || 0;
    
    return {
      totalClicks,
      conversions,
      revenue,
      conversionRate,
      totalViews,
      totalSaves,
      followers: creatorProfile?.follower_count || 0,
      totalEarnings: creatorProfile?.total_earnings || 0
    };
  }, [filteredClicks, collections, creatorProfile]);

  // Generate chart data
  const chartData = useMemo(() => {
    // Group clicks by date for charts
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
    
    const timeSeriesData = Object.values(clicksByDate).sort((a, b) => a.date.localeCompare(b.date));
    
    // Category breakdown
    const categoryData = {};
    filteredClicks.forEach(click => {
      const type = click.item_type || 'other';
      if (!categoryData[type]) categoryData[type] = 0;
      categoryData[type]++;
    });
    const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
    
    // Top products
    const productClicks = {};
    filteredClicks.forEach(click => {
      if (!productClicks[click.item_id]) {
        const item = jewelry?.find(j => j.id === click.item_id);
        productClicks[click.item_id] = {
          id: click.item_id,
          name: item?.name || 'Produit inconnu',
          clicks: 0,
          revenue: 0
        };
      }
      productClicks[click.item_id].clicks++;
      productClicks[click.item_id].revenue += click.commission_amount || 0;
    });
    const topProducts = Object.values(productClicks).sort((a, b) => b.clicks - a.clicks);

    return {
      timeSeries: timeSeriesData,
      revenueData: timeSeriesData.map(d => ({ date: d.date, revenue: d.revenue })),
      clicksData: timeSeriesData,
      pieData,
      topProducts
    };
  }, [filteredClicks, jewelry]);

  // Engagement mock data (would come from real tracking)
  const engagementData = useMemo(() => {
    const days = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24));
    return Array.from({ length: Math.min(days, 30) }, (_, i) => ({
      date: format(subDays(dateRange.to, days - i - 1), 'dd/MM'),
      views: Math.floor(Math.random() * 100) + 50,
      saves: Math.floor(Math.random() * 20) + 5,
      followers: (creatorProfile?.follower_count || 100) + i * Math.floor(Math.random() * 3)
    }));
  }, [dateRange, creatorProfile]);

  // Export data
  const exportData = useMemo(() => {
    return filteredClicks.map(click => ({
      date: click.created_date,
      item_id: click.item_id,
      item_type: click.item_type,
      converted: click.converted ? 'Oui' : 'Non',
      commission: click.commission_amount || 0
    }));
  }, [filteredClicks]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!creatorProfile) {
    return (
      <div className="text-center py-20">
        <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-xl font-medium">Pas de profil créateur</h2>
        <p className="text-neutral-500">Vous devez d'abord devenir créateur pour accéder au dashboard.</p>
      </div>
    );
  }

  const isWidgetEnabled = (id) => widgets.find(w => w.id === id)?.enabled;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif">Dashboard Créateur</h1>
          <p className="text-neutral-500">Bienvenue, {creatorProfile.display_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton data={exportData} filename="creator_analytics" />
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
        <StatsCard
          title="Revenus"
          value={stats.revenue.toFixed(2)}
          prefix="$"
          icon={DollarSign}
          color="green"
          change={12}
        />
        <StatsCard
          title="Clics"
          value={stats.totalClicks}
          icon={MousePointerClick}
          color="blue"
          change={8}
        />
        <StatsCard
          title="Conversions"
          value={stats.conversions}
          icon={ShoppingBag}
          color="purple"
          change={-3}
        />
        <StatsCard
          title="Taux de conversion"
          value={stats.conversionRate}
          suffix="%"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Vues Collections"
          value={stats.totalViews}
          icon={Eye}
          color="pink"
        />
        <StatsCard
          title="Sauvegardes"
          value={stats.totalSaves}
          icon={Bookmark}
          color="amber"
        />
        <StatsCard
          title="Followers"
          value={stats.followers}
          icon={Users}
          color="blue"
          change={5}
        />
        <StatsCard
          title="Total Gains"
          value={stats.totalEarnings.toFixed(2)}
          prefix="$"
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {isWidgetEnabled('revenue') && (
              <RevenueChart data={chartData.revenueData} />
            )}
            {isWidgetEnabled('clicks') && (
              <ClicksChart data={chartData.clicksData} />
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {isWidgetEnabled('categories') && (
              <CategoryPieChart data={chartData.pieData} title="Clics par Catégorie" />
            )}
            {isWidgetEnabled('topProducts') && (
              <TopProductsWidget data={chartData.topProducts} />
            )}
            {isWidgetEnabled('growth') && (
              <GrowthChart data={engagementData.map(d => ({ date: d.date, value: d.followers }))} title="Croissance Followers" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueChart data={chartData.revenueData} title="Évolution des Revenus" />
          <div className="grid md:grid-cols-2 gap-6">
            <TopProductsWidget data={chartData.topProducts} title="Produits les plus rentables" />
            <CategoryPieChart data={chartData.pieData} title="Revenus par Catégorie" />
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <EngagementChart data={engagementData} />
          <div className="grid md:grid-cols-2 gap-6">
            <GrowthChart data={engagementData.map(d => ({ date: d.date, value: d.followers }))} title="Croissance Followers" />
            <GrowthChart data={engagementData.map(d => ({ date: d.date, value: d.views }))} title="Vues" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}