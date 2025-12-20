import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight } from "lucide-react";

export default function SearchResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q') || "";
  const [activeTab, setActiveTab] = useState("all");

  const { data: jewelry, isLoading: jLoading } = useQuery({
    queryKey: ['searchJewelry'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const { data: clothes, isLoading: cLoading } = useQuery({
    queryKey: ['searchClothes'],
    queryFn: () => base44.entities.ClothingItem.list(),
  });

  const { data: stylists, isLoading: sLoading } = useQuery({
    queryKey: ['searchStylists'],
    queryFn: () => base44.entities.Stylist.list(),
  });

  const filteredJewelry = jewelry?.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.description?.toLowerCase().includes(query.toLowerCase()) ||
    item.brand?.toLowerCase().includes(query.toLowerCase())
  ) || [];

  const filteredClothes = clothes?.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.brand?.toLowerCase().includes(query.toLowerCase())
  ) || [];

  const filteredStylists = stylists?.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.bio?.toLowerCase().includes(query.toLowerCase()) ||
    item.specialties?.some(s => s.toLowerCase().includes(query.toLowerCase()))
  ) || [];

  const totalResults = filteredJewelry.length + filteredClothes.length + filteredStylists.length;
  const isLoading = jLoading || cLoading || sLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-neutral-900">Search Results</h1>
        <p className="text-neutral-500">Found {totalResults} results for "{query}"</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-neutral-300" /></div>
      ) : (
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="jewelry">Jewelry ({filteredJewelry.length})</TabsTrigger>
            <TabsTrigger value="clothing">Clothing ({filteredClothes.length})</TabsTrigger>
            <TabsTrigger value="stylists">Stylists ({filteredStylists.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8 mt-6">
             {filteredStylists.length > 0 && (
               <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium">Stylists</h2>
                    <Button variant="link" onClick={() => setActiveTab("stylists")}>View All</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredStylists.slice(0, 3).map(s => (
                       <Link key={s.id} to={createPageUrl(`StylistProfile?id=${s.id}`)} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-100 hover:shadow-md transition-all">
                          <img src={s.profile_image} className="w-16 h-16 rounded-full object-cover" />
                          <div>
                             <h3 className="font-medium">{s.name}</h3>
                             <p className="text-xs text-neutral-500">{s.specialties?.join(", ")}</p>
                          </div>
                       </Link>
                    ))}
                  </div>
               </section>
             )}

             {filteredJewelry.length > 0 && (
               <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium">Jewelry</h2>
                    <Button variant="link" onClick={() => setActiveTab("jewelry")}>View All</Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredJewelry.slice(0, 4).map(item => (
                       <Link key={item.id} to={createPageUrl(`JewelryBox?item=${item.id}`)} className="group">
                          <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-2">
                             <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                          <h3 className="text-sm font-medium truncate">{item.name}</h3>
                          <p className="text-xs text-neutral-500">{item.price ? `$${item.price}` : ''}</p>
                       </Link>
                    ))}
                  </div>
               </section>
             )}
          </TabsContent>

          <TabsContent value="jewelry" className="mt-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredJewelry.map(item => (
                   <Link key={item.id} to={createPageUrl(`JewelryBox?item=${item.id}`)} className="group">
                      <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-2">
                         <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <h3 className="text-sm font-medium truncate">{item.name}</h3>
                      <p className="text-xs text-neutral-500">{item.brand}</p>
                      <p className="text-sm font-medium mt-1">{item.price ? `$${item.price}` : ''}</p>
                   </Link>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="clothing" className="mt-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredClothes.map(item => (
                   <div key={item.id} className="group">
                      <div className="aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden mb-2">
                         <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <h3 className="text-sm font-medium truncate">{item.name}</h3>
                      <p className="text-xs text-neutral-500">{item.brand}</p>
                   </div>
                ))}
             </div>
          </TabsContent>
          
           <TabsContent value="stylists" className="mt-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredStylists.map(s => (
                   <Link key={s.id} to={createPageUrl(`StylistProfile?id=${s.id}`)} className="bg-white rounded-xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-all">
                      <div className="aspect-video bg-neutral-100">
                         <img src={s.profile_image} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                         <h3 className="font-serif text-lg font-medium">{s.name}</h3>
                         <p className="text-sm text-neutral-500 mb-2">{s.specialties?.join(", ")}</p>
                         <p className="text-sm line-clamp-2">{s.bio}</p>
                      </div>
                   </Link>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}