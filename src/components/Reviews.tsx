
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, Loader2, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Review, UserProfile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Label } from '@/components/ui/label';

const t = {
    reviewsTitle: "التقييمات والمراجعات",
    basedOn: "بناءً على",
    reviewsCount: "مراجعات",
    addReviewTitle: "أضف مراجعتك",
    yourRating: "تقييمك:",
    yourReview: "مراجعتك:",
    reviewPlaceholder: "صف تجربتك مع البائع...",
    submitReview: "إرسال المراجعة",
    sending: "جارٍ الإرسال...",
    loginToReview: "الرجاء تسجيل الدخول لترك مراجعة.",
    cannotReviewSelf: "لا يمكنك تقييم نفسك.",
    reviewRequired: "الرجاء كتابة مراجعة.",
    ratingRequired: "الرجاء اختيار تقييم.",
    reviewSuccess: "شكرًا لمراجعتك!",
    reviewError: "فشل إرسال المراجعة.",
    noReviews: "لا توجد مراجعات حتى الآن. كن أول من يكتب واحدة!",
  };

interface ReviewsProps {
  seller: UserProfile;
}

export default function Reviews({ seller }: ReviewsProps) {
  const { user, userProfile, addReview, getReviews } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dateLocale = ar;

  useEffect(() => {
    const unsubscribe = getReviews(seller.id, setReviews);
    return () => unsubscribe();
  }, [seller.id, getReviews]);

  const handleSubmitReview = async () => {
    if (!user || !userProfile) {
      toast({ title: t.loginToReview, variant: 'destructive' });
      return;
    }
    if (user.uid === seller.id) {
      toast({ title: t.cannotReviewSelf, variant: 'destructive' });
      return;
    }
    if (newRating === 0) {
      toast({ title: t.ratingRequired, variant: 'destructive' });
      return;
    }
    if (!newReviewText.trim()) {
      toast({ title: t.reviewRequired, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await addReview(seller.id, {
        reviewerId: user.uid,
        reviewerName: userProfile.name,
        rating: newRating,
        text: newReviewText,
      });
      toast({ title: t.reviewSuccess });
      setNewRating(0);
      setNewReviewText('');
    } catch (error) {
      console.error(error);
      toast({ title: t.reviewError, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.reviewsTitle}</CardTitle>
        <div className="flex items-center gap-4 text-sm pt-2">
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{seller.rating?.toFixed(1) || 'N/A'}</span>
                <span className="text-xl text-muted-foreground">/ 5</span>
            </div>
            <div className="flex flex-col">
                 <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${(seller.rating || 0) > i + 0.5 ? 'text-yellow-500 fill-yellow-500' : ((seller.rating || 0) > i ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground/30')}`} />
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.basedOn} {seller.reviewCount || 0} {t.reviewsCount}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Separator />

        {/* Add Review Form */}
        {user && user.uid !== seller.id && (
          <div className="space-y-4">
            <h3 className="font-semibold">{t.addReviewTitle}</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.yourRating}</label>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <Star
                      key={ratingValue}
                      className={`h-6 w-6 cursor-pointer transition-colors ${
                        ratingValue <= (hoverRating || newRating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground/30'
                      }`}
                      onClick={() => setNewRating(ratingValue)}
                      onMouseEnter={() => setHoverRating(ratingValue)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="review-text">{t.yourReview}</Label>
                <Textarea
                    id="review-text"
                    placeholder={t.reviewPlaceholder}
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
            <Button onClick={handleSubmitReview} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                 <Send className="mr-2 h-4 w-4" />
                 {t.submitReview}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div key={review.id}>
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>{review.reviewerName?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{review.reviewerName}</p>
                        <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true, locale: dateLocale })}
                        </div>
                    </div>
                     <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
                        ))}
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">{review.text}</p>
                  </div>
                </div>
                {index < reviews.length - 1 && <Separator className="mt-6" />}
              </div>
            ))
          ) : (
             <p className="text-sm text-muted-foreground text-center py-4">{t.noReviews}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
