

'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/lib/types';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Briefcase, Phone, Star, Loader2, RefreshCcw, ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PortfolioManager from '@/components/PortfolioManager';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { AdPlaceholder, AdPlaceholderSquare } from '@/components/Adsense';
import Reviews from '@/components/Reviews';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const WhatsappIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <path fill="currentColor" d="M16.75 13.96c.25.13.43.2.5.28.08.08.13.18.15.25.03.08.03.15.03.18 0 .03-.03.05-.03.08-.02.02-.03.05-.05.07-.02.02-.05.05-.07.07-.02.02-.05.03-.07.05-.02.02-.05.05-.08.07-.03.02-.05.05-.08.07-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.1.08c-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.12.08c-.03.03-.07.05-.12.08-.05.03-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.03-.15.05-.05.02-.1.03-.15.05-.05.02-.1.03-.17.05-.07.02-.13.03-.2.05-.07.02-.15.03-.22.05-.07.02-.15.03-.22.05-.07.02-.15.03-.23.03-.08 0-.17-.02-.25-.03-.08-.02-.17-.03-.25-.05-.08-.02-.17-.03-.25-.05-.08-.02-.17-.05-.25-.07-.08-.02-.17-.05-.25-.08-.08-.03-.17-.05-.25-.08-.08-.03-.17-.07-.25-.1-.08-.03-.17-.07-.25-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.22-.1-.07-.03-.13-.07-.2-.1-.03-.02-.05-.03-.07-.05-.43-.2-1.03-.48-1.7-1.15-.65-.65-1.03-1.4-1.1-1.58-.02-.03-.03-.07-.05-.1-.02-.03-.03-.07-.05-.1v-.1c0-.02.02-.03.03-.05.02-.02.03-.03.05-.05.02-.02.05-.03.08-.05.03-.02.07-.03.1-.05.03-.02.07-.03.1-.05.03-.02.05-.03.08-.05.03-.02.05-.03.08-.05.03-.02.05-.03.07-.03.02 0 .05-.02.07-.02.02 0 .05-.02.07-.02.02 0 .05 0 .07.02.02 0 .05.02.07.03.02.02.05.03.07.05.02.02.05.05.07.07l.08.08c.03.03.05.05.07.08.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.05.05.08.02.03.03.05.05.08.02.03.03.05.05.08.03.05.05.08.07.12.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.07.05.1s.05.07.07.1c.02.03.05.07.07.1.02.03.05.07.07.1.02.03.05.07.07.1.07.12.18.23.32.33.13.1.28.18.43.25.15.07.3.12.45.15.15.03.3.05.45.05.15 0 .3-.02.45-.05.15-.03.3-.08.45-.15.15-.07.28-.15.42-.25.13-.1.25-.2.35-.33.05-.05.1-.12.13-.2.03-.08.05-.17.05-.25s-.02-.17-.05-.25c-.03-.08-.08-.15-.13-.2-.1-.1-.2-.18-.32-.25-.12-.08-.25-.13-.4-.18-.13-.05-.27-.08-.4-.08-.13 0-.27.03-.4.08s-.25.13-.38.2c-.12.08-.23.15-.35.23-.12.08-.23.17-.33.25-.1.08-.2.17-.28.25-.08.08-.15.17-.22.25-.07.08-.13.17-.18.25-.05.08-.1.17-.12.25-.02.08-.03.17-.03.25s.02.17.03.25c.02.08.05.15.08.22.03.07.08.13.12.18.05.05.1.1.15.15.05.05.1.1.15.15l.15.12c.05.03.1.07.15.1.05.03.1.07.15.1.05.03.1.07.15.1.1.07.2.13.3.18.1.05.2.1.3.15.1.05.2.1.3.15.2.1.2.18.2.25V12c0-2.1-1.2-3.96-3-4.9.15-.3.23-.62.23-.95 0-.75-.4-1.4-1.03-1.75.28-.43.43-.93.43-1.45 0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 .52.15 1.02.43 1.45-.63.35-1.03 1-1.03 1.75 0 .33.08.65.23.95-1.8 1-3 2.8-3 4.9v.05c0 .07.02.13.05.18.1.05.2.1.3.15s.2.1.3.15c.1.05.2.1.3.15.1.05.2.08.3.13.1.05.2.1.3.15.1.05.2.1.3.15.08.05.15.1.22.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15l.38.22c.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.05.2.08.07.03.13.05.2.08.07.03.13.05.2.08.13.05.27.08.4.1.13.03.27.03.4 0 .13-.02.27-.03.4-.02.13-.05.27-.08.4-.03.13-.08.25-.13.38-.05.12-.1.25-.18.38-.08.12-.17.23-.25.33-.08.1-.18.2-.28.28-.1.08-.2.17-.3.25-.1.08-.2.17-.3.25-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23l-.3.23c-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.15.15-.28.3-.4.45-.12.15-.22.3-.3.45-.08.15-.13.3-.15.45-.02.15-.03.3-.03.45s.02.3.03.45c.02.15.07.3.15.45.08.15.18.3.3.45.12.15.25.3.4.45.15.15.3.28.45.42.15.13.3.25.45.35.15.1.32.18.5.23.18.05.37.08.55.08.18 0 .37-.03.55-.08.18-.05.35-.13.5-.23.15-.1.3-.22.45-.35.15-.13.28-.28.42-.42.13-.15.25-.3.35-.45.1-.15.18-.3.23-.45.05-.15.08-.3.08-.45s-.03-.3-.08-.45c-.05-.15-.13-.3-.23-.45-.1-.15-.22-.3-.35-.45s-.28-.28-.42-.42c-.15-.13-.3-.25-.45-.38-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35l-.23-.17c-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33l-.2-.17c-.15-.12-.28-.23-.4-.35-.12-.12-.23-.23-.33-.35-.1-.1-.2-.2-.28-.3-.08-.1-.17-.2-.25-.28-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25l-.25-.25c-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25l-.45-.5c-.08-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25l-.22-.25c-.07-.08-.15-.17-.22-.25L3.83 6.08l-.22-.25c-.07-.08-.15-.17-.22-.25C3.3 5.5 3.22 5.4 3.14 5.33c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23l-.25-.25c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23C1.6 3.9 1.5 3.82 1.43 3.73c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25L0 2.7l-.22-.25c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25C12.5.02 12.25 0 12 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.63 0 12-5.37 12-12v-.08c-.03-.08-.05-.15-.08-.22-.03-.07-.05-.13-.08-.2Z"/>
  </svg>
)

