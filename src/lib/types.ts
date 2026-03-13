

export type AdType = 'sell-item' | 'sell-service' | 'request-service';
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
  phoneVerified?: boolean;
  country?: string;
  province?: string;
  city?: string;
  village?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  walletBalance: number;
  rating?: number;
  reviewCount?: number;
  store?: Store;
  profession?: string;
  specialization?: string;
  portfolioImages?: PortfolioImage[];
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
