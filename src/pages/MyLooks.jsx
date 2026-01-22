import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Lock, Globe, Trash2, Share2, Eye, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';

export default function MyLooks() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, public, private

  const { data: looks = [], isLoading } = useQuery({
    queryKey: ['looks'],
    queryFn: () => base44.entities.Look.list('-created_date'),
  });

  const { data: creations = [] } = useQuery({
    queryKey: ['creations'],
    queryFn: () => base44.entities.Creation.list(),
  });

  const { data: jewelry = [] } = useQuery({
    queryKey: ['jewelry'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const { data: clothing = [] } = useQuery({
    queryKey: ['clothing'],
    queryFn: () => base44.entities.ClothingItem.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUserMyLooks'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: collections = [], isLoading: isCollectionsLoading } = useQuery({
    queryKey: ['collections', user?.email],
    queryFn: () =>
      user
        ? base44.entities.CuratedCollection.filter({ created_by: user.email }, '-created_date')
        : base44.entities.CuratedCollection.filter({ is_private: false }, '-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Look.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['looks'] });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: ({ id, isPublic }) => base44.entities.Look.update(id, { is_public: isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['looks'] });
    },
  });

  const getCreation = (id) => creations.find(c => c.id === id);
  const getJewelry = (id) => jewelry.find(j => j.id === id);
  const getClothing = (id) => clothing.find(c => c.id === id);
  const getItemImage = (item) => {
    if (!item) return null;
    return item.item_type === 'jewelry'
      ? getJewelry(item.item_id)?.image_url
      : getClothing(item.item_id)?.image_url;
  };

  const filteredLooks = looks.filter(look => {
    if (filter === 'public') return look.is_public;
    if (filter === 'private') return !look.is_public;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <SEO title="Mes Looks" description="Retrouvez tous vos looks sauvegardés et partagez-les avec la communauté" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-neutral-900 mb-2">Mes Looks</h1>
          <p className="text-neutral-500">Vos combinaisons de bijoux préférées</p>
        </div>
        <Link to={createPageUrl("Studio")}>
          <Button className="bg-gradient-to-r from-amber-600 to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Créer un Look
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Tous ({looks.length})
        </Button>
        <Button
          variant={filter === 'public' ? 'default' : 'outline'}
          onClick={() => setFilter('public')}
          size="sm"
        >
          <Globe className="w-4 h-4 mr-1" />
          Publics ({looks.filter(l => l.is_public).length})
        </Button>
        <Button
          variant={filter === 'private' ? 'default' : 'outline'}
          onClick={() => setFilter('private')}
          size="sm"
        >
          <Lock className="w-4 h-4 mr-1" />
          Privés ({looks.filter(l => !l.is_public).length})
        </Button>
      </div>

      {/* Looks Grid */}
      {filteredLooks.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-neutral-700 mb-2">
            {filter === 'all' ? 'Aucun look sauvegardé' : `Aucun look ${filter === 'public' ? 'public' : 'privé'}`}
          </h3>
          <p className="text-neutral-500 mb-6">
            Créez votre premier look depuis le Studio d'essayage virtuel
          </p>
          <Link to={createPageUrl("Studio")}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier look
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLooks.map((look) => {
            const creation = getCreation(look.main_creation_id);
            const mainJewelry = getJewelry(look.main_jewelry_id);
            const complementaryItems = (look.complementary_jewelry_ids || [])
              .map(id => getJewelry(id))
              .filter(Boolean);

            return (
              <motion.div
                key={look.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Main Image */}
                  <div className="relative h-64 bg-neutral-100">
                    {creation?.result_image_url ? (
                      <img
                        src={creation.result_image_url}
                        alt={look.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-neutral-300" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant={look.is_public ? "default" : "secondary"} className="gap-1">
                        {look.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {look.is_public ? 'Public' : 'Privé'}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-serif text-lg text-neutral-900 mb-2">{look.title}</h3>
                    
                    {look.description && (
                      <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{look.description}</p>
                    )}

                    {/* Tags */}
                    {look.style_tags && look.style_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {look.style_tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Complementary Items */}
                    {complementaryItems.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-neutral-500 mb-2">Pièces complémentaires :</p>
                        <div className="flex gap-2">
                          {complementaryItems.slice(0, 3).map((item) => (
                            <div key={item.id} className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200">
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {complementaryItems.length > 3 && (
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-600">
                              +{complementaryItems.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    {look.is_public && (
                      <div className="flex items-center gap-3 text-sm text-neutral-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {look.likes_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          0
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublicMutation.mutate({ 
                          id: look.id, 
                          isPublic: !look.is_public 
                        })}
                        className="flex-1"
                      >
                        {look.is_public ? <Lock className="w-4 h-4 mr-1" /> : <Globe className="w-4 h-4 mr-1" />}
                        {look.is_public ? 'Rendre privé' : 'Rendre public'}
                      </Button>
                      
                      <ShareButton
                        url={`${window.location.origin}${createPageUrl(`SharedLook?id=${look.id}`)}`}
                        title={look.title}
                        size="sm"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Supprimer ce look ?')) {
                            deleteMutation.mutate(look.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    {/* Collections Section */}
    <div className="mt-12">
      <h2 className="text-2xl font-serif text-neutral-900 mb-4">Mes Tenues (Collections)</h2>
      {isCollectionsLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-neutral-100">
          <Sparkles className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600">Aucune collection pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => {
            const items = Array.isArray(col.items) ? col.items : [];
            const mainImg = col.cover_image || (items[0] ? getItemImage(items[0]) : null);
            return (
              <motion.div key={col.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative h-64 bg-neutral-100">
                    {mainImg ? (
                      <img src={mainImg} alt={col.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-neutral-300" />
                      </div>
                    )}
                    {col.featured && (
                      <Badge className="absolute top-3 right-3 bg-amber-600">Mis en avant</Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-lg text-neutral-900 mb-1">{col.title}</h3>
                    {col.occasion && (
                      <p className="text-xs text-neutral-500 mb-2">Occasion: {col.occasion}</p>
                    )}
                    {Array.isArray(col.tags) && col.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {col.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    {items.length > 0 && (
                      <div>
                        <p className="text-xs text-neutral-500 mb-2">Pièces ({items.length})</p>
                        <div className="flex gap-2">
                          {items.slice(0, 3).map((it, idx) => {
                            const img = getItemImage(it);
                            return (
                              <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200">
                                {img ? <img src={img} alt={it.item_type} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-neutral-100" />}
                              </div>
                            );
                          })}
                          {items.length > 3 && (
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-600">
                              +{items.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>

    </div>
  );
}