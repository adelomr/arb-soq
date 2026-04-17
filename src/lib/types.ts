

export type AdType = 'sell-item' | 'sell-service' | 'request-service' | 'video' | 'image';
export type AdStatus = 'pending' | 'active' | 'rejected' | 'sold';
export type AdCondition = 'new' | 'used';

export type SubCategory = {
  id: string;
  name: {
    ar: string;
  };
  parentId: string;
  icon: string; // Icon name as string
};

export type PortfolioImage = {
  id: string;
  url: string;
  path: string;
  name: string;
  size: number;
}

export type AdImageMeta = {
  url: string;
  path: string;
  name: string;
  size: number;
}


export type Ad = {
  id:string;
  userId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price?: number; 
  productCode?: string;
  location?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  imageUrls: string[];
  imageMeta?: AdImageMeta[];
  imageHints?: string[];
  isPromoted: boolean;
  views: number;
  clicks: number;
  postedAt: string; // ISO 8601 string
  user?: UserProfile;
  adType: AdType;
  market: string; 
  status: AdStatus;
  condition?: AdCondition;
  store?: Store;
  // Android synchronization fields
  videoUrl?: string;
  categoryId?: string;
  country?: string;
  governorate?: string;
  city?: string;
  village?: string;
  showCommIcon?: boolean;
  websiteUrl?: string;
  isActive?: boolean; // Android compatibility
  timestamp?: number; // Android compatibility
  imageUrl?: string; // Android compatibility
  isPremium?: boolean; // Premium sponsored ad
  premiumExpiresAt?: number; // Expiration timestamp for premium status
};

export type Category = {
  id: string;
  name: {
    ar: string;
  };
  icon: string; // Icon name as string
  subcategories?: SubCategory[];
};

export type Profession = {
    id: string;
    name: {
        ar: string;
    };
    hasSpecialization: boolean;
};

export type Specialization = {
    id: string;
    name: {
        ar: string;
    };
    professionId: string;
};

export type PricingPlan = {
  id: 'free' | 'premium' | 'gold';
  name: { ar: string };
  price: { en: string; ar: string };
  duration: { ar: string };
  features: {
    images: { text: { ar: string } };
    search: { available: boolean };
    highlight: { available: boolean };
    extend: { available: boolean };
  };
};

export type PricingStructure = {
  plans: {
    free: Omit<PricingPlan, 'id'>;
    premium: Omit<PricingPlan, 'id'>;
    gold: Omit<PricingPlan, 'id'>;
  }
}

export type Notification = {
    id: string;
    userId: string;
    message: string;
    type: 'general' | 'private';
    isRead: boolean;
    createdAt: any; // Firestore Timestamp
    link?: string;
}

export type Announcement = {
    id: string;
    isEnabled: boolean;
    message: {
        ar: string;
    };
    link?: string;
    linkText?: {
        ar: string;
    };
    backgroundColor?: string;
    textColor?: string;
    updatedAt: any; // Firestore Timestamp
}

export interface AdSenseSettings {
  adsEnabled: boolean;
  autoAdsEnabled: boolean;
}

export interface Store {
  id: string;
  storeName: string;
  storeDescription?: string;
  coverImageUrl?: string;
  ownerId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  phone?: string;
  phoneVerified?: boolean;
  fullName?: string;
  jobType?: string;
  country?: string;
  province?: string;
  governorate?: string;
  city?: string;
  village?: string;
  role: 'user' | 'admin';
  moderatedCategories?: string[];
  status: 'active' | 'suspended' | 'deleted';
  walletBalance: number;
  rating?: number;
  reviewCount?: number;
  store?: Store;
  profession?: string;
  specialization?: string;
  portfolioImages?: PortfolioImage[];
  createdAt?: any;
  lastForumPostAt?: any;
}

export type Review = {
    id: string;
    reviewerId: string;
    reviewerName: string;
    rating: number;
    text: string;
    createdAt: any; // Firestore Timestamp
};

export type SiteStats = {
    totalMembers: number;
    totalAds: number;
    totalVisits: number;
    totalStores: number;
};
