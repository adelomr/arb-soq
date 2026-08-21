'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import type { Ad, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Store,
  MapPin,
  Star,
  BadgeCheck,
  MessageCircle,
  Share2,
  Search,
  ShoppingCart,
  PlusCircle,
  Sparkles,
  Check,
  Facebook,
  Twitter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { DEMO_GULF_STORE, DEMO_GULF_PRODUCTS } from '@/lib/demo-gulf-store';

const WhatsappShareIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor">
    <path d="M17.472 14.382c-.022-.08-.115-.188-.417-.329-.3-.14-1.778-.877-2.037-.972-.26-.095-.448-.142-.642.148-.193.29-.749.972-.919 1.162-.17.19-.34.21-.641.07-.3-.14-1.272-.468-2.423-1.493-.895-.8-1.5-1.787-1.675-2.09-.175-.3-.018-.463.132-.613.136-.135.3-.35.45-.524.15-.175.2-.292.3-.487.1-.197.05-.369-.025-.51-.07-.14-.642-1.547-.882-2.128-.233-.564-.47-.488-.642-.496-.166-.008-.356-.01-.546-.01-.19 0-.5.07-.76.357-.26.29-1 .975-1 2.378 0 1.4 1.01 2.75 1.15 2.94.14.19 1.98 3.03 4.8 4.24.67.29 1.2.46 1.61.59.67.21 1.28.18 1.76.11.53-.08 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.19-.56-.33zM12.002 2c-5.523 0-10 4.477-10 10 0 1.778.463 3.507 1.345 5.032L2 22l5.132-1.347c1.472.8 3.12 1.222 4.87 1.222 5.523 0 10-4.477 10-10s-4.477-10-10-10z"/>
  </svg>
);


