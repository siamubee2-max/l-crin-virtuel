import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Loader2, Lock, ShoppingBag, ExternalLink, ArrowLeft } from "lucide-react";
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/components/LanguageProvider';
import ShareButton from "@/components/common/ShareButton";
import SEO from '@/components/common/SEO';

export default function Lookbook() {
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const lookbookId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: lookbook, isLoading } = useQuery({
    queryKey: ['lookbook', lookbookId],
    queryFn: async () => {
      const res = await base44.entities.Lookbook.list();
      return res.find(l => l.id === lookbookId);
    },
    enabled: !!lookbookId,
  });

  // Check if purchased
  const { data: access } = useQuery({
    queryKey: ['lookbookAccess', lookbookId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const res = await base44.entities.LookbookAccess.filter({ 
        user_id: currentUser.id, 
        lookbook_id: lookbookId 
      });
      return res.length > 0 ? res[0] : null;
    },
    enabled: !!lookbookId && !!currentUser,
  });

  // Fetch associated items (jewelry/clothes)
  const { data: items } = useQuery({
    queryKey: ['lookbookItems', lookbook?.associated_item_ids],
    queryFn: async () => {
      if (!lookbook?.associated_item_ids?.length) return [];
      // This is simplified. In a real app we'd fetch specific IDs efficiently.
      // Here we fetch all (cached) and filter, or use specific endpoint if available.
      const jewelry = await base44.entities.JewelryItem.list();
      const clothes = await base44.entities.ClothingItem.list();
      const all = [...jewelry, ...clothes];
      return all.filter(item => lookbook.associated_item_ids.includes(item.id));
    },
    enabled: !!lookbook?.associated_item_ids,
  });

  const purchaseMutation = useMutation({
    mutationFn: (data) => base44.entities.LookbookAccess.create(data),
    onSuccess: () => {
      toast.success("Purchase successful! Content unlocked.");
      queryClient.invalidateQueries({ queryKey: ['lookbookAccess'] });
    }
  });

  const handlePurchase = async () => {
    if (!currentUser) {
      toast.error("Please login to purchase");
      return;
    }
    
    // Simulate Payment
    toast.info("Processing payment...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    purchaseMutation.mutate({
      user_id: currentUser.id,
      lookbook_id: lookbookId,
      purchase_date: new Date().toISOString(),
      amount_paid: lookbook.price
    });
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!lookbook) return <div className="p-12 text-center">Lookbook not found</div>;

  const isLocked = lookbook.is_premium && lookbook.price > 0 && !access;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {lookbook && (
        <SEO 
          title={lookbook.title}
          description={lookbook.description}
          image={lookbook.cover_image}
          type="article"
          author={lookbook.stylist_id}
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.product?.back || "Back"}
        </Button>
        {lookbook && (
          <ShareButton 
             text={`Discover ${lookbook.title} on L'Écrin Virtuel`} 
             url={window.location.href}
             imageUrl={lookbook.cover_image}
          >
             {t.lookbook?.share || "Partager"}
          </ShareButton>
        )}
      </div>

      <div className="relative aspect-video rounded-3xl overflow-hidden bg-neutral-100 shadow-xl">
        <img src={lookbook.cover_image} alt={lookbook.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">{lookbook.title}</h1>
          <p className="text-lg text-white/90 max-w-2xl">{lookbook.description}</p>
        </div>
      </div>

      {isLocked ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 md:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-neutral-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif">{t.lookbook?.unlock || "Unlock Premium Content"}</h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              {t.lookbook?.exclusive || "Get exclusive access to this curated lookbook, including style notes and direct shopping links."}
            </p>
          </div>
          <Button 
            size="lg" 
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 h-12 text-lg"
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending}
          >
            {purchaseMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShoppingBag className="w-5 h-5 mr-2" />}
            {t.lookbook?.buyFor || "Buy for"} ${lookbook.price}
          </Button>
          <p className="text-xs text-neutral-400">{t.lookbook?.oneTime || "One-time purchase • Lifetime access"}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Content */}
          <div className="prose prose-lg prose-neutral max-w-none">
             <ReactMarkdown>{lookbook.content_html || `*${t.lookbook?.noContent || "No content provided."}*`}</ReactMarkdown>
          </div>

          {/* Shop the Look */}
          {items?.length > 0 && (
            <div className="border-t pt-12">
              <h2 className="text-2xl font-serif mb-8">{t.lookbook?.shopLook || "Shop the Look"}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {items.map(item => (
                  <div key={item.id} className="group">
                    <div className="aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden mb-3 relative">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      {item.affiliate_link && (
                        <a 
                          href={item.affiliate_link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Button size="sm" variant="secondary" className="shadow-lg">
                            {t.lookbook?.buyNow || "Buy Now"} <ExternalLink className="w-3 h-3 ml-2" />
                          </Button>
                        </a>
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <p className="text-neutral-500 text-xs">{item.brand}</p>
                    <p className="font-medium mt-1 text-sm">${item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}