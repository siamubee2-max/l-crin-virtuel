import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { X, Filter, RotateCcw } from "lucide-react";

const OCCASIONS = [
  "Casual", "Work", "Date Night", "Party", "Wedding", "Vacation", "Sport"
];

const STYLES = [
  "Minimalist", "Bohemian", "Classic", "Modern", "Vintage", "Glamorous", "Edgy", "Romantic"
];

const JEWELRY_TYPES = [
  { value: "necklace", label: "Necklaces" },
  { value: "earrings", label: "Earrings" },
  { value: "ring", label: "Rings" },
  { value: "bracelet", label: "Bracelets" },
  { value: "anklet", label: "Anklets" },
  { value: "set", label: "Sets" }
];

const CLOTHING_TYPES = [
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "dress", label: "Dresses" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "bag", label: "Bags" },
  { value: "accessory", label: "Accessories" }
];

const METALS = ["Gold", "Silver", "Platinum", "Rose Gold", "White Gold"];

const GEMSTONES = ["Diamond", "Ruby", "Emerald", "Sapphire", "Pearl", "Amethyst", "Topaz"];

export default function AdvancedFilters({ 
  filters, 
  setFilters, 
  uniqueBrands = [],
  uniqueCreators = [],
  onReset,
  activeCategory = "all"
}) {
  
  const toggleArrayFilter = (key, value) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      const exists = arr.includes(value);
      return {
        ...prev,
        [key]: exists ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  };

  const activeFilterCount = Object.entries(filters).reduce((count, [key, val]) => {
    if (Array.isArray(val) && val.length > 0) return count + val.length;
    if (key === 'priceRange' && (val.min || val.max)) return count + 1;
    if (key === 'onSale' && val) return count + 1;
    return count;
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">{activeFilterCount}</Badge>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-neutral-500">
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["price", "types", "occasion"]} className="space-y-2">
        {/* Price Range */}
        <AccordionItem value="price" className="border-none">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Price Range
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-neutral-500">Min</Label>
                  <Input
                    type="number"
                    placeholder="$0"
                    value={filters.priceRange?.min || ""}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, min: e.target.value }
                    }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-neutral-500">Max</Label>
                  <Input
                    type="number"
                    placeholder="$999+"
                    value={filters.priceRange?.max || ""}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, max: e.target.value }
                    }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="onSale"
                  checked={filters.onSale || false}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onSale: checked }))}
                />
                <Label htmlFor="onSale" className="text-sm cursor-pointer">On Sale Only</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Product Types */}
        <AccordionItem value="types" className="border-none">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Product Type
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            {(activeCategory === "all" || activeCategory === "jewelry") && (
              <div className="mb-3">
                <p className="text-xs text-neutral-500 mb-2">Jewelry</p>
                <div className="flex flex-wrap gap-1.5">
                  {JEWELRY_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => toggleArrayFilter('jewelryTypes', type.value)}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        filters.jewelryTypes?.includes(type.value)
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(activeCategory === "all" || activeCategory === "clothing") && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">Clothing</p>
                <div className="flex flex-wrap gap-1.5">
                  {CLOTHING_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => toggleArrayFilter('clothingTypes', type.value)}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        filters.clothingTypes?.includes(type.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Occasion */}
        <AccordionItem value="occasion" className="border-none">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Occasion
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map(occ => (
                <button
                  key={occ}
                  onClick={() => toggleArrayFilter('occasions', occ)}
                  className={`px-2 py-1 rounded-full text-xs transition-all ${
                    filters.occasions?.includes(occ)
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Style */}
        <AccordionItem value="style" className="border-none">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Style
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map(style => (
                <button
                  key={style}
                  onClick={() => toggleArrayFilter('styles', style)}
                  className={`px-2 py-1 rounded-full text-xs transition-all ${
                    filters.styles?.includes(style)
                      ? 'bg-pink-600 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Materials (for jewelry) */}
        {(activeCategory === "all" || activeCategory === "jewelry") && (
          <AccordionItem value="materials" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
              Materials
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <div>
                <p className="text-xs text-neutral-500 mb-2">Metals</p>
                <div className="flex flex-wrap gap-1.5">
                  {METALS.map(metal => (
                    <button
                      key={metal}
                      onClick={() => toggleArrayFilter('metals', metal)}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        filters.metals?.includes(metal)
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200'
                      }`}
                    >
                      {metal}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-2">Gemstones</p>
                <div className="flex flex-wrap gap-1.5">
                  {GEMSTONES.map(gem => (
                    <button
                      key={gem}
                      onClick={() => toggleArrayFilter('gemstones', gem)}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        filters.gemstones?.includes(gem)
                          ? 'bg-purple-600 text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200'
                      }`}
                    >
                      {gem}
                    </button>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brands */}
        {uniqueBrands.length > 0 && (
          <AccordionItem value="brands" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
              Brands
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {uniqueBrands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => toggleArrayFilter('brands', brand)}
                    className={`px-2 py-1 rounded-full text-xs transition-all ${
                      filters.brands?.includes(brand)
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Creators */}
        {uniqueCreators.length > 0 && (
          <AccordionItem value="creators" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
              Creators
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {uniqueCreators.map(creator => (
                  <button
                    key={creator.id}
                    onClick={() => toggleArrayFilter('creators', creator.id)}
                    className={`px-2 py-1 rounded-full text-xs transition-all flex items-center gap-1 ${
                      filters.creators?.includes(creator.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200'
                    }`}
                  >
                    {creator.profile_image && (
                      <img src={creator.profile_image} className="w-4 h-4 rounded-full" />
                    )}
                    {creator.display_name}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}