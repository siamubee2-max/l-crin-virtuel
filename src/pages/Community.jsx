import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Share2, UserPlus, UserCheck, Users, Search, Send } from "lucide-react";
import { format } from 'date-fns';
import { useLanguage } from '@/components/LanguageProvider';

function UserCard({ user, currentUser, onFollow, isFollowing }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback>{user.full_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{user.full_name || "User"}</p>
          <p className="text-xs text-neutral-500">{user.email}</p>
        </div>
      </div>
      {currentUser?.id !== user.id && (
        <Button 
          size="sm" 
          variant={isFollowing ? "secondary" : "default"}
          onClick={() => onFollow(user.id)}
          className={isFollowing ? "bg-neutral-100 text-neutral-600" : "bg-neutral-900 text-white"}
        >
          {isFollowing ? <UserCheck className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}

function CommentSection({ itemId, itemType, currentUser }) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ['comments', itemId],
    queryFn: () => base44.entities.Comment.filter({ item_id: itemId, item_type: itemType }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createComment = useMutation({
    mutationFn: (text) => base44.entities.Comment.create({
      item_id: itemId,
      item_type: itemType,
      text,
      user_id: currentUser.id
    }),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] });
    }
  });

  const getUser = (id) => users?.find(u => u.id === id);

  return (
    <div className="mt-4 pt-4 border-t border-neutral-100">
      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
        {comments?.map(c => {
          const author = getUser(c.user_id);
          return (
            <div key={c.id} className="flex gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">{author?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-neutral-50 rounded-lg p-2 flex-1 text-sm">
                <span className="font-semibold text-xs">{author?.full_name}</span>
                <p className="text-neutral-700">{c.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="h-9 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && comment && createComment.mutate(comment)}
        />
        <Button 
          size="sm" 
          className="bg-neutral-900 text-white"
          disabled={!comment}
          onClick={() => createComment.mutate(comment)}
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function FeedItem({ item, type, currentUser }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const { data: creator } = useQuery({
    queryKey: ['user', item.created_by],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.email === item.created_by);
    },
  });

  const { data: likes } = useQuery({
    queryKey: ['likes', item.id],
    queryFn: () => base44.entities.Like.filter({ item_id: item.id, item_type: type }),
  });

  const isLiked = likes?.some(l => l.user_id === currentUser?.id);

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        const like = likes.find(l => l.user_id === currentUser.id);
        await base44.entities.Like.delete(like.id);
      } else {
        await base44.entities.Like.create({
          user_id: currentUser.id,
          item_id: item.id,
          item_type: type
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['likes', item.id] })
  });

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-all mb-6">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback>{creator?.full_name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{creator?.full_name || "Unknown User"}</p>
            <p className="text-xs text-neutral-400">{format(new Date(item.created_date), 'MMM d, yyyy')}</p>
          </div>
        </div>
        {item.seeking_advice && (
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
            Seeking Advice
          </span>
        )}
      </div>

      <div className="relative aspect-square md:aspect-video bg-neutral-50 overflow-hidden">
        <img 
          src={type === 'outfit' ? item.image_url : item.result_image_url} 
          className="w-full h-full object-contain"
          alt="Content"
        />
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg mb-1">{item.name || (type === 'creation' ? `Virtual Try-On: ${item.jewelry_type}` : 'Untitled')}</h3>
        {item.description && <p className="text-neutral-600 text-sm mb-4">{item.description}</p>}

        <div className="flex items-center gap-4 border-t border-neutral-50 pt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-1 ${isLiked ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-neutral-500"}`}
            onClick={() => toggleLike.mutate()}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            {likes?.length || 0}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 text-neutral-500"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 text-neutral-500 ml-auto">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {showComments && <CommentSection itemId={item.id} itemType={type} currentUser={currentUser} />}
      </div>
    </div>
  );
}

export default function Community() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Fetch Public Outfits
  const { data: publicOutfits } = useQuery({
    queryKey: ['publicOutfits'],
    queryFn: () => base44.entities.Outfit.filter({ is_public: true }),
  });

  // Fetch Public Creations
  const { data: publicCreations } = useQuery({
    queryKey: ['publicCreations'],
    queryFn: () => base44.entities.Creation.filter({ is_public: true }),
  });

  // Fetch Users
  const { data: users } = useQuery({
    queryKey: ['usersList'],
    queryFn: () => base44.entities.User.list(),
  });

  // Fetch Follows
  const { data: follows } = useQuery({
    queryKey: ['follows'],
    queryFn: () => base44.entities.Follow.list(),
  });

  const followingIds = follows
    ?.filter(f => f.follower_id === currentUser?.id)
    .map(f => f.following_id) || [];

  const followMutation = useMutation({
    mutationFn: async (userId) => {
      if (followingIds.includes(userId)) {
        const follow = follows.find(f => f.follower_id === currentUser.id && f.following_id === userId);
        await base44.entities.Follow.delete(follow.id);
      } else {
        await base44.entities.Follow.create({
          follower_id: currentUser.id,
          following_id: userId
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follows'] })
  });

  const allFeedItems = [
    ...(publicOutfits || []).map(o => ({ ...o, type: 'outfit', sortDate: new Date(o.created_date) })),
    ...(publicCreations || []).map(c => ({ ...c, type: 'creation', sortDate: new Date(c.created_date) }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  const friendsFeedItems = allFeedItems.filter(item => {
    // Find creator ID by email since creation stores email
    // This is tricky if we don't have creator ID on item.
    // Standard entities store created_by as email.
    // We need to map email to ID.
    const creator = users?.find(u => u.email === item.created_by);
    return creator && followingIds.includes(creator.id);
  });

  const adviceFeedItems = allFeedItems.filter(item => item.seeking_advice);

  const filteredUsers = users?.filter(u => 
    u.id !== currentUser?.id && 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-serif text-neutral-900 mb-2">Community</h1>
          <p className="text-neutral-500">Discover styles, share your looks, and get advice.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Sidebar - Navigation & Discovery */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-100 p-4 sticky top-24">
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Discover People
            </h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input 
                placeholder="Search users..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredUsers?.map(user => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  currentUser={currentUser} 
                  onFollow={followMutation.mutate}
                  isFollowing={followingIds.includes(user.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Feed Area */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white border border-neutral-100 p-1 mb-6">
              <TabsTrigger value="feed" className="flex-1">Global Feed</TabsTrigger>
              <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
              <TabsTrigger value="advice" className="flex-1">Advice Needed</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              {allFeedItems.length === 0 ? (
                <div className="text-center py-10 text-neutral-500">No posts yet. Be the first to share!</div>
              ) : (
                allFeedItems.map(item => (
                  <FeedItem key={item.id} item={item} type={item.type} currentUser={currentUser} />
                ))
              )}
            </TabsContent>

            <TabsContent value="following" className="space-y-6">
              {friendsFeedItems.length === 0 ? (
                <div className="text-center py-10 text-neutral-500">
                  <p>No posts from people you follow.</p>
                  <Button variant="link" onClick={() => setSearchTerm("")}>Find people to follow</Button>
                </div>
              ) : (
                friendsFeedItems.map(item => (
                  <FeedItem key={item.id} item={item} type={item.type} currentUser={currentUser} />
                ))
              )}
            </TabsContent>

            <TabsContent value="advice" className="space-y-6">
              {adviceFeedItems.length === 0 ? (
                <div className="text-center py-10 text-neutral-500">No active advice requests.</div>
              ) : (
                adviceFeedItems.map(item => (
                  <FeedItem key={item.id} item={item} type={item.type} currentUser={currentUser} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}