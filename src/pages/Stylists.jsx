import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Loader2, Star, MapPin, Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Stylists() {
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const { data: stylists, isLoading } = useQuery({
    queryKey: ['stylists'],
    queryFn: () => base44.entities.Stylist.list(),
  });

  const uniqueSpecialties = React.useMemo(() => {
    const specs = new Set();
    stylists?.forEach(s => s.specialties?.forEach(sp => specs.add(sp)));
    return [...specs].sort();
  }, [stylists]);

  const uniqueLocations = React.useMemo(() => {
    return [...new Set(stylists?.map(s => s.location).filter(Boolean))].sort();
  }, [stylists]);

  const filteredStylists = stylists?.filter(stylist => {
    const matchesSearch = stylist.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          stylist.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || stylist.specialties?.includes(specialtyFilter);
    const matchesLocation = locationFilter === "all" || stylist.location === locationFilter;

    return matchesSearch && matchesSpecialty && matchesLocation;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSpecialtyFilter("all");
    setLocationFilter("all");
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-serif text-neutral-900">Meet Our Stylists</h1>
        <p className="text-neutral-500">
          Book personal consultations, get expert advice, and discover curated lookbooks from top fashion professionals.
        </p>
      </div>

      {/* Stylist Filters */}
      <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder="Search stylists by name or bio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {uniqueSpecialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
             <MapPin className="w-4 h-4 mr-2 inline" />
             <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {uniqueLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        {(searchTerm || specialtyFilter !== 'all' || locationFilter !== 'all') && (
           <Button variant="ghost" size="icon" onClick={clearFilters} className="text-red-500 hover:bg-red-50">
             <X className="w-4 h-4" />
           </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
        </div>
      ) : filteredStylists?.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-2xl">
          <p className="text-neutral-500">No stylists found matching your criteria.</p>
          <Button variant="link" onClick={clearFilters}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStylists.map((stylist) => (
            <Link 
              key={stylist.id} 
              to={createPageUrl(`StylistProfile?id=${stylist.id}`)}
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-neutral-100 flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden relative bg-neutral-100">
                {stylist.profile_image ? (
                  <img 
                    src={stylist.profile_image} 
                    alt={stylist.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400">
                    No Image
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-medium shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {stylist.rating || "5.0"}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-xl font-medium text-neutral-900 group-hover:text-amber-700 transition-colors">
                      {stylist.name}
                    </h3>
                    {stylist.location && (
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {stylist.location}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stylist.specialties?.slice(0, 3).map((spec, i) => (
                      <span key={i} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-neutral-500 line-clamp-3 mb-6 flex-1">
                  {stylist.bio}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-auto">
                  <div className="text-sm">
                    <span className="font-medium text-neutral-900">${stylist.hourly_rate}</span>
                    <span className="text-neutral-400">/hour</span>
                  </div>
                  <Button size="sm" variant="outline" className="group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                    View Profile
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}