import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, MoreHorizontal, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PostCard({ post, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => base44.entities.CommunityComment.list({ 
      filter: { post_id: post.id }, 
      sort: { created_date: 1 } 
    }),
    enabled: showComments
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => base44.entities.CommunityPost.update(post.id, {
      likes_count: (post.likes_count || 0) + 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['communityPosts']);
    }
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (content) => base44.entities.CommunityComment.create({
      post_id: post.id,
      content,
      user_display_name: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Anonyme',
      user_avatar: currentUser?.profile_image
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', post.id]);
      setNewComment("");
    }
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      commentMutation.mutate(newComment);
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'tip': return { label: '💡 Astuce', color: 'bg-yellow-100 text-yellow-800' };
      case 'recommendation': return { label: '⭐ Recommandation', color: 'bg-green-100 text-green-800' };
      case 'showcase': return { label: '✨ Essayage', color: 'bg-purple-100 text-purple-800' };
      case 'question': return { label: '❓ Question', color: 'bg-blue-100 text-blue-800' };
      default: return { label: 'Post', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const typeInfo = getTypeLabel(post.type);

  return (
    <Card className="mb-6 hover:shadow-md transition-shadow duration-300 overflow-hidden border-neutral-100">
      <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
        <Avatar>
          <AvatarImage src={post.user_avatar} />
          <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-neutral-900">{post.user_display_name || 'Utilisateur'}</h4>
            <span className="text-xs text-neutral-400">
              {formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: fr })}
            </span>
          </div>
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary" className={`text-xs font-normal ${typeInfo.color}`}>
              {typeInfo.label}
            </Badge>
            {post.category && (
              <Badge variant="outline" className="text-xs font-normal text-neutral-500">
                {post.category === 'both' ? 'Mode & Bijoux' : post.category === 'jewelry' ? 'Bijoux' : 'Mode'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <p className="text-neutral-700 whitespace-pre-wrap mb-4">{post.content}</p>
        
        {post.image_url && (
          <div className="rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100 mb-4">
            <img 
              src={post.image_url} 
              alt="Post content" 
              className="w-full h-auto object-cover max-h-[500px]" 
              loading="lazy"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col p-0 bg-neutral-50/50">
        <div className="flex items-center justify-between w-full px-4 py-3 border-t border-neutral-100">
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-neutral-500 hover:text-red-500 hover:bg-red-50 gap-2 px-2"
              onClick={() => likeMutation.mutate()}
            >
              <Heart className={`w-4 h-4 ${likeMutation.isPending ? 'animate-pulse' : ''}`} />
              <span>{post.likes_count || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-neutral-500 hover:text-blue-500 hover:bg-blue-50 gap-2 px-2"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length || 'Commenter'}</span>
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" className="text-neutral-400">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {showComments && (
          <div className="w-full px-4 pb-4 border-t border-neutral-100 bg-white">
            <div className="space-y-3 py-4 max-h-60 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3 text-sm">
                  <Avatar className="w-6 h-6 mt-1">
                    <AvatarImage src={comment.user_avatar} />
                    <AvatarFallback className="text-[10px]"><UserIcon className="w-3 h-3" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-neutral-50 p-2 rounded-lg flex-1">
                    <span className="font-semibold text-xs block mb-0.5">{comment.user_display_name}</span>
                    <p className="text-neutral-700">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-center text-neutral-400 italic">Soyez le premier à commenter !</p>
              )}
            </div>
            
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <Input 
                placeholder="Écrivez un commentaire..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="h-9 text-sm"
              />
              <Button type="submit" size="sm" disabled={!newComment.trim() || commentMutation.isPending}>
                Envoyer
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}