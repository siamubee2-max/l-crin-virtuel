import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';

export default function Gallery() {
  const { t } = useLanguage();
  const { data: creations, isLoading } = useQuery({
    queryKey: ['creations'],
    queryFn: () => base44.entities.Creation.list('-created_date'),
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

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative z-10 max-w-xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif leading-tight">
            {t.gallery.hero.title} <br />
            <span className="text-amber-400 italic">{t.gallery.hero.subtitle}</span>
          </h1>
          <p className="text-neutral-300 text-lg">
            {t.gallery.hero.desc}
          </p>
          <Link to={createPageUrl("Studio")}>
            <Button size="lg" className="bg-white text-neutral-900 hover:bg-amber-50 rounded-full px-8 mt-4">
              {t.gallery.hero.cta} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Gallery Grid */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-serif text-neutral-900">{t.gallery.myCreations}</h2>
            <p className="text-neutral-500 mt-2">{t.gallery.latestTryons}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
          </div>
        ) : creations?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
            <p className="text-neutral-500 mb-6 text-lg">{t.gallery.empty}</p>
            <Link to={createPageUrl("Studio")}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="mr-2 w-4 h-4" /> {t.gallery.createFirst}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {creations?.map((creation, idx) => (
              <motion.div
                key={creation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  <img 
                    src={creation.result_image_url} 
                    alt="Creation result"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  
                  {/* Overlay with original items */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/50 bg-white">
                        <img src={creation.jewelry_image_url} className="w-full h-full object-cover" alt="Jewelry" />
                     </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 flex justify-between items-center bg-white z-10">
                  <div>
                    <p className="font-medium text-neutral-900 capitalize">
                      {getJewelryTypeLabel(creation.jewelry_type)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(creation.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => window.open(creation.result_image_url, '_blank')}>
                      <Download className="w-4 h-4 text-neutral-500" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}