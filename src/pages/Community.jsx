import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Share2, UserPlus, UserCheck, Users, Search, Send, Plus, HelpCircle, Mail, Bell, Check, X } from "lucide-react";
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
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedItem, setSuggestedItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ['comments', itemId],
    queryFn: () => base44.entities.Comment.filter({ item_id: itemId, item_type: itemType }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: myCloset } = useQuery({
    queryKey: ['myClosetSimple'],
    queryFn: () => base44.entities.ClothingItem.list(),
    enabled: isSuggesting
  });

  const createComment = useMutation({
    mutationFn: () => base44.entities.Comment.create({
      item_id: itemId,
      item_type: itemType,
      text: comment,
      user_id: currentUser.id,
      suggested_item_id: suggestedItem?.id,
      suggested_item_type: suggestedItem ? 'clothing' : null,
      suggested_item_image: suggestedItem?.image_url,
      suggested_item_name: suggestedItem?.name
    }),
    onSuccess: () => {
      setComment("");
      setSuggestedItem(null);
      setIsSuggesting(false);
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
                {c.suggested_item_image && (
                   <div className="mt-2 border rounded-md p-1 bg-white inline-block">
                      <div className="flex items-center gap-2">
                         <img src={c.suggested_item_image} className="w-8 h-8 rounded object-cover" />
                         <span className="text-xs font-medium pr-2">{c.suggested_item_name}</span>
                      </div>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {isSuggesting && (
         <div className="mb-2 p-2 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-medium">Select item from your closet:</span>
               <Button variant="ghost" size="sm" onClick={() => setIsSuggesting(false)}><X className="w-3 h-3" /></Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
               {myCloset?.map(item => (
                  <div 
                     key={item.id} 
                     className={`shrink-0 w-12 h-12 rounded border cursor-pointer ${suggestedItem?.id === item.id ? 'border-amber-500 ring-1 ring-amber-500' : 'border-neutral-200'}`}
                     onClick={() => setSuggestedItem(item)}
                  >
                     <img src={item.image_url} className="w-full h-full object-cover rounded-sm" />
                  </div>
               ))}
            </div>
         </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
           <Input 
             value={comment}
             onChange={(e) => setComment(e.target.value)}
             placeholder="Add a comment or suggestion..."
             className="h-9 text-sm pr-8"
             onKeyDown={(e) => e.key === 'Enter' && comment && createComment.mutate()}
           />
           <Button 
             size="icon" 
             variant="ghost" 
             className="absolute right-0 top-0 h-9 w-9 text-neutral-400 hover:text-amber-600"
             onClick={() => setIsSuggesting(!isSuggesting)}
           >
             <Shirt className="w-4 h-4" />
           </Button>
        </div>
        <Button 
          size="sm" 
          className="bg-neutral-900 text-white"
          disabled={!comment && !suggestedItem}
          onClick={() => createComment.mutate()}
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

function MessagesList({ currentUser }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
       const sent = await base44.entities.Message.filter({ sender_id: currentUser.id });
       const received = await base44.entities.Message.filter({ receiver_id: currentUser.id });
       return [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    refetchInterval: 5000
  });

  const sendMessageMutation = useMutation({
    mutationFn: () => base44.entities.Message.create({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: newMessage,
      is_read: false
    }),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    if (!messages || !users) return [];
    const map = new Map();
    messages.forEach(m => {
      const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
      if (!map.has(otherId)) map.set(otherId, { user: users.find(u => u.id === otherId), lastMsg: m });
      else if (new Date(m.created_date) > new Date(map.get(otherId).lastMsg.created_date)) map.set(otherId, { ...map.get(otherId), lastMsg: m });
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.lastMsg.created_date) - new Date(a.lastMsg.created_date));
  }, [messages, users, currentUser]);

  const activeMessages = selectedUser 
    ? messages?.filter(m => 
        (m.sender_id === currentUser.id && m.receiver_id === selectedUser.id) || 
        (m.sender_id === selectedUser.id && m.receiver_id === currentUser.id)
      ) 
    : [];

  return (
    <div className="grid grid-cols-3 h-[500px] bg-white rounded-xl border border-neutral-100 overflow-hidden">
       {/* List */}
       <div className="col-span-1 border-r border-neutral-100 overflow-y-auto">
          {conversations.length === 0 && <div className="p-4 text-xs text-neutral-400">No messages yet.</div>}
          {conversations.map(c => (
             <div 
               key={c.user?.id} 
               className={`p-3 border-b border-neutral-50 cursor-pointer hover:bg-neutral-50 ${selectedUser?.id === c.user?.id ? 'bg-amber-50' : ''}`}
               onClick={() => setSelectedUser(c.user)}
             >
                <div className="flex items-center gap-2">
                   <Avatar className="w-8 h-8">
                      <AvatarFallback>{c.user?.full_name?.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{c.user?.full_name}</p>
                      <p className="text-xs text-neutral-500 truncate">{c.lastMsg.content}</p>
                   </div>
                </div>
             </div>
          ))}
       </div>

       {/* Chat */}
       <div className="col-span-2 flex flex-col">
          {selectedUser ? (
             <>
               <div className="p-3 border-b border-neutral-100 bg-neutral-50 font-medium text-sm flex items-center gap-2">
                  <Avatar className="w-6 h-6"><AvatarFallback>{selectedUser.full_name?.charAt(0)}</AvatarFallback></Avatar>
                  {selectedUser.full_name}
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeMessages?.map(m => (
                     <div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-2 rounded-lg text-sm ${m.sender_id === currentUser.id ? 'bg-amber-100 text-amber-900 rounded-br-none' : 'bg-neutral-100 text-neutral-800 rounded-bl-none'}`}>
                           {m.content}
                        </div>
                     </div>
                  ))}
               </div>
               <div className="p-3 border-t border-neutral-100 flex gap-2">
                  <Input 
                     value={newMessage}
                     onChange={e => setNewMessage(e.target.value)}
                     placeholder="Type a message..."
                     onKeyDown={e => e.key === 'Enter' && newMessage && sendMessageMutation.mutate()}
                  />
                  <Button size="icon" disabled={!newMessage} onClick={() => sendMessageMutation.mutate()}>
                     <Send className="w-4 h-4" />
                  </Button>
               </div>
             </>
          ) : (
             <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">Select a conversation</div>
          )}
       </div>
    </div>
  );
}

export default function Community() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchTerm, setSearchTerm] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [newRequest, setNewRequest] = useState({ question: "", category: "General", tags: [] });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Fetch Public Outfits, Creations, and Advice Requests
  const { data: publicOutfits } = useQuery({ queryKey: ['publicOutfits'], queryFn: () => base44.entities.Outfit.filter({ is_public: true }) });
  const { data: publicCreations } = useQuery({ queryKey: ['publicCreations'], queryFn: () => base44.entities.Creation.filter({ is_public: true }) });
  const { data: adviceRequests } = useQuery({ queryKey: ['adviceRequests'], queryFn: () => base44.entities.AdviceRequest.list() });

  const { data: users } = useQuery({ queryKey: ['usersList'], queryFn: () => base44.entities.User.list() });
  const { data: follows } = useQuery({ queryKey: ['follows'], queryFn: () => base44.entities.Follow.list() });
  const { data: friendRequests } = useQuery({ queryKey: ['friendRequests'], queryFn: () => base44.entities.FriendRequest.filter({ receiver_id: currentUser?.id, status: 'pending' }) });

  const followingIds = follows?.filter(f => f.follower_id === currentUser?.id).map(f => f.following_id) || [];

  const followMutation = useMutation({
    mutationFn: async (userId) => {
      if (followingIds.includes(userId)) {
        const follow = follows.find(f => f.follower_id === currentUser.id && f.following_id === userId);
        await base44.entities.Follow.delete(follow.id);
      } else {
        await base44.entities.Follow.create({ follower_id: currentUser.id, following_id: userId });
        // Also send Friend Request for bidirectional context if needed, but keeping simple
        await base44.entities.FriendRequest.create({ sender_id: currentUser.id, receiver_id: userId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follows'] })
  });

  const createRequestMutation = useMutation({
    mutationFn: () => base44.entities.AdviceRequest.create(newRequest),
    onSuccess: () => {
      setShowRequestDialog(false);
      setNewRequest({ question: "", category: "General", tags: [] });
      queryClient.invalidateQueries({ queryKey: ['adviceRequests'] });
    }
  });

  const acceptFriendMutation = useMutation({
    mutationFn: async (req) => {
       await base44.entities.FriendRequest.update(req.id, { status: 'accepted' });
       // Auto follow back logic could go here
       await base44.entities.Follow.create({ follower_id: currentUser.id, following_id: req.sender_id });
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
       queryClient.invalidateQueries({ queryKey: ['follows'] });
    }
  });

  const allFeedItems = [
    ...(publicOutfits || []).map(o => ({ ...o, type: 'outfit', sortDate: new Date(o.created_date) })),
    ...(publicCreations || []).map(c => ({ ...c, type: 'creation', sortDate: new Date(c.created_date) })),
    ...(adviceRequests || []).map(a => ({ ...a, type: 'advice_request', sortDate: new Date(a.created_date), seeking_advice: true, name: a.category, description: a.question }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  const friendsFeedItems = allFeedItems.filter(item => {
    const creator = users?.find(u => u.email === item.created_by);
    return creator && followingIds.includes(creator.id);
  });

  const adviceFeedItems = allFeedItems.filter(item => item.seeking_advice);

  const filteredUsers = users?.filter(u => 
    u.id !== currentUser?.id && 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSender = (id) => users?.find(u => u.id === id);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-serif text-neutral-900 mb-2">Community</h1>
          <p className="text-neutral-500">Discover styles, share your looks, and get advice.</p>
        </div>
        <div className="flex gap-2">
           <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogTrigger asChild>
                 <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                    <HelpCircle className="w-4 h-4" /> Ask Stylist/Community
                 </Button>
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader><DialogTitle>Request Style Advice</DialogTitle></DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                       <Label>Your Question</Label>
                       <Textarea 
                          value={newRequest.question} 
                          onChange={e => setNewRequest({...newRequest, question: e.target.value})} 
                          placeholder="e.g. Which earrings match this dress?"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Category</Label>
                       <Select value={newRequest.category} onValueChange={v => setNewRequest({...newRequest, category: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             {["General", "Jewelry Match", "Outfit Help", "Occasion"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                    <Button onClick={() => createRequestMutation.mutate()} disabled={!newRequest.question} className="w-full bg-neutral-900 text-white">Post Request</Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar */}
        <div className="space-y-6 lg:col-span-1">
           {/* Friend Requests */}
           {friendRequests?.length > 0 && (
             <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
                <h3 className="font-serif text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                   <Bell className="w-4 h-4" /> Friend Requests
                </h3>
                <div className="space-y-3">
                   {friendRequests.map(req => {
                      const sender = getSender(req.sender_id);
                      return (
                         <div key={req.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                               <Avatar className="w-6 h-6"><AvatarFallback>{sender?.full_name?.charAt(0)}</AvatarFallback></Avatar>
                               <span className="font-medium">{sender?.full_name}</span>
                            </div>
                            <div className="flex gap-1">
                               <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => acceptFriendMutation.mutate(req)}><Check className="w-3 h-3" /></Button>
                               <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400"><X className="w-3 h-3" /></Button>
                            </div>
                         </div>
                      )
                   })}
                </div>
             </div>
           )}

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

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white border border-neutral-100 p-1 mb-6">
              <TabsTrigger value="feed" className="flex-1">Global Feed</TabsTrigger>
              <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
              <TabsTrigger value="advice" className="flex-1">Advice Needed</TabsTrigger>
              <TabsTrigger value="messages" className="flex-1"><Mail className="w-4 h-4 mr-2" /> Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              {allFeedItems.length === 0 ? <div className="text-center py-10 text-neutral-500">No posts yet.</div> : allFeedItems.map(item => <FeedItem key={item.id} item={item} type={item.type} currentUser={currentUser} />)}
            </TabsContent>

            <TabsContent value="following" className="space-y-6">
              {friendsFeedItems.length === 0 ? <div className="text-center py-10 text-neutral-500">No posts from people you follow.</div> : friendsFeedItems.map(item => <FeedItem key={item.id} item={item} type={item.type} currentUser={currentUser} />)}
            </TabsContent>

            <TabsContent value="advice" className="space-y-6">
              {adviceFeedItems.length === 0 ? <div className="text-center py-10 text-neutral-500">No active advice requests.</div> : adviceFeedItems.map(item => <FeedItem key={item.id} item={item} type={item.type} currentUser={currentUser} />)}
            </TabsContent>

            <TabsContent value="messages">
               <MessagesList currentUser={currentUser} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}