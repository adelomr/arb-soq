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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// بيانات متجر ملابس حريمي خليجي الافتراضي (20 منتج فاخر)
export const DEMO_GULF_STORE: UserProfile & { id: string } = {
  id: 'gulf-fashion-store-demo',
  name: 'دار الشيخة للأزياء والعبايات الخليجية',
  email: 'gulf.fashion@arb-soq.com',
  phone: '+966501234567',
  country: 'السعودية',
  city: 'الرياض',
  province: 'منطقة الرياض',
  village: 'حي العليا',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  verified: true,
  role: 'user',
  status: 'active',
  walletBalance: 0,
  rating: 4.9,
  reviewCount: 128,
  store: {
    id: 'store-gulf-01',
    storeName: 'دار الشيخة للأزياء والعبايات الخليجية',
    storeDescription: 'أرقى تشكيلة من العبايات الخليجية الفاخرة، المخاوير الإماراتية، الجلابيات الكويتية، وفساتين الاستقبال والمناسبات بتصاميم تجمع بين الأصالة والفخامة العصرية. شحن لجميع دول الخليج والدول العربية.',
    coverImageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
    ownerId: 'gulf-fashion-store-demo',
  },
};

export const DEMO_GULF_PRODUCTS: Ad[] = [
  {
    id: 'gulf-prod-01',
    userId: 'gulf-fashion-store-demo',
    title: 'عباية ملكية كريب كوري أسود مطرزة يدوياً بالشك الفضي',
    description: 'عباية كلاسيكية راقية مصنوعة من الكريب الكوري الفاخر المسامي، مزينة بتطريز شك يدوي ناعم على الأكمام، تأتي مع طرحة مجانية متناسقة.',
    price: 380,
    category: 'fashion',
    subcategory: 'عبايات',
    imageUrls: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 340,
    clicks: 85,
    isPromoted: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 32,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-02',
    userId: 'gulf-fashion-store-demo',
    title: 'مخور إماراتي حرير طبيعي بتطريز تلي وزري أصلي',
    description: 'مخور إماراتي أصيل مصنوع من أجود خامات الحرير مع تطريز التلي الذهبي التراثي المتقن للمناسبات والأعياد.',
    price: 450,
    category: 'fashion',
    subcategory: 'مخاوير',
    imageUrls: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 412,
    clicks: 96,
    isPromoted: true,
    isFeatured: true,
    rating: 5.0,
    reviewCount: 41,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-03',
    userId: 'gulf-fashion-store-demo',
    title: 'جلابية استقبال كويتية مطرزة بالخيوط الذهبية واللؤلؤ',
    description: 'جلابية واسعة مريحة وراقية بتطريزات فخمة مناسبة للاستقبال والعزائم، قماش بارد وناعم غير شفاف.',
    price: 290,
    category: 'fashion',
    subcategory: 'جلابيات',
    imageUrls: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 290,
    clicks: 72,
    isPromoted: false,
    rating: 4.8,
    reviewCount: 22,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-04',
    userId: 'gulf-fashion-store-demo',
    title: 'عباية بشت خليجي مفتوحة بقماش الكتان ولون كحلي ملكي',
    description: 'قصة بشت عصرية فضفاضة تمنحك إطلالة مهيبة، خامة كتان فاخرة تناسب العمل والمناسبات الرسمية.',
    price: 340,
    category: 'fashion',
    subcategory: 'عبايات',
    imageUrls: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 310,
    clicks: 68,
    isPromoted: false,
    rating: 4.7,
    reviewCount: 19,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-05',
    userId: 'gulf-fashion-store-demo',
    title: 'فستان سهرة خليجي راقي شيفون مطرز للأعراس',
    description: 'فستان سهرة فخم بطبقات الشيفون الانسيابية مع حزام خصر مطرز بالكريستال اللامع وبطانة كاملة مريحة.',
    price: 520,
    category: 'fashion',
    subcategory: 'فساتين',
    imageUrls: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 520,
    clicks: 140,
    isPromoted: true,
    rating: 5.0,
    reviewCount: 38,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-06',
    userId: 'gulf-fashion-store-demo',
    title: 'عباية كتف دبل كلوش بأكمام جاكار وتصميم عصري',
    description: 'عباية واسعة مريحة دبل كلوش تمنحك حرية الحركة مع أكمام منسوجة بنقوش الجاكار الراقية.',
    price: 310,
    category: 'fashion',
    subcategory: 'عبايات',
    imageUrls: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 215,
    clicks: 50,
    isPromoted: false,
    rating: 4.6,
    reviewCount: 14,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-07',
    userId: 'gulf-fashion-store-demo',
    title: 'مخور كويتي قطن فاخر مطرز بنقوش تراثية ناعمة',
    description: 'قطن كويتي 100% عالي الجودة ومريح جداً للأجواء الصيفية مع تطريز صدري ناعم وثابت.',
    price: 240,
    category: 'fashion',
    subcategory: 'مخاوير',
    imageUrls: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 180,
    clicks: 42,
    isPromoted: false,
    rating: 4.8,
    reviewCount: 11,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-08',
    userId: 'gulf-fashion-store-demo',
    title: 'جلابية خليجية ميدي قطعتين بتطريز يدوي أنيق',
    description: 'تصميم مبتكر من قطعتين فستان داخلي مع كيب علوي شفاف ومطرز بتفاصيل جذابة.',
    price: 275,
    category: 'fashion',
    subcategory: 'جلابيات',
    imageUrls: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 245,
    clicks: 61,
    isPromoted: false,
    rating: 4.9,
    reviewCount: 20,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-09',
    userId: 'gulf-fashion-store-demo',
    title: 'عباية ملونة حرير مغسول لون زمردي داكن مع طرحة',
    description: 'لمسة من التميز بألوان هادئة ومحتشمة، خامة حرير مغسول ناعم جداً وخفيف وبارد.',
    price: 360,
    category: 'fashion',
    subcategory: 'عبايات',
    imageUrls: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 390,
    clicks: 98,
    isPromoted: false,
    rating: 4.9,
    reviewCount: 29,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-10',
    userId: 'gulf-fashion-store-demo',
    title: 'ثوب نشل بحريني تراثي مطرز بزري ذهبي أصيل',
    description: 'القطعة التراثية الخليجية الأشهر للمناسبات التراثية والاحتفالات، مطرز بالكامل بنقشات أصيلة.',
    price: 590,
    category: 'fashion',
    subcategory: 'فساتين',
    imageUrls: ['https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 450,
    clicks: 110,
    isPromoted: false,
    rating: 5.0,
    reviewCount: 35,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-11',
    userId: 'gulf-fashion-store-demo',
    title: 'قفطان شرقي خليجي مطرز بالسفيفة والعقد اليدوية',
    description: 'قفطان فخم بخامة كريب حريري مع حزام مميز وتطريز على طول الياقة والأكمام.',
    price: 430,
    category: 'fashion',
    subcategory: 'جلابيات',
    imageUrls: ['https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 320,
    clicks: 74,
    isPromoted: false,
    rating: 4.8,
    reviewCount: 18,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-12',
    userId: 'gulf-fashion-store-demo',
    title: 'عباية رأس خليجية قماش كريب سعودي سوبر ساتر',
    description: 'عباية رأس سابغة بقماش فاخر لا يشف وخفيف على الرأس بدون أن ينزلق مع ربطة مطاطية مريحة.',
    price: 250,
    category: 'fashion',
    subcategory: 'عبايات',
    imageUrls: ['https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 280,
    clicks: 65,
    isPromoted: false,
    rating: 4.7,
    reviewCount: 16,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-13',
    userId: 'gulf-fashion-store-demo',
    title: 'دراعة كويتية بتصميم كاجوال ناعم للمنزل والزيارات',
    description: 'خفيفة ومريحة وأنيقة في آن واحد، خامة قطنية مسامية بألوان ربيعية هادئة.',
    price: 195,
    category: 'fashion',
    subcategory: 'جلابيات',
    imageUrls: ['https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 195,
    clicks: 44,
    isPromoted: false,
    rating: 4.6,
    reviewCount: 12,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-14',
    userId: 'gulf-fashion-store-demo',
    title: 'عباية كتان كاجوال بأكمام مزمومة وجيوب مخفية',
    description: 'العباية المثالية للمشاوير والدوام اليومي، عملية وخفيفة مع تفاصيل زم على الأساور وجيوب عميقة.',
    price: 280,
    category: 'fashion',
    subcategory: 'عبايات',
    imageUrls: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 260,
    clicks: 58,
    isPromoted: false,
    rating: 4.8,
    reviewCount: 17,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-15',
    userId: 'gulf-fashion-store-demo',
    title: 'فستان جلابية شيفون مطبع بنقوش ورود راقية وألوان زاهية',
    description: 'مزيج ساحر بين الفستان العصري والجلابية الشرقية، قماش شيفون مطبوع مع بطانة ناعمة وحزام خصر.',
    price: 220,
    category: 'fashion',
    subcategory: 'فساتين',
    imageUrls: ['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 310,
    clicks: 70,
    isPromoted: false,
    rating: 4.7,
    reviewCount: 21,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-16',
    userId: 'gulf-fashion-store-demo',
    title: 'عباية فراشة وسيعة قماش صالونا ياباني أسود فاحم',
    description: 'قصة الفراشة الشهيرة المحبوبة، قماش صالونا ياباني أسود فاحم لا يبهت ولا يحتاج كوي متكرر.',
    price: 330,
    category: 'fashion',
    subcategory: 'عبايات',
    imageUrls: ['https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 290,
    clicks: 66,
    isPromoted: false,
    rating: 4.9,
    reviewCount: 25,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-17',
    userId: 'gulf-fashion-store-demo',
    title: 'مخور عماني أصيل بتطريز يدوي متقن وخيوط بريسم',
    description: 'قماش حرير قطني عماني مطرز يدوياً بنقشات بريسم كلاسيكية مع لمعة خفيفة تضفي فخامة استثنائية.',
    price: 410,
    category: 'fashion',
    subcategory: 'مخاوير',
    imageUrls: ['https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 240,
    clicks: 52,
    isPromoted: false,
    rating: 4.8,
    reviewCount: 15,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-18',
    userId: 'gulf-fashion-store-demo',
    title: 'شيلة خليجية ليزر فاخرة بشك طرفين وتطريز ناعم',
    description: 'طرحة وشيلة قماش ليزر ياباني ثابت غير قابل للانزلاق، مطرزة على الطرفين بشك يدوي ناعم.',
    price: 95,
    category: 'fashion',
    subcategory: 'شيل وطرح',
    imageUrls: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 160,
    clicks: 38,
    isPromoted: false,
    rating: 4.9,
    reviewCount: 30,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-19',
    userId: 'gulf-fashion-store-demo',
    title: 'عباية مطرزة بالدانتيل الفرنسي الفاخر على الأكمام',
    description: 'عباية كريب لمسة حرير مع دانتيل فرنسي راقي على أطراف الأكمام والياقة لإطلالة مفعمة بالأنوثة.',
    price: 370,
    category: 'fashion',
    subcategory: 'عبايات',
    imageUrls: ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 375,
    clicks: 88,
    isPromoted: false,
    rating: 4.9,
    reviewCount: 27,
    postedAt: new Date().toISOString(),
  },
  {
    id: 'gulf-prod-20',
    userId: 'gulf-fashion-store-demo',
    title: 'طقم جلابية أم وبنتها مطرزة متناسقة للأعياد والمناسبات',
    description: 'طقم قطعتين متناسقتين للأم والابنة بتطريز زري ذهبي ناعم وخامة باردة مريحة ومبهجة للأعياد.',
    price: 480,
    category: 'fashion',
    subcategory: 'جلابيات',
    imageUrls: ['https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=80'],
    condition: 'new',
    market: 'sa',
    currency: 'SAR',
    adType: 'sell-item',
    status: 'active',
    views: 480,
    clicks: 125,
    isPromoted: false,
    rating: 5.0,
    reviewCount: 44,
    postedAt: new Date().toISOString(),
  },
];

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

  const handleShareStore = () => {
    if (navigator.share) {
      navigator.share({
        title: storeData?.store?.storeName || 'متجر دار الشيخة',
        text: 'تسوقي أرقى العبايات والجلابيات الخليجية عبر سوق العرب',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'تم نسخ رابط المتجر بنجاح 📋' });
    }
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
                <Button
                  onClick={handleShareStore}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs sm:text-sm h-10 px-3.5 rounded-xl gap-1.5 border border-white/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">مشاركة</span>
                </Button>
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
                    {/* صورة المنتج */}
                    <div className="relative w-full aspect-[4/5] bg-muted overflow-hidden">
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* شارات المنتج */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1">
                        {product.subcategory && (
                          <Badge className="bg-primary/90 backdrop-blur-md text-primary-foreground font-bold text-[10px] px-2 py-0.5 border-none">
                            {product.subcategory}
                          </Badge>
                        )}
                        {product.isPromoted && (
                          <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 border-none">
                            مميز
                          </Badge>
                        )}
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
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {product.title}
                        </h3>
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