const translations = {
  ar: {
    workerNotFound: "العامل غير موجود",
    workerNotFoundDesc: "عذراً، لم نتمكن من العثور على ملف العامل الذي تبحث عنه.",
    loading: "جارٍ التحميل...",
    callSeller: 'اتصل بالعامل',
    messageOnWhatsapp: 'مراسلة عبر واتساب',
    phoneNotAvailable: 'رقم الهاتف غير متاح',
    noRating: 'لا يوجد تقييم بعد',
    reviewsCount: 'مراجعات',
    basedOn: 'بناءً على',
    portfolio: 'معرض الأعمال',
    location: 'الموقع',
    updateLocation: 'تحديث الموقع',
    locating: 'جارٍ تحديد الموقع...',
    locationFailed: 'فشل تحديد الموقع',
    locationSuccess: 'تم تحديث الموقع بنجاح',
    locationNotSupported: "خدمات الموقع الجغرافي غير مدعومة في هذا المتصفح.",
    locationPermissionDenied: "لقد رفضت طلب تحديد الموقع الجغرافي.",
    locationUnavailable: "معلومات الموقع غير متاحة.",
    locationTimeout: "انتهت مهلة طلب تحديد الموقع.",
    unknownLocationError: "حدث خطأ غير معروف.",
    locationConvertFailed: "لا يمكن تحويل الإحداثيات إلى موقع. الرجاء المحاولة مرة أخرى.",
    backToMarket: 'العودة إلى السوق',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
  },
};

