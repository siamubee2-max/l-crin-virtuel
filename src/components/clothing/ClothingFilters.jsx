import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from '@/components/LanguageProvider';

export default function ClothingFilters({
  filters,
  setFilters,
  uniqueBrands = [],
  uniqueColors = [],
  uniqueMaterials = []
}) {
  const { t } = useLanguage();

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "all",
      brand: "all",
      color: "all",
      material: "all",
      minPrice: "",
      maxPrice: ""
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'search') return !!v;
    if (k === 'minPrice' || k === 'maxPrice') return !!v;
    return v !== 'all';
  }).length;

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input 
          placeholder={t.closet?.searchPlaceholder || "Search..."}
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="pl-10 border-neutral-200"
        />
      </div>

      <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 items-center">
        {/* Mobile Filter Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden">
              <Filter className="w-4 h-4 mr-2" /> Filters
              {activeFilterCount > 0 && <span className="ml-1 bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.type} onValueChange={(v) => handleChange('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'].map(type => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={filters.brand} onValueChange={(v) => handleChange('brand', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {uniqueBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={filters.color} onValueChange={(v) => handleChange('color', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    {uniqueColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                 <Label>Price Range</Label>
                 <div className="flex gap-2">
                    <Input 
                      placeholder="Min" 
                      type="number" 
                      value={filters.minPrice} 
                      onChange={(e) => handleChange('minPrice', e.target.value)} 
                    />
                    <Input 
                      placeholder="Max" 
                      type="number" 
                      value={filters.maxPrice} 
                      onChange={(e) => handleChange('maxPrice', e.target.value)} 
                    />
                 </div>
              </div>

              <Button onClick={clearFilters} variant="ghost" className="w-full text-red-500">
                Clear Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Filters */}
        <div className="hidden md:flex gap-2 items-center">
          <Select value={filters.type} onValueChange={(v) => handleChange('type', v)}>
            <SelectTrigger className="w-[140px] border-neutral-200">
               <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'].map(type => (
                <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.brand} onValueChange={(v) => handleChange('brand', v)}>
            <SelectTrigger className="w-[140px] border-neutral-200">
               <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={filters.color} onValueChange={(v) => handleChange('color', v)}>
            <SelectTrigger className="w-[140px] border-neutral-200">
               <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              {uniqueColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border border-neutral-200 rounded-md px-2 bg-white h-10">
            <span className="text-xs text-neutral-400">$</span>
            <input 
              className="w-12 text-sm outline-none"
              placeholder="Min"
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
            />
            <span className="text-neutral-300">-</span>
            <input 
              className="w-12 text-sm outline-none"
              placeholder="Max"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
            />
          </div>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="text-neutral-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}