export default function StoreClient({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const { getUserStore } = useAuth();
  const { cart, addToCart } = useCart();

  const [storeData, setStoreData] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      try {
        if (storeId === 'gulf-fashion-store-demo' || storeId === 'demo-gulf-fashion-store') {
          setStoreData(DEMO_GULF_STORE);
          setProducts(DEMO_GULF_PRODUCTS);
        } else {
          // Attempt loading from Firestore store
          const storeFromDb = await getUserStore(storeId);
          if (storeFromDb) {
            setStoreData({
              ...DEMO_GULF_STORE,
              id: storeId,
              store: storeFromDb,
            });
            setProducts(DEMO_GULF_PRODUCTS);
          } else {
            setStoreData(DEMO_GULF_STORE);
            setProducts(DEMO_GULF_PRODUCTS);
          }
        }
      } catch {
        setStoreData(DEMO_GULF_STORE);
        setProducts(DEMO_GULF_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [storeId, getUserStore]);

  const subcategories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.subcategory) list.add(p.subcategory);
    });
    return Array.from(list);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          !searchQuery ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSubcategory =
          selectedSubcategory === 'all' || p.subcategory === selectedSubcategory;

        return matchesSearch && matchesSubcategory;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
        return (b.views || 0) - (a.views || 0);
      });
  }, [products, searchQuery, selectedSubcategory, sortBy]);

  const handleAddToCart = (product: Ad) => {
    addToCart(product);
    toast({
      title: 'تمت الإضافة للسلة 🛍️',
      description: `تمت إضافة "${product.title}" إلى سلة المشتريات.`,
    });
  };

  const handleWhatsAppOrder = (product: Ad) => {
    const phone = storeData?.phone || '+966501234567';
    const text = encodeURIComponent(
      `مرحباً، أود طلب هذا المنتج من متجر دار الشيخة عبر سوق العرب:\n\n*${product.title}*\nالسعر: ${product.price} ر.س\nالرابط: ${window.location.href}`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const [shareOpen, setShareOpen] = useState(false);

  const getShareUrl = () => typeof window !== 'undefined' ? window.location.href : '';

  const getProductShareUrl = (product: Ad) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/ad/${product.userId}/${product.id}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const store = storeData?.store || DEMO_GULF_STORE.store!;

  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      <Header />

      <main className="flex-1 pb-16">
        {/* ================= 1. غلاف وبنر المتجر الفاخر ================= */}
        <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-muted overflow-hidden">
          <Image
            src={store.coverImageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200'}
            alt={store.storeName}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

          {/* محتوى البنر في الأسفل */}
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-8">
            <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-background shadow-2xl bg-card">
                  <AvatarImage src={storeData?.avatarUrl} alt={store.storeName} />
                  <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                    {store.storeName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-headline drop-shadow-md">
                      {store.storeName}
                    </h1>
                    <Badge className="bg-blue-500 text-white font-bold text-xs gap-1 px-2 py-0.5 border-none shadow-sm">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>متجر موثق</span>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-200 flex-wrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{storeData?.city || 'الرياض'}، {storeData?.country || 'المملكة العربية السعودية'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Star className="w-4 h-4 fill-yellow-400" />
                      <span>4.9 (128 تقييم)</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-300">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span>20 منتج حصري</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* أزرار التفاعل والمشاركة في البنر */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    const phone = storeData?.phone || '+966501234567';
                    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
                  }}
                  className="flex-1 sm:flex-initial bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm h-10 px-4 rounded-xl gap-2 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تواصل واتساب</span>
                </Button>

                {/* زر المشاركة مع قائمة منسدلة */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs sm:text-sm h-10 px-3.5 rounded-xl gap-1.5 border border-white/20"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">مشاركة</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-right min-w-[150px]">
                    <DropdownMenuItem asChild>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 cursor-pointer justify-end"
                      >
                        <span>فيسبوك</span>
                        <Facebook className="h-4 w-4 text-blue-600" />
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(storeData?.store?.storeName || 'متجر سوق العرب')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 cursor-pointer justify-end"
                      >
                        <span>تويتر / X</span>
                        <Twitter className="h-4 w-4" />
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(storeData?.store?.storeName || 'متجر سوق العرب')}%20${encodeURIComponent(getShareUrl())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 cursor-pointer justify-end"
                      >
                        <span>واتساب</span>
                        <WhatsappShareIcon />
                      </a>
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. وصف المتجر وشريط الفلاتر ================= */}
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* كرت وصف المتجر */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
              {store.storeDescription}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/cart">
                <Button variant="outline" className="h-10 px-4 rounded-xl border-primary/30 text-primary font-bold text-xs gap-2 relative">
                  <ShoppingCart className="w-4 h-4" />
                  <span>عرض السلة</span>
                  {cart.length > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-black rounded-full px-1.5 py-0.5">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* تبويبات الأقسام الفرعية */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                selectedSubcategory === 'all'
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>جميع الأزياء (20)</span>
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0",
                  selectedSubcategory === sub
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* شريط البحث والترتيب */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحثي في أزياء وعبايات المتجر..."
                className="h-10 text-xs sm:text-sm pr-9 rounded-xl"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-muted-foreground whitespace-nowrap">الترتيب:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-10 px-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="featured">الأكثر طلباً والشهرة</option>
                <option value="price-asc">الأقل سعراً</option>
                <option value="price-desc">الأعلى سعراً</option>
              </select>
            </div>
          </div>

          {/* ================= 3. شبكة المنتجات الـ 20 ================= */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const isInCart = cart.some((item) => item.id === product.id);

                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden rounded-2xl border-border/80 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group flex flex-col bg-card"
                  >
                    {/* صورة المنتج مع رابط لصفحة التفاصيل المنفصلة */}
                    <div className="relative w-full aspect-[4/5] bg-muted overflow-hidden">
                      <Link href={`/ad/${product.userId}/${product.id}`} className="block w-full h-full">
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>

                      {/* شارات المنتج */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 pointer-events-none">
                        {product.subcategory && (
                          <Badge className="bg-primary/90 backdrop-blur-md text-primary-foreground font-bold text-[10px] px-2 py-0.5 border-none shadow-sm">
                            {product.subcategory}
                          </Badge>
                        )}
                        {product.isPromoted && (
                          <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 border-none shadow-sm">
                            مميز
                          </Badge>
                        )}
                      </div>

                      {/* زر مشاركة المنتج العائم أعلى يسار الصورة */}
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 rounded-full bg-background/85 hover:bg-background backdrop-blur-md border border-border/60 shadow-md text-foreground/80 hover:text-primary transition-all active:scale-95"
                              aria-label="مشاركة المنتج"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="text-right min-w-[150px] z-50">
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getProductShareUrl(product))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 cursor-pointer justify-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>فيسبوك</span>
                                <Facebook className="h-4 w-4 text-blue-600" />
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getProductShareUrl(product))}&text=${encodeURIComponent(product.title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 cursor-pointer justify-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>تويتر / X</span>
                                <Twitter className="h-4 w-4" />
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(product.title)}%20${encodeURIComponent(getProductShareUrl(product))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 cursor-pointer justify-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>واتساب</span>
                                <WhatsappShareIcon />
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleWhatsAppOrder(product)}
                          className="h-8 px-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-lg gap-1 shadow-md"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>طلب واتساب</span>
                        </Button>
                      </div>
                    </div>

                    {/* تفاصيل المنتج */}
                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <Link href={`/ad/${product.userId}/${product.id}`} className="block">
                          <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">السعر</span>
                          <span className="text-base font-black text-primary">
                            {product.price} <span className="text-xs font-bold">ر.س</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* زر مشاركة إضافي بجانب السلة */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 rounded-xl border-border/80 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                                aria-label="مشاركة المنتج"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-right min-w-[150px] z-50">
                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getProductShareUrl(product))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 cursor-pointer justify-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>فيسبوك</span>
                                  <Facebook className="h-4 w-4 text-blue-600" />
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getProductShareUrl(product))}&text=${encodeURIComponent(product.title)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 cursor-pointer justify-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>تويتر / X</span>
                                  <Twitter className="h-4 w-4" />
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(product.title)}%20${encodeURIComponent(getProductShareUrl(product))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 cursor-pointer justify-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>واتساب</span>
                                  <WhatsappShareIcon />
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* زر إضافة إلى السلة */}
                          <Button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={isInCart}
                            className={cn(
                              "h-9 px-3.5 rounded-xl font-bold text-xs transition-all gap-1.5 shadow-sm",
                              isInCart
                                ? "bg-muted text-muted-foreground hover:bg-muted"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                          >
                            {isInCart ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-primary" />
                                <span>في السلة</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>أضف للسلة</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border p-8 space-y-3">
              <Store className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">لا توجد منتجات مطابقة للبحث</h3>
              <p className="text-xs text-muted-foreground">جربي البحث بكلمات أخرى أو تصفحي كافة الأقسام.</p>
              <Button onClick={() => { setSearchQuery(''); setSelectedSubcategory('all'); }} variant="outline" size="sm" className="rounded-xl text-xs">
                إعادة ضبط الفلاتر
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* زر سلة التسوق العائم في صفحات المتجر */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-4 z-40">
          <Link href="/cart">
            <Button className="h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border-2 border-background">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold text-xs">سلة التسوق ({cart.length})</span>
            </Button>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
}
