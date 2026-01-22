import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Sparkles, TrendingUp, Clock, Filter, Users, Compass, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import ShareButton from '@/components/common/ShareButton';
import { createPageUrl } from '@/utils';
import SEO from '@/components/common/SEO';
import FauxUsersShowcase from '@/components/community/FauxUsersShowcase';

export default function Community() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('discover'); // discover, following, foryou
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, trending
  const [selectedLook, setSelectedLook] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [personalizedLooks, setPersonalizedLooks] = useState([]);

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

  const { data: myFollows = [] } = useQuery({
    queryKey: ['myFollows', user?.email],
    queryFn: () => base44.entities.UserFollow.filter({ follower_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
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

  const followMutation = useMutation({
    mutationFn: async ({ userEmail, isFollowing }) => {
      if (isFollowing) {
        const follow = myFollows.find(f => f.following_email === userEmail);
        if (follow) await base44.entities.UserFollow.delete(follow.id);
      } else {
        await base44.entities.UserFollow.create({ 
          follower_email: user.email, 
          following_email: userEmail 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFollows'] });
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
  const isFollowing = (userEmail) => myFollows.some(f => f.following_email === userEmail);
  const getUserByEmail = (email) => allUsers.find(u => u.email === email);

  // Personalized Feed
  useEffect(() => {
    if (activeTab === 'foryou' && user?.style_preferences && publicLooks.length > 0) {
      const userPrefs = user.style_preferences;
      const scored = publicLooks.map(look => {
        let score = 0;
        
        // Match style tags
        if (look.style_tags && userPrefs.aesthetics) {
          const matchingTags = look.style_tags.filter(tag => 
            userPrefs.aesthetics.some(aes => aes.toLowerCase().includes(tag.toLowerCase()))
          );
          score += matchingTags.length * 3;
        }
        
        // Match occasions
        if (look.occasion && userPrefs.frequent_occasions) {
          if (userPrefs.frequent_occasions.some(occ => 
            look.occasion.toLowerCase().includes(occ.toLowerCase())
          )) {
            score += 2;
          }
        }
        
        // Boost recent likes
        if (isLikedByMe(look.id)) {
          score += 5;
        }
        
        // Popularity factor
        score += (look.likes_count || 0) * 0.1;
        
        return { ...look, score };
      });
      
      setPersonalizedLooks(scored.sort((a, b) => b.score - a.score));
    }
  }, [activeTab, user, publicLooks, myLikes]);

  // Following Feed
  const followingLooks = publicLooks.filter(look => 
    myFollows.some(f => f.following_email === look.created_by)
  );

  // Trending looks (high engagement in last 7 days)
  const trendingLooks = [...publicLooks]
    .filter(look => {
      const createdDate = new Date(look.created_date);
      const daysSinceCreation = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 7;
    })
    .sort((a, b) => {
      const scoreA = (a.likes_count || 0) + getLookComments(a.id).length * 2;
      const scoreB = (b.likes_count || 0) + getLookComments(b.id).length * 2;
      return scoreB - scoreA;
    })
    .slice(0, 6);

  // Discover creators with most popular looks
  const creators = allUsers.filter(u => 
    publicLooks.some(look => look.created_by === u.email)
  ).map(creator => {
    const creatorLooks = publicLooks.filter(look => look.created_by === creator.email);
    const totalLikes = creatorLooks.reduce((sum, look) => sum + (look.likes_count || 0), 0);
    return { ...creator, looksCount: creatorLooks.length, totalLikes };
  }).sort((a, b) => b.totalLikes - a.totalLikes).slice(0, 6);

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
        <div className="grid grid-cols-4 gap-4 mt-6">
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
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{myFollows.length}</p>
            <p className="text-sm text-neutral-500">Abonnements</p>
          </Card>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            Découvrir
          </TabsTrigger>
          <TabsTrigger value="foryou" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Pour Vous
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Abonnements ({followingLooks.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="discover">
          <FauxUsersShowcase />
        {/* Trending Section */}
        {trendingLooks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-serif text-neutral-900">Tendances de la Semaine</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {trendingLooks.map((look) => {
                const creation = getCreation(look.main_creation_id);
                return (
                  <div 
                    key={look.id}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => setSelectedLook(look)}
                  >
                    {creation?.result_image_url && (
                      <img src={creation.result_image_url} alt={look.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                      <div className="flex items-center gap-1 text-white text-xs">
                        <Heart className="w-3 h-3 fill-white" />
                        {look.likes_count || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured Creators */}
        {creators.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-serif text-neutral-900">Créateurs à Suivre</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {creators.map((creator) => {
                const following = isFollowing(creator.email);
                return (
                  <Card key={creator.email} className="p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center mx-auto mb-2">
                      <Users className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="font-medium text-sm truncate">{creator.full_name || 'Erine'}</p>
                    <p className="text-xs text-neutral-500">{creator.looksCount} looks</p>
                    <Button
                      size="sm"
                      variant={following ? "outline" : "default"}
                      className="w-full mt-2"
                      onClick={() => followMutation.mutate({ userEmail: creator.email, isFollowing: following })}
                    >
                      {following ? <UserCheck className="w-3 h-3 mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
                      {following ? 'Suivi' : 'Suivre'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Looks */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-serif text-neutral-900">Tous les Looks</h2>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              onClick={() => setSortBy('recent')}
              size="sm"
            >
              <Clock className="w-4 h-4 mr-1" />
              Récents
            </Button>
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              onClick={() => setSortBy('popular')}
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Populaires
            </Button>
          </div>
        </div>

        {publicLooks.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-neutral-700 mb-2">Aucun look partagé</h3>
            <p className="text-neutral-500">Soyez le premier à partager votre style !</p>
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
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-serif text-lg text-neutral-900 flex-1">{look.title}</h3>
                        {look.created_by !== user?.email && (
                          <Button
                            size="sm"
                            variant={isFollowing(look.created_by) ? "outline" : "ghost"}
                            className="ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              followMutation.mutate({ userEmail: look.created_by, isFollowing: isFollowing(look.created_by) });
                            }}
                          >
                            {isFollowing(look.created_by) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-xs text-neutral-500 mb-2">
                        par {getUserByEmail(look.created_by)?.full_name || 'Anonyme'}
                      </p>

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
      </TabsContent>

      {/* For You Tab - Personalized Feed */}
      <TabsContent value="foryou">
        <div className="mb-4">
          <h2 className="text-xl font-serif text-neutral-900 mb-2">Recommandé pour Vous</h2>
          <p className="text-sm text-neutral-500">Basé sur vos préférences de style et interactions</p>
        </div>

        {!user ? (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">Connectez-vous pour voir des recommandations personnalisées</p>
          </div>
        ) : personalizedLooks.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">Aucune recommandation pour le moment. Interagissez avec des looks pour affiner vos préférences !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {personalizedLooks.map((look) => {
                const creation = getCreation(look.main_creation_id);
                const comments = getLookComments(look.id);
                const liked = isLikedByMe(look.id);

                return (
                  <motion.div key={look.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} layout>
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow group">
                      <div className="relative h-80 bg-neutral-100 cursor-pointer" onClick={() => setSelectedLook(look)}>
                        {creation?.result_image_url ? (
                          <img src={creation.result_image_url} alt={look.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-neutral-300" />
                          </div>
                        )}
                        <Badge className="absolute top-3 right-3 bg-purple-600">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Pour Vous
                        </Badge>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif text-lg text-neutral-900 flex-1">{look.title}</h3>
                          {look.created_by !== user?.email && (
                            <Button size="sm" variant={isFollowing(look.created_by) ? "outline" : "ghost"} className="ml-2"
                              onClick={(e) => { e.stopPropagation(); followMutation.mutate({ userEmail: look.created_by, isFollowing: isFollowing(look.created_by) }); }}>
                              {isFollowing(look.created_by) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mb-2">par {getUserByEmail(look.created_by)?.full_name || 'Anonyme'}</p>
                        {look.description && <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{look.description}</p>}
                        {look.style_tags && look.style_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {look.style_tags.slice(0, 3).map((tag, idx) => <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>)}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex gap-4">
                            <button onClick={() => handleLike(look.id)} className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors">
                              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`} />
                              <span className={liked ? 'text-red-500 font-medium' : 'text-neutral-500'}>{look.likes_count || 0}</span>
                            </button>
                            <button onClick={() => setSelectedLook(look)} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-neutral-500">{comments.length}</span>
                            </button>
                          </div>
                          <ShareButton url={`${window.location.origin}${createPageUrl(`SharedLook?id=${look.id}`)}`} title={look.title} variant="ghost" size="sm" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </TabsContent>

      {/* Following Tab */}
      <TabsContent value="following">
        <div className="mb-4">
          <h2 className="text-xl font-serif text-neutral-900 mb-2">Abonnements</h2>
          <p className="text-sm text-neutral-500">Looks des créateurs que vous suivez</p>
        </div>

        {!user ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">Connectez-vous pour suivre des créateurs</p>
          </div>
        ) : followingLooks.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 mb-4">Vous ne suivez personne pour le moment</p>
            <Button onClick={() => setActiveTab('discover')}>Découvrir des créateurs</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {followingLooks.map((look) => {
                const creation = getCreation(look.main_creation_id);
                const comments = getLookComments(look.id);
                const liked = isLikedByMe(look.id);

                return (
                  <motion.div key={look.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} layout>
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow group">
                      <div className="relative h-80 bg-neutral-100 cursor-pointer" onClick={() => setSelectedLook(look)}>
                        {creation?.result_image_url ? (
                          <img src={creation.result_image_url} alt={look.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif text-lg text-neutral-900 flex-1">{look.title}</h3>
                          <Button size="sm" variant="outline" className="ml-2"
                            onClick={(e) => { e.stopPropagation(); followMutation.mutate({ userEmail: look.created_by, isFollowing: true }); }}>
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-neutral-500 mb-2">par {getUserByEmail(look.created_by)?.full_name || 'Anonyme'}</p>
                        {look.description && <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{look.description}</p>}
                        {look.style_tags && look.style_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {look.style_tags.slice(0, 3).map((tag, idx) => <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>)}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex gap-4">
                            <button onClick={() => handleLike(look.id)} className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors">
                              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`} />
                              <span className={liked ? 'text-red-500 font-medium' : 'text-neutral-500'}>{look.likes_count || 0}</span>
                            </button>
                            <button onClick={() => setSelectedLook(look)} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-neutral-500">{comments.length}</span>
                            </button>
                          </div>
                          <ShareButton url={`${window.location.origin}${createPageUrl(`SharedLook?id=${look.id}`)}`} title={look.title} variant="ghost" size="sm" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </TabsContent>
      </Tabs>

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