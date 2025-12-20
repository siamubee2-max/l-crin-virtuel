import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import StarRating from './StarRating';
import { Loader2, Star, ThumbsUp, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductReviewSection({ itemId, reviews = [] }) {
  const queryClient = useQueryClient();
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const submitReview = useMutation({
    mutationFn: (data) => base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', itemId] });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsWriting(false);
        setSubmitSuccess(false);
        setRating(5);
        setComment("");
      }, 1500);
    }
  });

  const handleSubmit = () => {
    if (rating && comment.trim()) {
      submitReview.mutate({
        jewelry_item_id: itemId,
        rating,
        comment,
        user_name: userName || currentUser?.full_name || "Anonymous"
      });
    }
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {reviews.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="text-center md:text-left">
              <div className="text-5xl font-bold text-neutral-900">{avgRating}</div>
              <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-500 mt-1">{reviews.length} reviews</p>
            </div>

            <div className="flex-1 space-y-2">
              {ratingDistribution.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-neutral-600">{stars} stars</span>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="w-8 text-right text-neutral-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Customer Reviews</h3>
        {!isWriting && (
          <Button variant="outline" size="sm" onClick={() => setIsWriting(true)}>
            Write a Review
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-neutral-50 rounded-xl p-6 space-y-4 border">
              {submitSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium text-green-800">Thank you for your review!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Rating</label>
                    <StarRating rating={rating} onRate={setRating} size={24} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Name</label>
                    <Input 
                      value={userName || currentUser?.full_name || ''} 
                      onChange={(e) => setUserName(e.target.value)} 
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Review</label>
                    <Textarea 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)} 
                      placeholder="Share your experience with this product..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setIsWriting(false)}>Cancel</Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitReview.isPending || !comment.trim()}
                      className="bg-neutral-900 hover:bg-neutral-800"
                    >
                      {submitReview.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Review
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed">
          <Star className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-neutral-500">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <span className="text-amber-700 font-medium text-sm">
                    {(review.user_name || "A")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-neutral-900">{review.user_name || "Anonymous"}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
                          />
                        ))}
                        <span className="text-xs text-neutral-400 ml-2">Verified Purchase</span>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400">
                      {new Date(review.created_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <p className="text-neutral-600 text-sm leading-relaxed">{review.comment}</p>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
                    <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
                      <ThumbsUp className="w-3.5 h-3.5" /> Helpful
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}