export default function WorkerPage() {
  const params = useParams();
  const { userId } = params as { userId: string };
  const { user, getUserById, userProfile, refreshUserProfile, updateUserProfile, professions } = useAuth();
  const t = translations.ar;
  const { toast } = useToast();

  const [worker, setWorker] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [isSavingManualLocation, setIsSavingManualLocation] = useState(false);


  const isOwner = user?.uid === userId;

  useEffect(() => {
    if (userId) {
      const fetchWorkerData = async () => {
        setLoading(true);
        const userProfileData = await getUserById(userId);
        if (userProfileData && userProfileData.profession) {
          setWorker(userProfileData);
          const fullAddress = [userProfileData.city, userProfileData.country].filter(Boolean).join(', ');
          setLocationInput(fullAddress);
        } else {
          notFound();
        }
        setLoading(false);
      };
      fetchWorkerData();
    }
  }, [userId, getUserById, userProfile]); 

  const handlePortfolioUpdate = () => {
      refreshUserProfile();
  }

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
        toast({ title: t.locationFailed, description: t.locationNotSupported, variant: 'destructive' });
        return;
    }
    setIsUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`);
                const data = await response.json();
                
                const mostSpecificName = data.locality || data.city || data.principalSubdivision;

                if (!mostSpecificName) {
                    throw new Error("Invalid location data from API");
                }
                
                await updateUserProfile(userId, { city: mostSpecificName });

                toast({ title: t.locationSuccess });
                refreshUserProfile();
            } catch (error) {
                toast({ title: t.locationFailed, description: t.locationConvertFailed, variant: 'destructive' });
            } finally {
                setIsUpdatingLocation(false);
            }
        },
        (error) => {
            let errorMessage = t.unknownLocationError;
            switch(error.code) {
                case error.PERMISSION_DENIED: errorMessage = t.locationPermissionDenied; break;
                case error.POSITION_UNAVAILABLE: errorMessage = t.locationUnavailable; break;
                case error.TIMEOUT: errorMessage = t.locationTimeout; break;
            }
            toast({ title: t.locationFailed, description: errorMessage, variant: 'destructive' });
            setIsUpdatingLocation(false);
        }
    );
  };
  
    const handleSaveManualLocation = async () => {
        if (!locationInput.trim()) return;
        setIsSavingManualLocation(true);
        try {
            await updateUserProfile(userId, { city: locationInput });
            toast({ title: t.locationSuccess });
            refreshUserProfile();
        } catch (error) {
            toast({ title: t.locationFailed, description: t.unknownLocationError, variant: 'destructive' });
        } finally {
            setIsSavingManualLocation(false);
        }
    };


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-background py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{t.workerNotFound}</h1>
            <p className="text-muted-foreground mt-4">{t.workerNotFoundDesc}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const handleWhatsAppClick = () => {
    if (worker.phoneNumber) {
      const message = `مرحباً ${worker.name}, أنا مهتم بخدماتك كـ ${worker.profession} على سوق العرب.`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${worker.phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const professionName = professions.find(p => p.id === worker.profession)?.name.ar || worker.profession;
  const fullAddress = worker.city;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex-1 space-y-8">
                <div className="mb-6">
                    <Button asChild>
                    <Link href="/labor-market" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        {t.backToMarket}
                    </Link>
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-center sm:text-left">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20 shrink-0">
                        <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                        <AvatarFallback className="text-4xl">{worker.name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <h1 className="text-3xl font-bold">{worker.name}</h1>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                            <Briefcase className="w-5 h-5 text-primary" />
                            <span className="text-xl font-bold">{professionName}</span>
                        </div>
                    </div>
                </div>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>{t.location}</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {isOwner ? (
                             <div className="space-y-2">
                                 <div className="flex items-center gap-2">
                                     <MapPin className="h-5 w-5 text-muted-foreground" />
                                     <Input 
                                         value={locationInput} 
                                         onChange={(e) => setLocationInput(e.target.value)} 
                                         className="flex-1"
                                         placeholder={t.location}
                                     />
                                 </div>
                                 <div className="flex gap-2 justify-end">
                                     <Button variant="outline" size="sm" onClick={handleUpdateLocation} disabled={isUpdatingLocation}>
                                        {isUpdatingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                                        <span className="hidden sm:inline ml-2">{t.updateLocation}</span>
                                     </Button>
                                     <Button size="sm" onClick={handleSaveManualLocation} disabled={isSavingManualLocation}>
                                        {isSavingManualLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                         <span className="hidden sm:inline ml-2">{t.save}</span>
                                     </Button>
                                 </div>
                             </div>
                         ) : (
                             <div className="flex items-center gap-2">
                                 <MapPin className="h-5 w-5 text-muted-foreground" />
                                 <span>{fullAddress || "غير محدد"}</span>
                             </div>
                         )}
                    </CardContent>
                </Card>

                {!isOwner && (
                    <Card>
                        <CardHeader>
                            <CardTitle>معلومات الاتصال</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                                <Button
                                asChild
                                className="w-full"
                                size="lg"
                                disabled={!worker.phoneNumber}
                            >
                                <a href={`tel:${worker.phoneNumber}`}>
                                    <Phone className="mr-2 h-5 w-5" />
                                    {worker.phoneNumber ? t.callSeller : t.phoneNotAvailable}
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full bg-green-500 text-white hover:bg-green-600 hover:text-white"
                                size="lg"
                                onClick={handleWhatsAppClick}
                                disabled={!worker.phoneNumber}
                            >
                                <WhatsappIcon />
                                <span className="mx-2">
                                    {worker.phoneNumber ? t.messageOnWhatsapp : t.phoneNotAvailable}
                                </span>
                            </Button>
                        </CardContent>
                    </Card>
                )}
                
                 <Card>
                      <CardHeader>
                          <CardTitle>{t.portfolio}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PortfolioManager worker={worker} isOwner={isOwner} onUpdate={handlePortfolioUpdate} />
                      </CardContent>
                  </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>التقييم</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {worker ? <Reviews seller={worker}/> : <div>{t.noRating}</div>}
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
