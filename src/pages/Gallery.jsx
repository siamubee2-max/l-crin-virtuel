import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, ArrowRight, Download, Calendar, Filter } from "lucide-react";
import ShareButton from "@/components/common/ShareButton";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';

const ITEMS_PER_PAGE = 9;

export default function Gallery() {
  const { t, setLanguage, language } = useLanguage();
  const [page, setPage] = useState(1);

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
  ];
  const [sortOrder, setSortOrder] = useState("-created_date");
  const [typeFilter, setTypeFilter] = useState("all");

  // Fetch body parts to resolve names
  const { data: bodyParts } = useQuery({
    queryKey: ['bodyParts'],
    queryFn: () => base44.entities.BodyPart.list(),
  });

  // Fetch creations with pagination and sorting
  // Note: Since the SDK might not support complex filtered pagination directly returning count,
  // we'll fetch a larger set or use client side filtering for the type if needed, 
  // but let's try to use the SDK's filter capability efficiently.
  const { data: creations, isLoading } = useQuery({
    queryKey: ['creations', sortOrder, typeFilter],
    queryFn: async () => {
      let query = {};
      if (typeFilter !== "all") {
        query.jewelry_type = typeFilter;
      }
      // Fetching all matching to handle client side pagination properly 
      // (or we could rely on a backend count if available, but here we keep it simple)
      return base44.entities.Creation.filter(query, sortOrder);
    },
  });

  const getJewelryTypeLabel = (type) => {
    switch(type) {
      case 'necklace': return t.studio.step1.types.necklace;
      case 'earrings': return t.studio.step1.types.earrings;
      case 'ring': return t.studio.step1.types.ring;
      case 'bracelet': return t.studio.step1.types.bracelet;
      case 'anklet': return t.studio.step1.types.anklet;
      case 'set': return t.studio.step1.types.set;
      default: return type;
    }
  };

  const getBodyPartName = (id) => {
    return bodyParts?.find(bp => bp.id === id)?.name || "Modèle";
  };

  // Pagination Logic
  const totalItems = creations?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedCreations = creations?.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative z-10 max-w-xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif leading-tight">
            Moni'attitude <br />
            <span className="text-amber-400 italic">Bijoux Uniques</span>
          </h1>
          <p className="text-neutral-300 text-lg">
            Découvrez nos créations artisanales en résine, pâte polymère et pierres semi-précieuses. Essayez-les virtuellement avant de craquer.
          </p>
          <div className="flex flex-col gap-6 mt-4">
            <Link to={createPageUrl("Studio")}>
              <Button size="lg" className="bg-white text-neutral-900 hover:bg-amber-50 rounded-full px-8">
                {t.gallery.hero.cta} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>

            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                    language === lang.code 
                      ? "bg-amber-500 text-white font-medium" 
                      : "bg-white/10 text-neutral-300 hover:bg-white/20"
                  }`}
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Controls & Grid */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-serif text-neutral-900">{t.gallery.myCreations}</h2>
            <p className="text-neutral-500 mt-2">{t.gallery.latestTryons}</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
             <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t.gallery.sort} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_date">{t.gallery.newest}</SelectItem>
                  <SelectItem value="created_date">{t.gallery.oldest}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t.gallery.filter} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout</SelectItem>
                  <SelectItem value="necklace">{t.studio.step1.types.necklace}</SelectItem>
                  <SelectItem value="earrings">{t.studio.step1.types.earrings}</SelectItem>
                  <SelectItem value="ring">{t.studio.step1.types.ring}</SelectItem>
                  <SelectItem value="bracelet">{t.studio.step1.types.bracelet}</SelectItem>
                  <SelectItem value="set">{t.studio.step1.types.set}</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
          </div>
        ) : paginatedCreations?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
            <p className="text-neutral-500 mb-6 text-lg">{t.gallery.empty}</p>
            <Link to={createPageUrl("Studio")}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="mr-2 w-4 h-4" /> {t.gallery.createFirst}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {paginatedCreations?.map((creation, idx) => (
                  <motion.div
                    key={creation.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 flex flex-col"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-neutral-100">
                      <img 
                        src={creation.result_image_url} 
                        alt="Creation result"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      
                      {/* Overlay with details */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                         <div className="flex items-end gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/30 bg-white/10 backdrop-blur-md shadow-lg shrink-0">
                                <img src={creation.jewelry_image_url} className="w-full h-full object-cover" alt="Jewelry" />
                            </div>
                            <div className="text-white mb-1">
                                <p className="text-xs text-white/60 uppercase tracking-widest mb-1">{t.gallery.bodyPart}</p>
                                <p className="font-medium text-sm truncate max-w-[150px]">{getBodyPartName(creation.body_part_id)}</p>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-5 bg-white z-10 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-neutral-900 capitalize text-lg">
                            {getJewelryTypeLabel(creation.jewelry_type)}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            {new Date(creation.created_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <ShareButton 
                            url={creation.result_image_url} 
                            imageUrl={creation.result_image_url} 
                            text={`Ma création sur L'Écrin Virtuel : ${getJewelryTypeLabel(creation.jewelry_type)}`}
                            variant="ghost" 
                            size="icon"
                            className="text-neutral-400 hover:text-amber-600"
                          />
                          <Button variant="ghost" size="icon" onClick={() => window.open(creation.result_image_url, '_blank')} className="text-neutral-400 hover:text-amber-600">
                            <Download className="w-5 h-5" />
                          </Button>
                        </div>
                        </div>
                      
                      {creation.description && (
                        <p className="text-sm text-neutral-500 line-clamp-2 bg-neutral-50 p-2 rounded-lg italic">
                          "{creation.description}"
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                        setPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={page === pageNum ? "bg-neutral-900" : ""}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}