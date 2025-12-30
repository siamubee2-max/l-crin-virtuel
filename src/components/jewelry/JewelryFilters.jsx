import React from 'react';
import { Search, Filter, X } from 'lucide-react';
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
    <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm space-y-4">
      {/* Top Bar: Search and Primary Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder="Search by name, tags, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Type Filter (Tabs style) */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
           {["all", "necklace", "earrings", "ring", "bracelet", "set"].map(type => (
             <Button
               key={type}
               variant={typeFilter === type ? "default" : "outline"}
               size="sm"
               onClick={() => setTypeFilter(type)}
               className={`capitalize whitespace-nowrap ${typeFilter === type ? "bg-neutral-900" : "text-neutral-600"}`}
             >
               {type === "all" ? "All Types" : type}
             </Button>
           ))}
        </div>
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Advanced Filters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
         {/* Metal */}
         <Select value={metalFilter} onValueChange={setMetalFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Metal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metals</SelectItem>
              {["Gold", "Silver", "Platinum", "Rose Gold", "White Gold"].map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
         </Select>

         {/* Gemstone */}
         <Select value={gemstoneFilter} onValueChange={setGemstoneFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Gemstone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gems</SelectItem>
              {["Diamond", "Pearl", "Ruby", "Sapphire", "Emerald"].map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
              <SelectItem value="none">No Gemstone</SelectItem>
            </SelectContent>
         </Select>

         {/* Brand */}
         <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
         </Select>

         {/* Collection */}
         <Select value={collectionFilter} onValueChange={setCollectionFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collections</SelectItem>
              {uniqueCollections.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
         </Select>

         {/* Price Range */}
         <Popover>
            <PopoverTrigger asChild>
               <Button variant="outline" size="sm" className="h-9 text-xs justify-between font-normal text-muted-foreground border-input">
                  {priceRange.min || priceRange.max ? (
                     <span>${priceRange.min || "0"} - ${priceRange.max || "Any"}</span>
                  ) : (
                     <span>Price Range</span>
                  )}
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
               <div className="space-y-4">
                  <h4 className="font-medium leading-none">Price Range</h4>
                  <div className="flex gap-4">
                     <div className="space-y-2">
                        <Label>Min ($)</Label>
                        <Input 
                           type="number" 
                           placeholder="0"
                           value={priceRange.min}
                           onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} 
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>Max ($)</Label>
                        <Input 
                           type="number" 
                           placeholder="Max"
                           value={priceRange.max}
                           onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                        />
                     </div>
                  </div>
               </div>
            </PopoverContent>
         </Popover>


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