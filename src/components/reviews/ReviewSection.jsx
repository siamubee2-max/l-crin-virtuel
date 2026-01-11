import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/apiClient';
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
  const [sortBy, setSortBy] = useState("newest");

  // Fetch reviews for this item
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', jewelryId],
    queryFn: () => base44.entities.Review.filter({ jewelry_item_id: jewelryId }, '-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Check if user has an active subscription (simplified check)
  const isSubscribed = !!user; // For now, any logged-in user can review

  // Check if user has purchased this item
  const { data: userOrders } = useQuery({
    queryKey: ['userOrders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user?.email }),
    enabled: !!user?.email,
  });

  const hasPurchased = useMemo(() => {
    return userOrders?.some(order => order.item_id === jewelryId && order.status !== 'cancelled');
  }, [userOrders, jewelryId]);

  // Check if user already reviewed
  const hasAlreadyReviewed = useMemo(() => {
    return reviews?.some(r => r.created_by === user?.email);
  }, [reviews, user?.email]);

  // Sort reviews
  const sortedReviews = useMemo(() => {
    if (!reviews) return [];
    const sorted = [...reviews];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      case "oldest":
        return sorted.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  // Need to fetch the jewelry item to get the owner ID for notification
  const { data: jewelryItem } = useQuery({
    queryKey: ['jewelryItem', jewelryId],
    queryFn: () => base44.entities.JewelryItem.list().then(items => items.find(i => i.id === jewelryId)),
    enabled: !!jewelryId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Create review with verified_purchase flag
      await base44.entities.Review.create({
        ...data,
        verified_purchase: hasPurchased
      });
      
      // Create notification for owner (if owner is not self)
      if (jewelryItem?.created_by && jewelryItem.created_by !== user?.email) {
          const users = await base44.entities.User.list();
          const owner = users.find(u => u.email === jewelryItem.created_by);
          
          if (owner) {
             await base44.entities.Notification.create({
                recipient_id: owner.id,
                title: "New Review",
                message: `${user?.full_name || "Someone"} reviewed your item "${jewelryItem.name}"`,
                type: "review",
                related_item_id: jewelryItem.id,
                link: `/JewelryBox?item=${jewelryItem.id}`
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

  // Calculate average rating
  const avgRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-serif font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> 
            {language === 'fr' ? 'Avis Clients' : 'Customer Reviews'} 
            <span className="text-neutral-400 text-sm font-sans">({reviews?.length || 0})</span>
          </h3>
          {reviews?.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={avgRating} size={14} readonly />
              <span className="text-sm text-neutral-600">{avgRating.toFixed(1)} / 5</span>
            </div>
          )}
        </div>
        
        {reviews?.length > 1 && (
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{language === 'fr' ? 'Plus récents' : 'Newest'}</SelectItem>
              <SelectItem value="oldest">{language === 'fr' ? 'Plus anciens' : 'Oldest'}</SelectItem>
              <SelectItem value="highest">{language === 'fr' ? 'Meilleures notes' : 'Highest rated'}</SelectItem>
              <SelectItem value="lowest">{language === 'fr' ? 'Notes les plus basses' : 'Lowest rated'}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-neutral-300" /></div>
        ) : sortedReviews.length === 0 ? (
          <p className="text-neutral-500 text-sm italic">
            {language === 'fr' ? "Soyez le premier à donner votre avis." : "Be the first to leave a review."}
          </p>
        ) : (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {sortedReviews.map((review) => (
              <div key={review.id} className="flex gap-3 text-sm bg-white p-3 rounded-lg border border-neutral-100">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                    {review.user_name?.charAt(0) || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-start flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">{review.user_name || "Anonymous"}</span>
                      {review.verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          <BadgeCheck className="w-3 h-3" /> 
                          {language === 'fr' ? 'Achat vérifié' : 'Verified'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400">
                      {formatDistanceToNow(new Date(review.created_date), { addSuffix: true, locale })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size={12} readonly />
                  {review.comment && <p className="text-neutral-600 mt-1">{review.comment}</p>}
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
        
        {!user ? (
          <div className="text-center py-4 space-y-2">
            <Lock className="w-8 h-8 mx-auto text-neutral-300" />
            <p className="text-sm text-neutral-500">
              {language === 'fr' ? "Connectez-vous pour laisser un avis" : "Sign in to leave a review"}
            </p>
          </div>
        ) : hasAlreadyReviewed ? (
          <div className="text-center py-4 space-y-2">
            <BadgeCheck className="w-8 h-8 mx-auto text-green-400" />
            <p className="text-sm text-neutral-500">
              {language === 'fr' ? "Vous avez déjà donné votre avis" : "You already reviewed this item"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {hasPurchased && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                <ShoppingBag className="w-3 h-3" />
                {language === 'fr' ? "Vous avez acheté ce produit" : "You purchased this item"}
              </div>
            )}
            
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
        )}
      </div>
    </div>
  );
}