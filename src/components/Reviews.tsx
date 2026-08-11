
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, Loader2, Send, ThumbsUp, MessageSquare, ChevronDown, LogIn } from 'lucide-react';
import type { Review, UserProfile, Ad } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

const t = {
  reviewsTitle: "التقييمات والمراجعات",
  basedOn: "بناءً على",
  reviewsCount: "مراجعة",
  addReviewTitle: "شارك برأيك وتقييمك",
  yourRating: "تقييمك بالنجوم",
  yourReview: "رأيك وتجربتك",
  reviewPlaceholder: "صف تجربتك بشكل مفصل لمساعدة الآخرين...",
  submitReview: "نشر المراجعة",
  sending: "جارٍ الإرسال...",
  loginToReview: "سجّل الدخول أولاً لترك مراجعة.",
  cannotReviewSelf: "لا يمكنك تقييم ملفك الشخصي.",
  reviewRequired: "الرجاء كتابة مراجعتك.",
  ratingRequired: "الرجاء اختيار تقييمك بالنجوم.",
  reviewSuccess: "شكرًا لمراجعتك! تمت إضافتها بنجاح.",
  reviewError: "حدث خطأ أثناء إرسال المراجعة.",
  noReviews: "لا توجد مراجعات بعد. كن أول من يشارك تجربته!",
  showAll: "عرض كل المراجعات",
  showLess: "عرض أقل",
  ratingLabels: ["", "سيء", "مقبول", "جيد", "جيد جداً", "ممتاز"],
  notRated: "لم يُقيَّم بعد",
};

const INITIAL_SHOW_COUNT = 3;

interface ReviewsProps {
  seller: UserProfile;
  adId?: string;
  ad?: Ad;
}

// Star component used for both display and input
function StarDisplay({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = value >= i;
        const half = !filled && value >= i - 0.5;
        return (
          <Star
            key={i}
            className={`${sizes[size]} transition-colors ${
              filled
                ? 'text-amber-400 fill-amber-400'
                : half
                ? 'text-amber-400 fill-amber-200'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        );
      })}
    </div>
  );
}

// Rating histogram bar (like Google Play)
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-2 text-muted-foreground font-medium">{star}</span>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

export default function Reviews({ seller, adId, ad }: ReviewsProps) {
  const { user, userProfile, addReview, getReviews } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const unsubscribe = getReviews(seller.id, setReviews, adId);
    return () => unsubscribe();
  }, [seller.id, adId, getReviews]);

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
        adId,
      }, ad);
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

  // Compute histogram
  const histogram = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
    reviews.forEach(r => {
      const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
      counts[idx]++;
    });
    return counts;
  }, [reviews]);

  const total = reviews.length;
  const avgRating = adId
    ? (total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : (ad?.rating ?? null))
    : (seller.rating ?? (total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : null));
  const reviewCount = adId ? total : (seller.reviewCount ?? total);

  const visibleReviews = showAll ? reviews : reviews.slice(0, INITIAL_SHOW_COUNT);

  const activeStarCount = hoverRating || newRating;

  return (
    <div className="space-y-6" dir="rtl">

      {/* === Summary Card (Google Play style) === */}
      <div className="rounded-2xl border bg-card shadow-sm p-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {t.reviewsTitle}
        </h2>

        {/* Rating overview */}
        {avgRating !== null && reviewCount > 0 ? (
          <div className="flex gap-6 items-start">
            {/* Left: Big number */}
            <div className="flex flex-col items-center justify-center min-w-[80px]">
              <span className="text-5xl font-extrabold text-foreground leading-none">
                {avgRating.toFixed(1)}
              </span>
              <div className="mt-1.5">
                <StarDisplay value={avgRating} size="sm" />
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {reviewCount.toLocaleString('ar')} {t.reviewsCount}
              </span>
            </div>

            {/* Right: Histogram bars */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => (
                <RatingBar
                  key={star}
                  star={star}
                  count={histogram[star - 1]}
                  total={total}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.notRated}</p>
        )}
      </div>

      {/* === Write a Review Form (Open & ready directly) === */}
      {user && user.uid !== seller.id && (
        <div className="rounded-2xl border bg-card shadow-sm p-5 space-y-5">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            {t.addReviewTitle}
          </h3>

          {/* Interactive stars with label */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t.yourRating}</p>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewRating(star)}
                    className="p-0.5 focus:outline-none group"
                    aria-label={`${star} نجوم`}
                  >
                    <Star
                      className={`h-9 w-9 transition-all duration-150 ${
                        star <= activeStarCount
                          ? 'text-amber-400 fill-amber-400 scale-110'
                          : 'text-slate-300 dark:text-slate-600 hover:text-amber-300 hover:fill-amber-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {activeStarCount > 0 && (
                <span className="text-sm font-semibold text-amber-500 animate-in fade-in duration-150">
                  {t.ratingLabels[activeStarCount]}
                </span>
              )}
            </div>
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t.yourReview}</p>
            <Textarea
              placeholder={t.reviewPlaceholder}
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              className="min-h-[110px] resize-none text-sm rounded-xl focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSubmitReview} disabled={isLoading} className="rounded-xl gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t.submitReview}
                </>
              )}
            </Button>
            {(newRating > 0 || newReviewText.length > 0) && (
              <Button
                variant="ghost"
                onClick={() => { setNewRating(0); setNewReviewText(''); setHoverRating(0); }}
                className="rounded-xl text-muted-foreground"
              >
                مسح
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Prompt for logged-out users */}
      {!user && (
        <div className="p-5 rounded-2xl border border-dashed border-border bg-muted/30 text-center">
          <p className="text-muted-foreground mb-3 font-medium">سجّل دخولك لترك تقييم ومراجعة</p>
          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </Link>
          </Button>
        </div>
      )}

      {/* === Reviews List === */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm">{t.noReviews}</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/60">
              {visibleReviews.map((review) => (
                <div key={review.id} className="px-5 py-5">
                  <div className="flex items-start gap-3.5">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
                      <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                        {review.reviewerName?.[0]?.toUpperCase() || '؟'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-sm text-foreground leading-tight">
                            {review.reviewerName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <StarDisplay value={review.rating} size="sm" />
                            <span className="text-xs text-amber-500 font-medium">
                              {t.ratingLabels[Math.round(review.rating)]}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                          {review.createdAt?.toDate
                            ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true, locale: ar })
                            : ''}
                        </span>
                      </div>

                      {/* Review text */}
                      <p className="text-sm text-foreground/80 mt-2.5 leading-relaxed">
                        {review.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show more / less */}
            {reviews.length > INITIAL_SHOW_COUNT && (
              <div className="border-t px-5 py-3">
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
                  {showAll ? t.showLess : `${t.showAll} (${reviews.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
