
'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Car, Building, Smartphone, Sofa, HardHat, Briefcase, Handshake, Store, PawPrint, Shirt, ChevronDown, Flag, Home, Building2, Hotel, Map, Tv, Laptop, Monitor, Cpu, Headphones, Watch, Gamepad2, Tablet, Music, Camera, Armchair, Palette, Globe, Code, FileSpreadsheet, FileText, Megaphone, User, Stethoscope, GraduationCap, CircleUser, Cat, Dog, Bird, Fish, Glasses, Footprints, Newspaper } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { markets } from '@/lib/markets';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/lib/types';


const translations = {
  ar: {
    vehicles: "سيارات",
    property: "عقارات",
    electronics: "إلكترونيات",
    furniture: "أثاث",
    laborMarket: "سوق العمال",
    services: "خدمات",
    jobs: "وظائف",
    stores: "المتاجر",
    pets: "حيوانات",
    fashion: "أزياء",
    blog: "المنتدى",
    // Car Brands - Arabic
    toyota: "تويوتا",
    hyundai: "هيونداي",
    ford: "فورد",
    chevrolet: "شيفروليه",
    nissan: "نيسان",
    bmw: "بي إم دبليو",
    mercedes: "مرسيدس",
    kia: "كيا",
    honda: "هوندا",
    volkswagen: "فولكس فاجن",
    audi: "أودي",
    lexus: "لكزس",
    laborMarketTitle: "أسواق العمل",
    // Property types - Arabic
    villas: "فلل",
    apartments: "شقق سكنية",
    chalets: "شاليهات",
    landForSale: "أراضي للبيع",
    shops: "محلات",
    // Electronics - Arabic
    phones: "جوالات",
    screens: "شاشات وتلفزيونات",
    laptops: "لابتوبات",
    computers: "كمبيوتر",
    gpus: "كروت شاشة",
    audio: "أجهزة صوتية",
    headphones: "سماعات",
    watches: "ساعات",
    gaming: "ألعاب فيديو",
    tablets: "أجهزة لوحية",
    // Furniture - Arabic
    homeFurniture: "أثاث منزلي",
    officeFurniture: "أثاث مكتبي",
    hotelFurniture: "أثاث فندقي",
    // Services - Arabic
    googleAds: "خدمات إعلانات جوجل",
    design: "خدمات تصميم",
    webDev: "إنشاء مواقع",
    programming: "خدمات برمجة",
    excel: "خدمات اكسل",
    word: "خدمات وورد",
    // Jobs - Arabic
    adminJobs: "وظائف إدارية",
    techJobs: "وظائف تقنية",
    marketingJobs: "وظائف تسويق",
    teachingJobs: "وظائف تعليمية",
    medicalJobs: "وظائف طبية",
    // Pets - Arabic
    cats: "قطط",
    dogs: "كلاب",
    birds: "طيور",
    fish: "أسماك",
    camels: "جمال",
    horses: "أحصنة",
    deer: "غزلان",
    sheep: "غنم",
    // Fashion - Arabic
    mensFashion: "أزياء رجالية",
    womensFashion: "أزياء نسائية",
    shoes: "أحذية",
    accessories: "إكسسوارات",
  },
  en: {
    vehicles: "Cars",
    property: "Property",
    electronics: "Electronics",
    furniture: "Furniture",
    laborMarket: "Labor Market",
    services: "Services",
    jobs: "Jobs",
    stores: "Stores",
    pets: "Pets",
    fashion: "Fashion",
    blog: "Blog",
    // Car Brands - English
    toyota: "Toyota",
    hyundai: "Hyundai",
    ford: "Ford",
    chevrolet: "Chevrolet",
    nissan: "Nissan",
    bmw: "BMW",
    mercedes: "Mercedes",
    kia: "Kia",
    honda: "Honda",
    volkswagen: "Volkswagen",
    audi: "Audi",
    lexus: "Lexus",
    laborMarketTitle: "Labor Markets",
    // Property types - English
    villas: "Villas",
    apartments: "Apartments",
    chalets: "Chalets",
    landForSale: "Land for Sale",
    shops: "Shops",
    // Electronics - English
    phones: "Phones",
    screens: "Screens & TVs",
    laptops: "Laptops",
    computers: "Computers",
    gpus: "Graphics Cards",
    audio: "Audio Devices",
    headphones: "Headphones",
    watches: "Watches",
    gaming: "Video Games",
    tablets: "Tablets",
    // Furniture - English
    homeFurniture: "Home Furniture",
    officeFurniture: "Office Furniture",
    hotelFurniture: "Hotel Furniture",
    // Services - English
    googleAds: "Google Ads Services",
    design: "Design Services",
    webDev: "Website Creation",
    programming: "Programming Services",
    excel: "Excel Services",
    word: "Word Services",
    // Jobs - English
    adminJobs: "Admin Jobs",
    techJobs: "Tech Jobs",
    marketingJobs: "Marketing Jobs",
    teachingJobs: "Teaching Jobs",
    medicalJobs: "Medical Jobs",
    // Pets - English
    cats: "Cats",
    dogs: "Dogs",
    birds: "Birds",
    fish: "Fish",
    camels: "Camels",
    horses: "Horses",
    deer: "Deer",
    sheep: "Sheep",
    // Fashion - English
    mensFashion: "Men's Fashion",
    womensFashion: "Women's Fashion",
    shoes: "Shoes",
    accessories: "Accessories",
  },
};

