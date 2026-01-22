import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Sparkles, TrendingUp, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import ShareButton from '@/components/common/ShareButton';
import { createPageUrl } from '@/utils';
import SEO from '@/components/common/SEO';

export default function Community() {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, trending
  const [selectedLook, setSelectedLook] = useState(null);
  const [commentText, setCommentText] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: publicLooks = [], isLoading } = useQuery({
    queryKey: ['publicLooks', sortBy],
    queryFn: async () => {
      const looks = await base44.entities.Look.filter({ is_public: true }, '-created_date');
      if (sortBy === 'popular') {
        return [...looks].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      }
      return looks;
    },
  });

  const { data: creations = [] } = useQuery({
    queryKey: ['allCreations'],
    queryFn: () => base44.entities.Creation.list(),
  });

  const { data: jewelry = [] } = useQuery({
    queryKey: ['allJewelry'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const { data: myLikes = [] } = useQuery({
    queryKey: ['myLikes', user?.email],
    queryFn: () => base44.entities.LookLike.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ['lookComments'],
    queryFn: () => base44.entities.LookComment.list('-created_date'),
  });

  const likeMutation = useMutation({
    mutationFn: async ({ lookId, isLiked }) => {
      if (isLiked) {
        const like = myLikes.find(l => l.look_id === lookId);
        if (like) await base44.entities.LookLike.delete(like.id);
      } else {
        await base44.entities.LookLike.create({ look_id: lookId, user_email: user.email });
      }
      
      const look = publicLooks.find(l => l.id === lookId);
      const newCount = isLiked ? (look.likes_count || 0) - 1 : (look.likes_count || 0) + 1;
      await base44.entities.Look.update(lookId, { likes_count: newCount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicLooks'] });
      queryClient.invalidateQueries({ queryKey: ['myLikes'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (data) => base44.entities.LookComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookComments'] });
      setCommentText('');
    },
  });

  const handleLike = (lookId) => {
    if (!user) {
      alert('Connectez-vous pour liker');
      return;
    }
    const isLiked = myLikes.some(l => l.look_id === lookId);
    likeMutation.mutate({ lookId, isLiked });
  };

  const handleComment = (lookId) => {
    if (!user) {
      alert('Connectez-vous pour commenter');
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate({
      look_id: lookId,
      comment: commentText,
      user_name: user.full_name || 'Anonyme'
    });
  };

  const getCreation = (id) => creations.find(c => c.id === id);
  const getJewelry = (id) => jewelry.find(j => j.id === id);
  const getLookComments = (lookId) => allComments.filter(c => c.look_id === lookId);
  const isLikedByMe = (lookId) => myLikes.some(l => l.look_id === lookId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500">Chargement de la communauté...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SEO 
        title="Communauté - Partagez vos Looks" 
        description="Découvrez les looks de bijoux créés par la communauté, likez et commentez vos favoris"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-neutral-900">Communauté</h1>
            <p className="text-neutral-500">Découvrez les looks créés par notre communauté</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{publicLooks.length}</p>
            <p className="text-sm text-neutral-500">Looks Partagés</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {publicLooks.reduce((sum, l) => sum + (l.likes_count || 0), 0)}
            </p>
            <p className="text-sm text-neutral-500">Likes Totaux</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">{allComments.length}</p>
            <p className="text-sm text-neutral-500">Commentaires</p>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          onClick={() => setSortBy('recent')}
          size="sm"
        >
          <Clock className="w-4 h-4 mr-2" />
          Récents
        </Button>
        <Button
          variant={sortBy === 'popular' ? 'default' : 'outline'}
          onClick={() => setSortBy('popular')}
          size="sm"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Populaires
        </Button>
      </div>

      {/* Looks Grid */}
      {publicLooks.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-neutral-700 mb-2">
            Aucun look partagé pour le moment
          </h3>
          <p className="text-neutral-500 mb-6">
            Soyez le premier à partager votre style avec la communauté !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {publicLooks.map((look) => {
              const creation = getCreation(look.main_creation_id);
              const mainJewelry = getJewelry(look.main_jewelry_id);
              const comments = getLookComments(look.id);
              const liked = isLikedByMe(look.id);

              return (
                <motion.div
                  key={look.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow group">
                    {/* Image */}
                    <div 
                      className="relative h-80 bg-neutral-100 cursor-pointer"
                      onClick={() => setSelectedLook(look)}
                    >
                      {creation?.result_image_url ? (
                        <img
                          src={creation.result_image_url}
                          alt={look.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-neutral-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-serif text-lg text-neutral-900 mb-1">{look.title}</h3>
                      
                      {look.description && (
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                          {look.description}
                        </p>
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

                      {/* Stats & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleLike(look.id)}
                            className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors"
                          >
                            <Heart 
                              className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`}
                            />
                            <span className={liked ? 'text-red-500 font-medium' : 'text-neutral-500'}>
                              {look.likes_count || 0}
                            </span>
                          </button>
                          
                          <button
                            onClick={() => setSelectedLook(look)}
                            className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-neutral-500">{comments.length}</span>
                          </button>
                        </div>

                        <ShareButton
                          url={`${window.location.origin}${createPageUrl(`SharedLook?id=${look.id}`)}`}
                          title={look.title}
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Look Detail Dialog */}
      {selectedLook && (
        <Dialog open={!!selectedLook} onOpenChange={() => setSelectedLook(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Side */}
              <div className="rounded-lg overflow-hidden bg-neutral-100">
                {getCreation(selectedLook.main_creation_id)?.result_image_url && (
                  <img
                    src={getCreation(selectedLook.main_creation_id).result_image_url}
                    alt={selectedLook.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Details Side */}
              <div className="flex flex-col">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-serif">{selectedLook.title}</DialogTitle>
                </DialogHeader>

                {selectedLook.description && (
                  <p className="text-neutral-600 mb-4">{selectedLook.description}</p>
                )}

                {selectedLook.occasion && (
                  <div className="mb-4">
                    <p className="text-sm text-neutral-500">Occasion</p>
                    <p className="font-medium">{selectedLook.occasion}</p>
                  </div>
                )}

                {selectedLook.style_tags && selectedLook.style_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedLook.style_tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-6 py-4 border-y mb-4">
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{selectedLook.likes_count || 0}</p>
                    <p className="text-xs text-neutral-500">Likes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {getLookComments(selectedLook.id).length}
                    </p>
                    <p className="text-xs text-neutral-500">Commentaires</p>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="flex-1 overflow-y-auto mb-4">
                  <h4 className="font-medium mb-3">Commentaires</h4>
                  <div className="space-y-3">
                    {getLookComments(selectedLook.id).map((comment) => (
                      <div key={comment.id} className="bg-neutral-50 rounded-lg p-3">
                        <p className="font-medium text-sm text-neutral-900">{comment.user_name}</p>
                        <p className="text-sm text-neutral-600 mt-1">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Comment */}
                {user && (
                  <div className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ajoutez un commentaire..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleComment(selectedLook.id)}
                      disabled={!commentText.trim() || commentMutation.isPending}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}