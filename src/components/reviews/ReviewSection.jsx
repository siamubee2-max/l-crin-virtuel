import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, User, BadgeCheck, Lock, ShoppingBag, ArrowUpDown } from "lucide-react";
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageProvider';

export default function ReviewSection({ jewelryId }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch reviews for this item
  // Note: Filtering client side or server side depends on SDK. 
  // Assuming .filter({ jewelry_item_id: jewelryId }) works.
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', jewelryId],
    queryFn: () => base44.entities.Review.filter({ jewelry_item_id: jewelryId }, '-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Need to fetch the jewelry item to get the owner ID for notification
  const { data: jewelryItem } = useQuery({
    queryKey: ['jewelryItem', jewelryId],
    queryFn: () => base44.entities.JewelryItem.list().then(items => items.find(i => i.id === jewelryId)),
    enabled: !!jewelryId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Create review
      await base44.entities.Review.create(data);
      
      // Create notification for owner (if owner is not self)
      if (jewelryItem?.created_by && jewelryItem.created_by !== user?.email) {
          // Note: recipient_id should ideally be the user ID. 
          // Since created_by is email in Base44, we might need to lookup user ID by email 
          // OR if the system handles email notifications. 
          // For this specific app, let's assume we can notify by finding the user or if we just use email matching.
          // LIMITATION: 'created_by' gives email. 'Notification' wants 'recipient_id'. 
          // We need to find the user with that email.
          
          const users = await base44.entities.User.list();
          const owner = users.find(u => u.email === jewelryItem.created_by);
          
          if (owner) {
             await base44.entities.Notification.create({
                recipient_id: owner.id,
                title: "New Review",
                message: `${user?.full_name || "Someone"} reviewed your item "${jewelryItem.name}"`,
                type: "review",
                related_item_id: jewelryItem.id,
                link: `/JewelryBox?item=${jewelryItem.id}` // Hypothetical link deep linking
             });
          }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setNewRating(0);
      setComment("");
      setIsSubmitting(false);
    },
    onError: () => setIsSubmitting(false)
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newRating === 0) return;
    
    setIsSubmitting(true);
    createMutation.mutate({
      jewelry_item_id: jewelryId,
      rating: newRating,
      comment: comment,
      user_name: user?.full_name || "Anonymous"
    });
  };

  const locale = language === 'fr' ? fr : enUS;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> 
          {language === 'fr' ? 'Avis Clients' : 'Customer Reviews'} 
          <span className="text-neutral-400 text-sm font-sans">({reviews?.length || 0})</span>
        </h3>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-neutral-300" /></div>
        ) : reviews?.length === 0 ? (
          <p className="text-neutral-500 text-sm italic">
            {language === 'fr' ? "Soyez le premier à donner votre avis." : "Be the first to leave a review."}
          </p>
        ) : (
          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {reviews?.map((review) => (
              <div key={review.id} className="flex gap-3 text-sm">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                    {review.user_name?.charAt(0) || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-neutral-900">{review.user_name || "Anonymous"}</span>
                    <span className="text-xs text-neutral-400">
                      {formatDistanceToNow(new Date(review.created_date), { addSuffix: true, locale })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size={12} readonly />
                  <p className="text-neutral-600 mt-1">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Review */}
      <div className="bg-neutral-50 p-4 rounded-xl space-y-4">
        <h4 className="font-medium text-sm">
            {language === 'fr' ? "Laisser un avis" : "Leave a review"}
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <span className="text-xs text-neutral-500">
                 {language === 'fr' ? "Note :" : "Rating:"}
             </span>
             <StarRating rating={newRating} onRate={setNewRating} size={20} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment" className="sr-only">Comment</Label>
            <Textarea 
              id="comment"
              placeholder={language === 'fr' ? "Partagez votre expérience..." : "Share your experience..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-white text-sm"
            />
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={newRating === 0 || isSubmitting}
            size="sm"
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
            ) : null}
            {language === 'fr' ? "Publier l'avis" : "Post Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}