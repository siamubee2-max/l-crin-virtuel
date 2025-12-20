import React from 'react';
import { Search, Filter, X, Percent } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function JewelryFilters({
  searchTerm, setSearchTerm,
  typeFilter, setTypeFilter,
  metalFilter, setMetalFilter,
  gemstoneFilter, setGemstoneFilter,
  brandFilter, setBrandFilter,
  collectionFilter, setCollectionFilter,
  priceRange, setPriceRange,
  saleFilter, setSaleFilter,
  uniqueBrands = [],
  uniqueCollections = []
}) {
  const activeFiltersCount = [
    typeFilter !== "all",
    metalFilter !== "all",
    gemstoneFilter !== "all",
    brandFilter !== "all",
    collectionFilter !== "all",
    saleFilter,
    priceRange.min !== "",
    priceRange.max !== ""
  ].filter(Boolean).length;

  const resetFilters = () => {
    setTypeFilter("all");
    setMetalFilter("all");
    setGemstoneFilter("all");
    setBrandFilter("all");
    setCollectionFilter("all");
    setSaleFilter(false);
    setPriceRange({ min: "", max: "" });
    setSearchTerm("");
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 sticky top-20 z-10 transition-all duration-300">
      {/* Top Bar: Search and Primary Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder="Rechercher une pièce..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-full border-neutral-200 bg-neutral-50/50 focus:bg-white transition-all hover:border-neutral-300"
          />
        </div>

        {/* Quick Type Filter (Tabs style) */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full lg:w-auto">
           {["all", "necklace", "earrings", "ring", "bracelet", "set"].map(type => (
             <Button
               key={type}
               variant="ghost"
               onClick={() => setTypeFilter(type)}
               className={`rounded-full h-10 px-6 capitalize whitespace-nowrap transition-all duration-300 ${
                 typeFilter === type 
                   ? "bg-neutral-900 text-white shadow-md transform scale-105" 
                   : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
               }`}
             >
               {type === "all" ? "Tout" : type}
             </Button>
           ))}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      {/* Advanced Filters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
         {/* Metal */}
         <Select value={metalFilter} onValueChange={setMetalFilter}>
            <SelectTrigger className="h-11 rounded-xl border-neutral-200 bg-white hover:border-neutral-300">
              <SelectValue placeholder="Métal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les Métaux</SelectItem>
              {["Gold", "Silver", "Platinum", "Rose Gold", "White Gold"].map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
         </Select>

         {/* Gemstone */}
         <Select value={gemstoneFilter} onValueChange={setGemstoneFilter}>
            <SelectTrigger className="h-11 rounded-xl border-neutral-200 bg-white hover:border-neutral-300">
              <SelectValue placeholder="Pierre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les Pierres</SelectItem>
              {["Diamond", "Pearl", "Ruby", "Sapphire", "Emerald"].map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
              <SelectItem value="none">Sans Pierre</SelectItem>
            </SelectContent>
         </Select>

         {/* Brand */}
         <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="h-11 rounded-xl border-neutral-200 bg-white hover:border-neutral-300">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les Marques</SelectItem>
              {uniqueBrands.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
         </Select>

         {/* Collection */}
         <Select value={collectionFilter} onValueChange={setCollectionFilter}>
            <SelectTrigger className="h-11 rounded-xl border-neutral-200 bg-white hover:border-neutral-300">
              <SelectValue placeholder="Collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les Collections</SelectItem>
              {uniqueCollections.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
         </Select>

         {/* Price Range */}
         <Popover>
            <PopoverTrigger asChild>
               <Button variant="outline" className="h-11 rounded-xl border-neutral-200 bg-white hover:border-neutral-300 justify-between font-normal text-muted-foreground">
                  {priceRange.min || priceRange.max ? (
                     <span>${priceRange.min || "0"} - ${priceRange.max || "..."}</span>
                  ) : (
                     <span>Prix</span>
                  )}
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-6 rounded-2xl shadow-xl border-0" align="start">
               <div className="space-y-4">
                  <h4 className="font-serif font-medium leading-none text-lg">Fourchette de Prix</h4>
                  <div className="flex gap-4">
                     <div className="space-y-2">
                        <Label>Min ($)</Label>
                        <Input 
                           type="number" 
                           placeholder="0"
                           value={priceRange.min}
                           onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                           className="rounded-lg" 
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>Max ($)</Label>
                        <Input 
                           type="number" 
                           placeholder="Max"
                           value={priceRange.max}
                           onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                           className="rounded-lg"
                        />
                     </div>
                  </div>
               </div>
            </PopoverContent>
         </Popover>

         {/* Sale Toggle */}
         <Button
            variant={saleFilter ? "default" : "outline"}
            className={`h-11 rounded-xl justify-start transition-all ${saleFilter ? "bg-amber-600 hover:bg-amber-700 text-white border-0" : "text-neutral-600 border-neutral-200 bg-white hover:border-amber-300 hover:text-amber-600"}`}
            onClick={() => setSaleFilter(!saleFilter)}
         >
            <Percent className="w-4 h-4 mr-2" />
            Soldes
         </Button>
      </div>

      {/* Active Filters Summary / Reset */}
      {activeFiltersCount > 0 && (
         <div className="flex items-center gap-2 pt-2 text-xs text-neutral-500">
            <span>{activeFiltersCount} active filter(s)</span>
            <Button 
               variant="ghost" 
               size="sm" 
               className="h-6 px-2 text-xs hover:bg-neutral-100"
               onClick={resetFilters}
            >
               Reset all
               <X className="w-3 h-3 ml-1" />
            </Button>
         </div>
      )}
    </div>
  );
}