const FlagIcon = ({ code }: { code: string }) => (
  <Image 
    src={`https://flagsapi.com/${code}/shiny/64.png`} 
    alt={`${code} flag`}
    width={48}
    height={36}
    className="w-12 h-auto rounded-md"
  />
);

export default function QuickOptions() {
  const [isClient, setIsClient] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const [isVehicleMenuOpen, setIsVehicleMenuOpen] = useState(false);
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const [isElectronicsMenuOpen, setIsElectronicsMenuOpen] = useState(false);
  const [isFurnitureMenuOpen, setIsFurnitureMenuOpen] = useState(false);
  const [isLaborMarketMenuOpen, setIsLaborMarketMenuOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isJobsMenuOpen, setIsJobsMenuOpen] = useState(false);
  const [isPetsMenuOpen, setIsPetsMenuOpen] = useState(false);
  const [isFashionMenuOpen, setIsFashionMenuOpen] = useState(false);

  const { getUsersWithStores, categories } = useAuth();
  const [stores, setStores] = useState<(UserProfile & { id: string })[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
        const usersWithStores = await getUsersWithStores();
        setStores(usersWithStores);
    };
    fetchStores();
  }, [getUsersWithStores]);


   const vehicleBrands = [
      { name: t.toyota, href: `/search?q=${encodeURIComponent(t.toyota)}`, icon: Car },
      { name: t.hyundai, href: `/search?q=${encodeURIComponent(t.hyundai)}`, icon: Car },
      { name: t.ford, href: `/search?q=${encodeURIComponent(t.ford)}`, icon: Car },
      { name: t.chevrolet, href: `/search?q=${encodeURIComponent(t.chevrolet)}`, icon: Car },
      { name: t.nissan, href: `/search?q=${encodeURIComponent(t.nissan)}`, icon: Car },
      { name: t.bmw, href: `/search?q=${encodeURIComponent(t.bmw)}`, icon: Car },
      { name: t.mercedes, href: `/search?q=${encodeURIComponent(t.mercedes)}`, icon: Car },
      { name: t.kia, href: `/search?q=${encodeURIComponent(t.kia)}`, icon: Car },
      { name: t.honda, href: `/search?q=${encodeURIComponent(t.honda)}`, icon: Car },
      { name: t.volkswagen, href: `/search?q=${encodeURIComponent(t.volkswagen)}`, icon: Car },
      { name: t.audi, href: `/search?q=${encodeURIComponent(t.audi)}`, icon: Car },
      { name: t.lexus, href: `/search?q=${encodeURIComponent(t.lexus)}`, icon: Car },
  ]
  
   const propertyTypes = [
    { name: t.villas, href: `/search?q=${encodeURIComponent(t.villas)}`, icon: Home },
    { name: t.apartments, href: `/search?q=${encodeURIComponent(t.apartments)}`, icon: Building2 },
    { name: t.chalets, href: `/search?q=${encodeURIComponent(t.chalets)}`, icon: Hotel },
    { name: t.landForSale, href: `/search?q=${encodeURIComponent(t.landForSale)}`, icon: Map },
    { name: t.shops, href: `/search?q=${encodeURIComponent(t.shops)}`, icon: Store },
  ];

   const electronicsTypes = [
    { name: t.phones, href: `/category/phones?parent=electronics`, icon: Smartphone },
    { name: t.screens, href: `/category/tvs?parent=electronics`, icon: Tv },
    { name: t.laptops, href: `/category/laptops?parent=electronics`, icon: Laptop },
    { name: t.computers, href: `/search?q=${encodeURIComponent(t.computers)}`, icon: Monitor },
    { name: t.gpus, href: `/search?q=${encodeURIComponent(t.gpus)}`, icon: Cpu },
    { name: t.audio, href: `/category/audio?parent=electronics`, icon: Music },
    { name: t.headphones, href: `/search?q=${encodeURIComponent(t.headphones)}`, icon: Headphones },
    { name: t.watches, href: `/search?q=${encodeURIComponent(t.watches)}`, icon: Watch },
    { name: t.gaming, href: `/category/gaming?parent=electronics`, icon: Gamepad2 },
    { name: t.tablets, href: `/category/tablets?parent=electronics`, icon: Tablet },
   ];
   
  const furnitureTypes = [
    { name: t.homeFurniture, href: `/search?q=${encodeURIComponent(t.homeFurniture)}`, icon: Armchair },
    { name: t.officeFurniture, href: `/search?q=${encodeURIComponent(t.officeFurniture)}`, icon: Briefcase },
    { name: t.hotelFurniture, href: `/search?q=${encodeURIComponent(t.hotelFurniture)}`, icon: Hotel },
  ];

  const servicesTypes = [
    { name: t.googleAds, href: `/services?q=${encodeURIComponent(t.googleAds)}`, icon: Megaphone },
    { name: t.design, href: `/services?q=${encodeURIComponent(t.design)}`, icon: Palette },
    { name: t.webDev, href: `/services?q=${encodeURIComponent(t.webDev)}`, icon: Globe },
    { name: t.programming, href: `/services?q=${encodeURIComponent(t.programming)}`, icon: Code },
    { name: t.excel, href: `/services?q=${encodeURIComponent(t.excel)}`, icon: FileSpreadsheet },
    { name: t.word, href: `/services?q=${encodeURIComponent(t.word)}`, icon: FileText },
  ];

  const jobsTypes = [
    { name: t.adminJobs, href: `/category/jobs`, icon: CircleUser },
    { name: t.techJobs, href: `/category/jobs`, icon: Code },
    { name: t.marketingJobs, href: `/category/jobs`, icon: Megaphone },
    { name: t.teachingJobs, href: `/category/jobs`, icon: GraduationCap },
    { name: t.medicalJobs, href: `/category/jobs`, icon: Stethoscope },
  ];
  
  const petsTypes = [
      { name: t.camels, href: `/search?q=${encodeURIComponent(t.camels)}`, icon: PawPrint },
      { name: t.horses, href: `/search?q=${encodeURIComponent(t.horses)}`, icon: PawPrint },
      { name: t.deer, href: `/search?q=${encodeURIComponent(t.deer)}`, icon: PawPrint },
      { name: t.sheep, href: `/search?q=${encodeURIComponent(t.sheep)}`, icon: PawPrint },
      { name: t.cats, href: '/category/pets', icon: Cat },
      { name: t.dogs, href: '/category/pets', icon: Dog },
      { name: t.birds, href: '/category/pets', icon: Bird },
      { name: t.fish, href: '/category/pets', icon: Fish },
  ];

  const fashionTypes = [
      { name: t.mensFashion, href: '/category/fashion', icon: User },
      { name: t.womensFashion, href: '/category/fashion', icon: User },
      { name: t.shoes, href: '/category/fashion', icon: Footprints },
      { name: t.accessories, href: '/category/fashion', icon: Glasses },
  ];

  const anyMenuOpen = isVehicleMenuOpen || isPropertyMenuOpen || isLaborMarketMenuOpen || isStoreMenuOpen || isElectronicsMenuOpen || isFurnitureMenuOpen || isServicesMenuOpen || isJobsMenuOpen || isPetsMenuOpen || isFashionMenuOpen;

  const closeAllMenus = () => {
    setIsVehicleMenuOpen(false);
    setIsPropertyMenuOpen(false);
    setIsLaborMarketMenuOpen(false);
    setIsStoreMenuOpen(false);
    setIsElectronicsMenuOpen(false);
    setIsFurnitureMenuOpen(false);
    setIsServicesMenuOpen(false);
    setIsJobsMenuOpen(false);
    setIsPetsMenuOpen(false);
    setIsFashionMenuOpen(false);
  }

  if (!isClient) {
    return <div className="bg-card border-b shadow-sm sticky top-20 z-30 h-14"></div>;
  }

  return (
    <div className="bg-card border-b shadow-sm sticky top-20 z-30">
    <Collapsible open={anyMenuOpen}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-2">
            <Link href="/forum" className="flex-shrink-0">
                <Button 
                    variant="ghost" 
                    className="flex items-center gap-2"
                >
                    <Newspaper className="h-4 w-4" />
                    <span>{t.blog}</span>
                </Button>
            </Link>

            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isVehicleMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isVehicleMenuOpen;
                  closeAllMenus();
                  setIsVehicleMenuOpen(!isOpen);
                }}
            >
                <Car className="h-4 w-4" />
                <span>{t.vehicles}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isVehicleMenuOpen && "rotate-180")} />
            </Button>

            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isLaborMarketMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isLaborMarketMenuOpen;
                  closeAllMenus();
                  setIsLaborMarketMenuOpen(!isOpen);
                }}
            >
                <HardHat className="h-4 w-4" />
                <span>{t.laborMarket}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isLaborMarketMenuOpen && "rotate-180")} />
            </Button>

            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isStoreMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isStoreMenuOpen;
                  closeAllMenus();
                  setIsStoreMenuOpen(!isOpen);
                }}
            >
                <Store className="h-4 w-4" />
                <span>{t.stores}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isStoreMenuOpen && "rotate-180")} />
            </Button>

            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isPropertyMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isPropertyMenuOpen;
                  closeAllMenus();
                  setIsPropertyMenuOpen(!isOpen);
                }}
            >
                <Building className="h-4 w-4" />
                <span>{t.property}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isPropertyMenuOpen && "rotate-180")} />
            </Button>

            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isElectronicsMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isElectronicsMenuOpen;
                  closeAllMenus();
                  setIsElectronicsMenuOpen(!isOpen);
                }}
            >
                <Smartphone className="h-4 w-4" />
                <span>{t.electronics}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isElectronicsMenuOpen && "rotate-180")} />
            </Button>

            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isFurnitureMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isFurnitureMenuOpen;
                  closeAllMenus();
                  setIsFurnitureMenuOpen(!isOpen);
                }}
            >
                <Sofa className="h-4 w-4" />
                <span>{t.furniture}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isFurnitureMenuOpen && "rotate-180")} />
            </Button>
            
            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isServicesMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isServicesMenuOpen;
                  closeAllMenus();
                  setIsServicesMenuOpen(!isOpen);
                }}
            >
                <Briefcase className="h-4 w-4" />
                <span>{t.services}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isServicesMenuOpen && "rotate-180")} />
            </Button>
            
            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isJobsMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isJobsMenuOpen;
                  closeAllMenus();
                  setIsJobsMenuOpen(!isOpen);
                }}
            >
                <Handshake className="h-4 w-4" />
                <span>{t.jobs}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isJobsMenuOpen && "rotate-180")} />
            </Button>

            <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isPetsMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isPetsMenuOpen;
                  closeAllMenus();
                  setIsPetsMenuOpen(!isOpen);
                }}
            >
                <PawPrint className="h-4 w-4" />
                <span>{t.pets}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isPetsMenuOpen && "rotate-180")} />
            </Button>
             <Button 
                variant="ghost" 
                className={cn("flex-shrink-0 flex items-center gap-2", isFashionMenuOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                onClick={() => {
                  const isOpen = isFashionMenuOpen;
                  closeAllMenus();
                  setIsFashionMenuOpen(!isOpen);
                }}
            >
                <Shirt className="h-4 w-4" />
                <span>{t.fashion}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isFashionMenuOpen && "rotate-180")} />
            </Button>
        </div>
      </div>
      <CollapsibleContent className="py-4 animate-in slide-in-from-top-4 bg-secondary/30">
        <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {isVehicleMenuOpen && vehicleBrands.map((sub, index) => (
                    <Link key={index} href={sub.href} className="flex-shrink-0">
                        <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                            <div className="p-2 rounded-full bg-secondary mb-1">
                                <sub.icon className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-center w-full truncate">{sub.name}</p>
                        </Card>
                    </Link>
                ))}
                 {isPropertyMenuOpen && propertyTypes.map((sub, index) => (
                    <Link key={index} href={sub.href} className="flex-shrink-0">
                        <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                            <div className="p-2 rounded-full bg-secondary mb-1">
                                <sub.icon className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-center w-full truncate">{sub.name}</p>
                        </Card>
                    </Link>
                ))}
                 {isElectronicsMenuOpen && electronicsTypes.map((sub, index) => {
                    const Icon = sub.icon || Smartphone;
                    return (
                        <Link key={index} href={sub.href} className="flex-shrink-0">
                            <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                                <div className="p-2 rounded-full bg-secondary mb-1">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <p className="text-xs font-semibold text-center w-full truncate">{sub.name}</p>
                            </Card>
                        </Link>
                    )
                })}
                {isFurnitureMenuOpen && furnitureTypes.map((sub, index) => (
                    <Link key={index} href={sub.href} className="flex-shrink-0">
                        <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                            <div className="p-2 rounded-full bg-secondary mb-1">
                                <sub.icon className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-center w-full truncate">{sub.name}</p>
                        </Card>
                    </Link>
                ))}
                 {isLaborMarketMenuOpen && markets.map((market, index) => (
                    <Link key={index} href={`/labor-market?market=${market.id}`} className="flex-shrink-0">
                        <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                            <FlagIcon code={market.flagCode} />
                            <p className="text-sm font-semibold text-center w-full truncate mt-2">{market.name[language]}</p>
                        </Card>
                    </Link>
                ))}
                {isStoreMenuOpen && stores.map((storeProfile, index) => {
                    if (!storeProfile.store) return null;
                    return (
                         <Link key={index} href={`/store/${storeProfile.id}`} className="flex-shrink-0">
                           <Card className="w-24 h-24 overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-1">
                             <Image
                                src={storeProfile.store.coverImageUrl || '/placeholder.png'}
                                alt={storeProfile.store.storeName}
                                layout="fill"
                                className="object-cover"
                             />
                             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-end p-2">
                                 <p className="text-xs font-bold text-white truncate w-full">{storeProfile.store.storeName}</p>
                             </div>
                           </Card>
                        </Link>
                    )
                })}
                 {isServicesMenuOpen && servicesTypes.map((sub, index) => (
                    <Link key={index} href={sub.href} className="flex-shrink-0">
                        <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                            <div className="p-2 rounded-full bg-secondary mb-1">
                                <sub.icon className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-center w-full truncate">{sub.name}</p>
                        </Card>
                    </Link>
                ))}
                {isJobsMenuOpen && jobsTypes.map((sub, index) => (
                    <Link key={index} href={sub.href} className="flex-shrink-0">
                        <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                            <div className="p-2 rounded-full bg-secondary mb-1">
                                <sub.icon className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-center w-full truncate">{sub.name}</p>
                        </Card>
                    </Link>
                ))}
                {isPetsMenuOpen && petsTypes.map((sub, index) => (
                    <Link key={index} href={sub.href} className="flex-shrink-0">
                        <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                            <div className="p-2 rounded-full bg-secondary mb-1">
                                <sub.icon className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-center w-full truncate">{sub.name}</p>
                        </Card>
                    </Link>
                ))}
                {isFashionMenuOpen && fashionTypes.map((sub, index) => (
                    <Link key={index} href={sub.href} className="flex-shrink-0">
                        <Card className="flex flex-col items-center justify-center p-2 h-24 w-24 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                            <div className="p-2 rounded-full bg-secondary mb-1">
                                <sub.icon className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-center w-full truncate">{sub.name}</p>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
    </div>
  );
}
