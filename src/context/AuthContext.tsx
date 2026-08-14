

'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset, updatePhoneNumber, PhoneAuthProvider, linkWithCredential, PhoneAuthCredential, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, writeBatch, collectionGroup, QueryConstraint, Query, runTransaction, increment, getCountFromServer, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref as dbRef, get, child, set } from "firebase/database";
import { ref, getStorage } from 'firebase/storage';
import { auth, firestore, database } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import type { Ad, AdSenseSettings, AdStatus, AdType, Notification, Announcement, UserProfile, PricingPlan, PricingStructure, Category, SubCategory, Review, Store, SiteStats, Profession, Specialization, PortfolioImage, AdImageMeta } from '@/lib/types';
import { uploadFileAndReturnInfo, deleteMultipleEntries, deleteStorageEntry } from '@/lib/firebase-storage-helpers';
import { markets } from '@/lib/markets';
import { DEFAULT_ORGANIZED_CATEGORIES } from '@/lib/default-categories';


interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  adSenseSettings: AdSenseSettings | null;
  loading: boolean;
  categories: Category[];
  professions: Profession[];
  specializations: Specialization[];
  isPhoneNumberInUse: (phoneNumber: string) => Promise<boolean>;
  sendVerificationCode: (phoneNumber: string) => Promise<ConfirmationResult>;
  confirmVerificationCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  signIn: (email:string,password:string) => Promise<any>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetCode: (code: string) => Promise<string>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  createUserProfile: (uid: string, data: Partial<Omit<UserProfile, 'id' | 'avatarUrl' | 'phoneVerified' | 'role' | 'status' | 'walletBalance' | 'reviewCount' | 'rating' | 'store' | 'portfolioImages'>>, avatarUrl?: string) => Promise<void>;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  createOrUpdateUserStore: (uid: string, storeData: Omit<Store, 'id'>) => Promise<string>;
  getUserStore: (uid: string) => Promise<Store | null>;
  deleteStore: (uid: string) => Promise<void>;
  uploadProfileImage: (uid: string, file: File, path?: string) => Promise<string>;
  deleteUserProfile: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  getAllUsers: () => Promise<(UserProfile & { id: string })[]>;
  getUsersWithStores: () => Promise<(UserProfile & { id: string })[]>;
  sendNotification: (userId: string, message: string, type: 'private' | 'general', link?: string) => Promise<void>;
  sendGeneralNotification: (message: string) => Promise<void>;
  getUserNotifications: (userId: string, callback: (notifications: Notification[]) => void) => () => void;
  deleteNotification: (notificationId: string) => Promise<void>;
  markNotificationsAsRead: (userId: string) => Promise<void>;
  getAnnouncement: () => Promise<Announcement | null>;
  saveAnnouncement: (announcement: Omit<Announcement, 'id' | 'updatedAt' | 'message' | 'linkText'> & { message: { ar: string }, linkText?: { ar: string } }) => Promise<void>;
  getAdSenseSettings: () => Promise<AdSenseSettings | null>;
  saveAdSenseSettings: (settings: AdSenseSettings) => Promise<void>;
  addAd: (adData: any, imageFiles: File[], user: User, progressCallback: (message: string) => void) => Promise<{ success: boolean; error?: string; isCraftDuplicate?: boolean; existingAdId?: string; existingAd?: any; }>;
  updateAd: (userId: string, adId: string, adData: Partial<Ad>, newImageFiles: File[], progressCallback: (message: string) => void) => Promise<void>;
  deleteAd: (userId: string, adId: string, adData: Ad) => Promise<void>;
  getAdsForModeration: (callback: (ads: (Ad & { id: string })[]) => void, setLoading: (loading: boolean) => void) => () => void;
  updateAdStatus: (userId: string, adId: string, status: AdStatus, isStoreProduct: boolean) => Promise<void>;
  getPricingPlans: () => Promise<PricingStructure | null>;
  savePricingPlans: (plans: PricingStructure) => Promise<void>;
  getCategories: () => Promise<Category[]>;
  saveCategories: (categories: Category[]) => Promise<void>;
  getProfessions: () => Promise<Profession[]>;
  saveProfessions: (professions: Profession[]) => Promise<void>;
  getSpecializations: () => Promise<Specialization[]>;
  saveSpecializations: (specializations: Specialization[]) => Promise<void>;
  getAds: (filters: { status?: AdStatus; userId?: string; market?: string; isPromoted?: boolean; adType?: AdType; categories?: string[]; limit?: number }, callback: (ads: (Ad & { id: string })[]) => void) => () => void;
  getAdById: (userId: string, adId: string, isStoreProduct?: boolean) => Promise<(Ad & { id: string }) | null>;
  getUserById: (userId: string) => Promise<(UserProfile & { id: string }) | null>;
  addReview: (sellerId: string, review: Omit<Review, 'id' | 'createdAt'>, ad?: Ad) => Promise<void>;
  getReviews: (sellerId: string, callback: (reviews: Review[]) => void, adId?: string) => () => void;
  incrementAdView: (ad: Ad) => Promise<void>;
  incrementAdClick: (ad: Ad) => Promise<void>;
  incrementSiteVisit: () => Promise<void>;
  resetAdCounters: (userId: string, adId: string, adData: Ad) => Promise<void>;
  getStats: () => Promise<SiteStats>;
  addPortfolioImage: (userId: string, image: Omit<PortfolioImage, 'id'>) => Promise<void>;
  deletePortfolioImage: (userId: string, imageId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to remove duplicates from an array of objects based on a key
const uniqueByKey = <T extends { [key: string]: any }>(array: T[], key: keyof T): T[] => {
    return Array.from(new Map(array.map(item => [item[key], item])).values());
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [adSenseSettings, setAdSenseSettings] = useState<AdSenseSettings | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const storage = getStorage();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const getUserStore = useCallback(async (uid: string): Promise<Store | null> => {
    const storeCollectionRef = collection(firestore, 'users', uid, 'store');
    const storeSnapshot = await getDocs(storeCollectionRef);
    if (!storeSnapshot.empty) {
        const storeDoc = storeSnapshot.docs[0];
        return { id: storeDoc.id, ...storeDoc.data() } as Store;
    }
    return null;
  }, []);

  const createUserProfile = useCallback(async (uid: string, data: Partial<Omit<UserProfile, 'id' | 'avatarUrl' | 'phoneVerified' | 'role' | 'status' | 'walletBalance' | 'reviewCount' | 'rating' | 'store' | 'portfolioImages'>>, avatarUrl?: string) => {
    const finalAvatarUrl = avatarUrl || user?.photoURL || `https://avatar.vercel.sh/${uid}.png`;
    const role = 'user';
    const userProfileData: Omit<UserProfile, 'id' | 'store'> = {
      name: data.name!,
      email: data.email!,
      country: data.country,
      province: data.province,
      city: data.city,
      village: data.village,
      phoneNumber: data.phoneNumber || '',
      avatarUrl: finalAvatarUrl,
      phoneVerified: false,
      role: role,
      status: 'active',
      walletBalance: 0,
      reviewCount: 0,
      rating: 0,
      profession: data.profession || '',
      specialization: data.specialization || '',
      portfolioImages: [],
    };
    await setDoc(doc(firestore, 'users', uid), userProfileData);
    setUserProfile({ id: uid, ...userProfileData });
  }, [user]);

  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const profileData = { id: userDoc.id, ...userDoc.data() } as Omit<UserProfile, 'store'>;
      
      try {
          const adminDocRef = doc(firestore, 'admins', firebaseUser.uid);
          const adminDoc = await getDoc(adminDocRef);
          if (adminDoc.exists()) {
              profileData.role = 'admin';
          }
      } catch (e) {
          console.error("Failed to check admin status", e);
      }
      
      if (profileData.status === 'suspended' || profileData.status === 'deleted') {
        await signOut(auth);
        alert('تم تعليق حسابك أو حذفه.');
        router.push('/login');
        return null;
      }
      
      const storeData = await getUserStore(firebaseUser.uid);
      const fullProfile: UserProfile = { ...profileData, store: storeData || undefined };

      setUserProfile(fullProfile);
      return fullProfile;
    } else {
      // New user: auto-create initial profile seamlessly without forcing signup form
      const finalAvatarUrl = firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.uid}.png`;
      const newProfileData: Omit<UserProfile, 'id' | 'store'> = {
        name: firebaseUser.displayName || 'مستخدم جديد',
        email: firebaseUser.email || '',
        phoneNumber: firebaseUser.phoneNumber || '',
        avatarUrl: finalAvatarUrl,
        phoneVerified: !!firebaseUser.phoneNumber,
        role: 'user',
        status: 'active',
        walletBalance: 0,
        reviewCount: 0,
        rating: 0,
        profession: '',
        specialization: '',
        portfolioImages: [],
      };

      try {
        await setDoc(userDocRef, newProfileData);
      } catch (err) {
        console.error("Failed to auto-create user profile", err);
      }

      const fullProfile: UserProfile = { id: firebaseUser.uid, ...newProfileData };
      setUserProfile(fullProfile);
      return fullProfile;
    }
  }, [router, getUserStore]);

  const getCategories = useCallback(async (): Promise<Category[]> => {
    try {
        const querySnapshot = await getDocs(collection(firestore, 'categories'));
        const cats = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Handle both old and new data structures for backward compatibility
            const name = data.nameAr ? { ar: data.nameAr } : (typeof data.name === 'string' ? { ar: data.name } : (data.name || { ar: doc.id }));
            
            const subcategories = (data.subcategories || []).map((sub: any) => ({
                ...sub,
                name: sub.nameAr ? { ar: sub.nameAr } : (typeof sub.name === 'string' ? { ar: sub.name } : (sub.name || { ar: sub.id }))
            }));

            return { 
                id: doc.id, 
                ...data,
                name,
                subcategories
            } as Category;
        });
        
        // Ensure consistent ordering by user order field
        const sortedCats = cats.sort((a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0));

        // Merge fetched categories with DEFAULT_ORGANIZED_CATEGORIES so missing categories (like services, crafts, etc.) are always present
        const merged: Category[] = [...sortedCats];
        for (const defCat of DEFAULT_ORGANIZED_CATEGORIES) {
          const existsIndex = merged.findIndex(c => c.id === defCat.id || c.name?.ar === defCat.name?.ar);
          if (existsIndex === -1) {
            merged.push(defCat);
          } else {
            if (!merged[existsIndex].subcategories || merged[existsIndex].subcategories!.length === 0) {
              merged[existsIndex] = {
                ...merged[existsIndex],
                subcategories: defCat.subcategories
              };
            }
          }
        }
        return merged;
    } catch (e) {
        console.error("Error fetching categories:", e);
        return DEFAULT_ORGANIZED_CATEGORIES;
    }
  }, []);
  
    const getAdSenseSettings = useCallback(async (): Promise<AdSenseSettings | null> => {
        try {
            const docRef = doc(firestore, 'settings', 'adsense');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as AdSenseSettings;
            }
        } catch (e) {
            console.warn("Could not fetch AdSense settings:", e);
        }
        return { adsEnabled: true, autoAdsEnabled: false };
    }, []);

    const getProfessions = useCallback(async (): Promise<Profession[]> => {
      try {
          const querySnapshot = await getDocs(collection(firestore, 'professions'));
          return querySnapshot.docs.map(doc => {
              const data = doc.data();
              return { 
                  id: doc.id, 
                  ...data,
                  name: data.nameAr ? { ar: data.nameAr } : (typeof data.name === 'string' ? { ar: data.name } : (data.name || { ar: doc.id }))
              } as Profession;
          });
      } catch (e) {
          console.error("Error fetching professions:", e);
          return [];
      }
    }, []);

    const getSpecializations = useCallback(async (): Promise<Specialization[]> => {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'specializations'));
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    name: data.nameAr ? { ar: data.nameAr } : (typeof data.name === 'string' ? { ar: data.name } : (data.name || { ar: doc.id }))
                } as Specialization;
            });
        } catch (e) {
            console.error("Error fetching specializations:", e);
            return [];
        }
    }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        await fetchUserProfile(user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
      const fetchedProfessions = await getProfessions();
      setProfessions(fetchedProfessions);
      const fetchedSpecializations = await getSpecializations();
      setSpecializations(fetchedSpecializations);
      const fetchedAdSenseSettings = await getAdSenseSettings();
      setAdSenseSettings(fetchedAdSenseSettings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile, getCategories, getAdSenseSettings, getProfessions, getSpecializations]);
  
  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);
  
  const getAllUsers = useCallback(async (): Promise<(UserProfile & { id: string })[]> => {
    const usersCollection = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & { id: string }));
    return usersList;
  }, []);

  const getUsersWithStores = useCallback(async (): Promise<(UserProfile & { id: string })[]> => {
    const storesQuery = query(collectionGroup(firestore, 'store'));
    const querySnapshot = await getDocs(storesQuery);

    const usersWithStores = await Promise.all(
        querySnapshot.docs.map(async (storeDoc) => {
            const storeData = { id: storeDoc.id, ...storeDoc.data() } as Store;
            const userRef = storeDoc.ref.parent.parent;
            if (!userRef) return null;

            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data() as Omit<UserProfile, 'id' | 'store'>;
                return {
                    ...userData,
                    id: userSnap.id,
                    store: storeData,
                } as UserProfile & { id: string };
            }
            return null;
        })
    );

    return usersWithStores.filter((user): user is UserProfile & { id: string } => user !== null);
}, []);

  const isPhoneNumberInUse = useCallback(async (phoneNumber: string): Promise<boolean> => {
    const q = query(collection(firestore, "users"), where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }, []);

  const sendVerificationCode = useCallback(async (phoneNumber: string): Promise<ConfirmationResult> => {
    if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
        });
    }
    const verifier = recaptchaVerifierRef.current;
    
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
  }, []);
  
  const confirmVerificationCode = useCallback(async (confirmationResult: ConfirmationResult, code: string): Promise<void> => {
    if (!user) {
        throw new Error("لم يتم العثور على المستخدم لربط رقم الهاتف.");
    }
    const credential = PhoneAuthProvider.credential(confirmationResult.verificationId!, code);
    await linkWithCredential(user, credential);
    await updateUserProfile(user.uid, { phoneVerified: true });
  }, [user]);

  const signIn = useCallback(async (email:string,password:string) => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
          const profile = await fetchUserProfile(userCredential.user);
          if (profile) {
            router.push('/');
          }
      }
      return userCredential;
  }, [fetchUserProfile, router]);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      await fetchUserProfile(googleUser);
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error("خطأ في تسجيل الدخول عبر جوجل: ", error);
      throw error;
    }
  }, [fetchUserProfile, router]);
  
  const signUp = useCallback(async (email:string,password:string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signOutUser = useCallback(async () => {
      await signOut(auth);
      router.push('/login');
  }, [router]);

  const sendPasswordReset = useCallback(async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }, []);

  const deleteUserProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("لا يوجد مستخدم مسجل الدخول حاليًا.");
    }
    try {
        await deleteUser(currentUser);
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        await deleteDoc(userDocRef);
        setUser(null);
        setUserProfile(null);
        router.push('/login');
    } catch (error: any) {
        console.error("خطأ في حذف المستخدم: ", error);
        throw error;
    }
  }, [router]);

  const updateUserProfile = useCallback(async (uid: string, data: Partial<UserProfile>) => {
    if (!uid) {
      throw new Error("المستخدم غير مصادق عليه");
    }
    const userDocRef = doc(firestore, 'users', uid);
  
    await updateDoc(userDocRef, data);
    await refreshUserProfile();
  }, [refreshUserProfile]);

  const createOrUpdateUserStore = useCallback(async (uid: string, storeData: Omit<Store, 'id'>) => {
    const storeCollectionRef = collection(firestore, 'users', uid, 'store');
    const storeSnapshot = await getDocs(storeCollectionRef);
    let storeId;

    if (storeSnapshot.empty) {
        const newStoreRef = doc(storeCollectionRef);
        await setDoc(newStoreRef, storeData);
        storeId = newStoreRef.id;
    } else {
        const storeDocRef = storeSnapshot.docs[0].ref;
        await updateDoc(storeDocRef, storeData);
        storeId = storeDocRef.id;
    }
    await refreshUserProfile();
    return storeId;
  }, [refreshUserProfile]);

  const deleteStore = useCallback(async (uid: string) => {
    const storeCollectionRef = collection(firestore, 'users', uid, 'store');
    const storeSnapshot = await getDocs(storeCollectionRef);
    if (!storeSnapshot.empty) {
        const storeDocRef = storeSnapshot.docs[0].ref;
        await deleteDoc(storeDocRef);
    }
    await refreshUserProfile();
  }, [refreshUserProfile]);

  const uploadProfileImage = useCallback(async (uid: string, file: File, path?: string): Promise<string> => {
    const finalPath = path || `avatars/${uid}/${file.name}`;
    const { url } = await uploadFileAndReturnInfo(file, finalPath, storage);
    return url;
  }, [storage]);


  const sendNotification = useCallback(async (userId: string, message: string, type: 'private' | 'general' = 'private', link?: string) => {
    const notificationsCollection = collection(firestore, 'notifications');
    const notifData: any = {
      userId,
      message,
      type,
      isRead: false,
      createdAt: serverTimestamp()
    };
    if (link) {
      notifData.link = link;
    }
    await addDoc(notificationsCollection, notifData);
  }, []);

  const sendGeneralNotification = useCallback(async (message: string) => {
    const users = await getAllUsers();
    const batch = writeBatch(firestore);
    users.forEach(user => {
      const notificationRef = doc(collection(firestore, 'notifications'));
      batch.set(notificationRef, {
        userId: user.id,
        message,
        type: 'general',
        isRead: false,
        createdAt: serverTimestamp()
      });
    });
    await batch.commit();
  }, [getAllUsers]);

  const getUserNotifications = useCallback((userId: string, callback: (notifications: Notification[]) => void) => {
    const q = query(
      collection(firestore, 'notifications'), 
      where('userId', '==', userId)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        
        notifications.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

        callback(notifications);
    });
    return unsubscribe;
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const notificationRef = doc(firestore, 'notifications', notificationId);
    await deleteDoc(notificationRef);
  }, []);

  const markNotificationsAsRead = useCallback(async (userId: string) => {
    const q = query(collection(firestore, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    querySnapshot.forEach(document => {
      batch.update(document.ref, { isRead: true });
    });
    await batch.commit();
  }, []);

  const getAnnouncement = useCallback(async (): Promise<Announcement | null> => {
    const docRef = doc(firestore, 'settings', 'announcementBar');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Announcement;
    }
    return null;
  }, []);

  const saveAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'updatedAt' | 'message' | 'linkText'> & { message: { ar: string }, linkText?: { ar: string } }) => {
      const docRef = doc(firestore, 'settings', 'announcementBar');
      await setDoc(docRef, { ...announcement, updatedAt: serverTimestamp() }, { merge: true });
  }, []);

  const saveAdSenseSettings = useCallback(async (settings: AdSenseSettings) => {
      const docRef = doc(firestore, 'settings', 'adsense');
      await setDoc(docRef, settings, { merge: true });
      setAdSenseSettings(settings);
  }, []);

const addAd = useCallback(async (adData: any, imageFiles: File[], user: User, progressCallback: (message: string) => void): Promise<{ success: boolean; error?: string; isCraftDuplicate?: boolean; existingAdId?: string; existingAd?: any; }> => {
    if (!userProfile) return { success: false, error: "لم يتم تحميل ملف المستخدم الشخصي" };

    try {
        let imageMeta: AdImageMeta[] = [];
        if (imageFiles.length > 0) {
            progressCallback(`جارىٍ رفع ${imageFiles.length} صورة...`);
            imageMeta = await Promise.all(
                imageFiles.map(file => uploadFileAndReturnInfo(file, `ads/${user.uid}`, storage))
            );
            progressCallback("اكتمل رفع الصور بنجاح!");
        }

        // حماية إضافية: تحويل معرّف السوق إلى اسم الدولة العربي إن كان لا يزال كمعرّف
        // التطبيق يبحث بـ "مصر" وليس بـ "eg"
        const resolvedCountry = (() => {
            const raw = adData.country || userProfile.country || '';
            const found = markets.find(m => m.id === raw);
            return found ? found.name.ar : raw;
        })();

        // تحويل نوع الإعلان إلى العربي لتوافق التطبيق
        const adTypeArMap: Record<string, string> = {
            'sell-service': 'بيع خدمة',
            'sell-item': 'بيع منتج',
            'request-service': 'طلب خدمة',
            'video': 'فيديو',
            'image': 'صوري',
        };

        const newAdData: Partial<Ad> = {
            ...adData,
            userId: user.uid,
            postedAt: new Date().toISOString(),
            timestamp: Date.now(), // Android compatibility
            status: 'active',
            isActive: true, // Android compatibility
            imageUrls: imageMeta.map(meta => meta.url),
            imageUrl: imageMeta[0]?.url || '', // Android compatibility
            imageMeta: imageMeta,
            imageHints: [], 
            views: 0,
            clicks: 0,
            // حقل country يحتوي على اسم الدولة بالعربي دائماً (مصر، السعودية،...) وليس كمعرّف (eg, sa, ...)
            country: resolvedCountry,
            governorate: adData.governorate || userProfile.province || '',
            city: adData.city || userProfile.city || '',
            village: adData.village || userProfile.village || '',
            // حقل التوافق مع التطبيق: نوع الإعلان بالعربي
            ...(adData.adType ? { adTypeAr: adTypeArMap[adData.adType] || adData.adType } : {}),
        };

        delete (newAdData as any).images;
        
        let collectionRef;
        if (newAdData.category === 'store-product') {
            if (!userProfile.store) return { success: false, error: "المستخدم ليس لديه متجر" };
            collectionRef = collection(firestore, 'users', user.uid, 'store', userProfile.store.id, 'products');
        } else {
            // التحقق من عدم تكرار الإعلان لنفس الفئة والمستخدم
            try {
                progressCallback("جاري التحقق من عدم تكرار الإعلان...");
                const adsRef = collection(firestore, 'ads');
                const q = query(adsRef, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);

                const targetCategory = newAdData.category;
                const targetSubcategory = newAdData.subcategory;

                if (targetCategory === 'crafts') {
                    // في فئة المهن والحرف، يمنع نشر أكثر من إعلان واحد لنفس المهنة الفرعية
                    const existingCraftAdDoc = querySnapshot.docs.find(doc => {
                        const data = doc.data();
                        return data.status === 'active' && 
                               data.category === 'crafts' && 
                               data.subcategory === targetSubcategory;
                    });

                    if (existingCraftAdDoc) {
                        return {
                            success: false,
                            isCraftDuplicate: true,
                            existingAdId: existingCraftAdDoc.id,
                            existingAd: { id: existingCraftAdDoc.id, ...existingCraftAdDoc.data() }
                        };
                    }
                } else {
                    // للفئات الأخرى، نمنع فقط نشر إعلان متطابق في العنوان لنفس الفئة
                    const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
                    const targetTitle = normalize(newAdData.title || '');

                    const isDuplicate = querySnapshot.docs.some(doc => {
                        const data = doc.data();
                        return data.status === 'active' && 
                               data.category === targetCategory && 
                               normalize(data.title || '') === targetTitle;
                    });

                    if (isDuplicate) {
                        return { 
                            success: false, 
                            error: "لقد قمت بنشر إعلان بنفس العنوان في هذه الفئة بالفعل. يرجى تعديل الإعلان الحالي أو استخدام عنوان مختلف." 
                        };
                    }
                }
            } catch (err: any) {
                console.error("خطأ أثناء التحقق من تكرار الإعلان:", err);
            }

            // Write to top-level 'ads' for Android synchronization
            collectionRef = collection(firestore, 'ads');
        }
        
        progressCallback("جارىٍ حفظ بيانات الإعلان...");
        await addDoc(collectionRef, newAdData);

        return { success: true };

    } catch (e: any) {
        console.error("خطأ في addAd:", e);
        return { success: false, error: e.message || "حدث خطأ غير متوقع أثناء إضافة الإعلان." };
    }
}, [userProfile, storage]);


  const updateAd = useCallback(async (userId: string, adId: string, adData: Partial<Ad>, newImageFiles: File[], progressCallback: (message: string) => void) => {
    const dataForUpdate: { [key: string]: any } = { ...adData };
    delete dataForUpdate.images;

    let adRef;
    let oldAdData: Ad | null = null;
    const isStoreProduct = adData.category === 'store-product';

    if (isStoreProduct) {
        const userStore = await getUserStore(userId);
        if (!userStore) throw new Error("لم يتم العثور على متجر لهذا المستخدم.");
        adRef = doc(firestore, 'users', userId, 'store', userStore.id, 'products', adId);
    } else {
        // First try the top-level 'ads' collection (synchronized with Android)
        const topLevelRef = doc(firestore, 'ads', adId);
        const topLevelSnap = await getDoc(topLevelRef);
        if (topLevelSnap.exists()) {
            adRef = topLevelRef;
        } else {
            // Fallback to sub-collection
            adRef = doc(firestore, 'users', userId, 'ads', adId);
        }
    }

    const oldDocSnap = await getDoc(adRef);
    if (oldDocSnap.exists()) {
        oldAdData = oldDocSnap.data() as Ad;
    }
    
    if (newImageFiles && newImageFiles.length > 0) {
        progressCallback(`جارٍ رفع ${newImageFiles.length} صورة جديدة...`);
        
        if (oldAdData?.imageMeta && oldAdData.imageMeta.length > 0) {
            progressCallback("جارٍ حذف الصور القديمة...");
            await deleteMultipleEntries(oldAdData.imageMeta, storage);
        }

        const newImageMeta = await Promise.all(
            newImageFiles.map(file => uploadFileAndReturnInfo(file, `ads/${userId}`, storage))
        );
        
        progressCallback("اكتمل رفع الصور الجديدة!");
        dataForUpdate.imageUrls = newImageMeta.map(meta => meta.url);
        dataForUpdate.imageUrl = newImageMeta[0]?.url || ''; // Android compatibility
        dataForUpdate.imageMeta = newImageMeta;
    } else if (oldAdData) {
        // إذا لم تكن هناك ملفات جديدة، تحقق إذا كان المستخدم قد أعاد ترتيب الصور
        if (dataForUpdate.imageUrls && dataForUpdate.imageUrls.length > 0) {
            // استخدام الترتيب الجديد الذي اختاره المستخدم (مثلاً تغيير صورة الغلاف)
            dataForUpdate.imageUrl = dataForUpdate.imageUrls[0]; // Android compatibility
            // إعادة ترتيب imageMeta لتتوافق مع الترتيب الجديد
            if (oldAdData.imageMeta && oldAdData.imageMeta.length > 0) {
                dataForUpdate.imageMeta = dataForUpdate.imageUrls
                    .map((url: string) => oldAdData.imageMeta?.find((m: any) => m.url === url))
                    .filter(Boolean);
            }
        } else {
            // لا يوجد ترتيب جديد، احتفظ بالصور القديمة كما هي
            dataForUpdate.imageUrls = oldAdData.imageUrls;
            dataForUpdate.imageUrl = oldAdData.imageUrl || oldAdData.imageUrls?.[0] || ''; // Android compatibility
            dataForUpdate.imageMeta = oldAdData.imageMeta;
        }
    }

    dataForUpdate.status = 'active'; // Reset status to active on edit
    dataForUpdate.isActive = true; // Android compatibility

    // حماية إضافية: تحويل معرّف السوق إلى اسم الدولة العربي إن كان لا يزال كمعرّف
    // التطبيق يبحث بـ "مصر" وليس بـ "eg"
    if (dataForUpdate.country) {
        const foundMarket = markets.find((m: { id: string; name: { ar: string } }) => m.id === dataForUpdate.country);
        if (foundMarket) {
            dataForUpdate.country = foundMarket.name.ar;
        }
    }

    // تحديث adTypeAr لتوافق التطبيق (نوع الإعلان بالعربي)
    if (dataForUpdate.adType) {
        const adTypeArMap: Record<string, string> = {
            'sell-service': 'بيع خدمة',
            'sell-item': 'بيع منتج',
            'request-service': 'طلب خدمة',
            'video': 'فيديو',
            'image': 'صوري',
        };
        dataForUpdate.adTypeAr = adTypeArMap[dataForUpdate.adType as string] || dataForUpdate.adType;
    }
    
    // Clean out undefined values before sending to Firestore
    Object.keys(dataForUpdate).forEach(key => {
        if (dataForUpdate[key] === undefined) {
            delete dataForUpdate[key];
        }
    });
  
    progressCallback("جارٍ تحديث بيانات الإعلان...");
    await updateDoc(adRef, dataForUpdate);
  }, [getUserStore, storage]);
  

  const deleteAd = useCallback(async (userId: string, adId: string, adData: Ad) => {
    let adRef;
    if (adData.category === 'store-product') {
        const userStore = await getUserStore(userId);
        if (!userStore) throw new Error("لم يتم العثور على متجر لهذا المستخدم.");
        adRef = doc(firestore, 'users', userId, 'store', userStore.id, 'products', adId);
    } else {
        const topLevelRef = doc(firestore, 'ads', adId);
        const topLevelSnap = await getDoc(topLevelRef);
        if (topLevelSnap.exists()) {
            adRef = topLevelRef;
        } else {
            adRef = doc(firestore, 'users', userId, 'ads', adId);
        }
    }

    if (adData.imageMeta && adData.imageMeta.length > 0) {
        await deleteMultipleEntries(adData.imageMeta, storage);
    }

    await deleteDoc(adRef);

  }, [getUserStore, storage]);
  
 const updateAdStatus = useCallback(async (userId: string, adId: string, status: AdStatus, isStoreProduct: boolean) => {
    let adRef;
    if (isStoreProduct) {
        const userStore = await getUserStore(userId);
        if (!userStore) throw new Error("تعذر العثور على متجر للمستخدم لتحديث حالة المنتج.");
        adRef = doc(firestore, 'users', userId, 'store', userStore.id, 'products', adId);
    } else {
        const topLevelRef = doc(firestore, 'ads', adId);
        const topLevelSnap = await getDoc(topLevelRef);
        if (topLevelSnap.exists()) {
            adRef = topLevelRef;
        } else {
            adRef = doc(firestore, 'users', userId, 'ads', adId);
        }
    }
    await updateDoc(adRef, { status });
 }, [getUserStore]);

  const savePricingPlans = useCallback(async (plans: PricingStructure) => {
    const docRef = doc(firestore, 'settings', 'pricing');
    await setDoc(docRef, plans, { merge: true });
  }, []);

  const getPricingPlans = useCallback(async (): Promise<PricingStructure | null> => {
    const docRef = doc(firestore, 'settings', 'pricing');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PricingStructure;
    }
    return {
      plans: {
        free: { name: { ar: 'الباقة المجانية' }, price: { en: '0', ar: '0' }, duration: { ar: 'إعلان لمدة 7 أيام' }, features: { images: { text: { ar: 'صورة واحدة لكل إعلان' } }, search: { available: true }, highlight: { available: false }, extend: { available: false } } },
        premium: { name: { ar: 'الباقة المميزة' }, price: { en: '50', ar: '50' }, duration: { ar: 'إعلان لمدة 30 يوم' }, features: { images: { text: { ar: '5 صور لكل إعلان' } }, search: { available: true }, highlight: { available: true }, extend: { available: false } } },
        gold: { name: { ar: 'الباقة الذهبية' }, price: { en: '150', ar: '150' }, duration: { ar: '3 إعلانات لمدة 60 يوم' }, features: { images: { text: { ar: '10 صور لكل إعلان' } }, search: { available: true }, highlight: { available: true }, extend: { available: true } } },
      }
    };
  }, []);
  
  const saveCategories = useCallback(async (categoriesToSave: Category[]) => {
    const batch = writeBatch(firestore);
    
    // 1. Get existing categories from the collection to determine what to delete
    const existingSnap = await getDocs(collection(firestore, 'categories'));
    const existingIds = existingSnap.docs.map(d => d.id);
    const newIds = categoriesToSave.map(c => c.id);

    // 2. Delete categories that are no longer in the list
    existingIds.forEach(id => {
      if (!newIds.includes(id)) {
        batch.delete(doc(firestore, 'categories', id));
      }
    });

    // 3. Save/Update current categories with explicit order index
    const orderedCategories = categoriesToSave.map((cat, index) => ({
      ...cat,
      order: index,
    }));

    orderedCategories.forEach(cat => {
      const docRef = doc(firestore, 'categories', cat.id);
      batch.set(docRef, cat);
    });

    // 4. Commit the batch
    await batch.commit();
    setCategories(orderedCategories);
  }, []);

  const saveProfessions = useCallback(async (professionsToSave: Profession[]) => {
    const batch = writeBatch(firestore);
    professionsToSave.forEach(prof => {
        const docRef = doc(firestore, 'professions', prof.id);
        batch.set(docRef, prof, { merge: true });
    });
    await batch.commit();
    setProfessions(professionsToSave);
  }, []);

  const saveSpecializations = useCallback(async (specializationsToSave: Specialization[]) => {
      const batch = writeBatch(firestore);
      specializationsToSave.forEach(spec => {
          const docRef = doc(firestore, 'specializations', spec.id);
          batch.set(docRef, spec, { merge: true });
      });
      await batch.commit();
      setSpecializations(specializationsToSave);
  }, []);

  const getUserById = useCallback(async (userId: string): Promise<(UserProfile & { id: string }) | null> => {
    if (!userId) return null;
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const profile = { id: userSnap.id, ...userSnap.data() } as UserProfile & { id: string };
        const storeData = await getUserStore(userId);
        profile.store = storeData || undefined;
        return profile;
    }
    return null;
  }, [getUserStore]);
  
const getAds = useCallback((
    filtersOrCallback?: {
        status?: AdStatus;
        userId?: string;
        market?: string;
        isPromoted?: boolean;
        adType?: AdType;
        categories?: string[];
        limit?: number;
        country?: string;
        governorate?: string;
        city?: string;
        village?: string;
        categoryId?: string;
    } | ((ads: (Ad & { id: string })[]) => void),
    maybeCallback?: (ads: (Ad & { id: string })[]) => void
) => {
    let filters: any = {};
    let callback: ((ads: (Ad & { id: string })[]) => void) | undefined;

    if (typeof filtersOrCallback === 'function') {
        callback = filtersOrCallback;
        filters = {};
    } else {
        filters = filtersOrCallback || {};
        callback = maybeCallback;
    }

    const processSnapshot = async (querySnapshot: any, collectionName: string) => {
        let adsData = querySnapshot.docs.map((doc: any) => {
            const adData = doc.data() as Ad;
            let userId = adData.userId;
            if (!userId) {
                const pathSegments = doc.ref.path.split('/');
                const usersIndex = pathSegments.indexOf('users');
                if (usersIndex > -1 && usersIndex + 1 < pathSegments.length) {
                    userId = pathSegments[usersIndex + 1];
                }
            }
            return {
                ...adData,
                id: doc.id,
                userId: userId,
                category: collectionName === 'products' ? 'store-product' : adData.category,
            } as Ad & { id: string };
        });

        const adsWithUsers = await Promise.all(
            adsData.map(async (ad: Ad & { id: string }) => {
                if (ad.userId && !ad.user) {
                    const userProfileData = await getUserById(ad.userId);
                    if (userProfileData) {
                        ad.user = userProfileData;
                    }
                }
                return ad;
            })
        );
        return adsWithUsers;
    };

    let allUnsubscribes: (() => void)[] = [];
    let allAds: (Ad & { id: string })[] = [];

    const handleCombinedResult = (newAds: (Ad & { id: string })[], source: string) => {
      // Remove old ads from this source
      allAds = allAds.filter(ad => (ad as any)._source !== source);
      // Add new ads with source tag
      const taggedAds = newAds.map(ad => ({ ...ad, _source: source }));
      allAds = [...allAds, ...taggedAds];
      
      let finalAds = uniqueByKey(allAds, 'id');
      finalAds.sort((a, b) => {
          const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
          const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
          return dateB - dateA;
      });
      
      if (filters.categories && !filters.userId && !filters.categories.includes('store-product')) {
          finalAds = finalAds.filter(ad => filters.categories?.includes(ad.category));
      }

      // Hierarchical location filtering (matching Android logic)
      if (filters.country) finalAds = finalAds.filter(ad => ad.country === filters.country);
      if (filters.governorate) finalAds = finalAds.filter(ad => ad.governorate === filters.governorate);
      if (filters.city) finalAds = finalAds.filter(ad => ad.city === filters.city);
      if (filters.village) finalAds = finalAds.filter(ad => ad.village === filters.village);
      if (filters.categoryId) finalAds = finalAds.filter(ad => ad.categoryId === filters.categoryId);
      
      // Status filtering (handling Web "status" and Android "isActive")
      if (filters.status) {
          finalAds = finalAds.filter(ad => {
              if (filters.status === 'active') {
                  return ad.status === 'active' || ad.isActive === true || (!ad.status && ad.isActive === undefined);
              }
              return ad.status === filters.status;
          });
      }
      
      if (typeof callback === 'function') {
          callback(finalAds);
      }
    }
    
    const adQueryConstraints: QueryConstraint[] = [];
    if (filters.isPromoted) adQueryConstraints.push(where('isPromoted', '==', filters.isPromoted));
    if (filters.adType) adQueryConstraints.push(where('adType', '==', filters.adType));
    
    const isFetchingOnlyStoreProducts = !!filters.userId && filters.categories && filters.categories.length === 1 && filters.categories[0] === 'store-product';

    if (!isFetchingOnlyStoreProducts && filters.categories && filters.userId) {
        const regularCategories = filters.categories.filter(c => c !== 'store-product');
        if (regularCategories.length > 0) {
            adQueryConstraints.push(where('category', 'in', regularCategories));
        }
    }


    if (filters.userId) {
        if (!isFetchingOnlyStoreProducts) {
            // Source 1: User-specific sub-collection (legacy/web-specific)
            const adQuery = collection(firestore, 'users', filters.userId, 'ads');
            const finalAdQuery = query(adQuery, ...adQueryConstraints);
            const unsubAds = onSnapshot(finalAdQuery, async (snapshot) => {
                const regularAds = await processSnapshot(snapshot, 'ads');
                handleCombinedResult(regularAds, 'ads_sub');
            }, (err) => console.warn("onSnapshot sub error:", err));
            
            // Source 2: Top-level ads collection (Android synchronization)
            const topLevelAdsQuery = query(collection(firestore, 'ads'), where('userId', '==', filters.userId), ...adQueryConstraints);
            const unsubTopLevel = onSnapshot(topLevelAdsQuery, async (snapshot) => {
                const regularAds = await processSnapshot(snapshot, 'ads');
                handleCombinedResult(regularAds, 'ads_top');
            }, (err) => console.warn("onSnapshot top error:", err));

            allUnsubscribes.push(unsubAds, unsubTopLevel);
        }

        if ((filters.categories && filters.categories.includes('store-product')) || !filters.categories) {
            const userStorePromise = getUserStore(filters.userId);
            const unsubProducts = userStorePromise.then(store => {
                if (store) {
                    const productQuery = collection(firestore, 'users', filters.userId!, 'store', store.id, 'products');
                    
                    const productQueryConstraints: QueryConstraint[] = [];

                    const finalProductQuery = query(productQuery, ...productQueryConstraints);
                    return onSnapshot(finalProductQuery, async (snapshot) => {
                        const storeProducts = await processSnapshot(snapshot, 'products');
                        handleCombinedResult(storeProducts, 'products');
                    }, (err) => console.warn("onSnapshot products error:", err));
                }
                return () => {};
            });
            allUnsubscribes.push(() => { unsubProducts.then(unsub => unsub()); });
        }
    } else {
         let baseQuery: Query;
        if (!isFetchingOnlyStoreProducts) {
            baseQuery = collectionGroup(firestore, 'ads');
            let queryConstraints = [...adQueryConstraints];
            
            const finalQuery = query(baseQuery, ...queryConstraints);
            
            const unsubAds = onSnapshot(finalQuery, async (snapshot) => {
                let regularAds = await processSnapshot(snapshot, 'ads');
                if (filters.market) {
                  const marketData = markets.find(m => m.id === filters.market);
                  const marketAr = marketData?.name.ar;
                  regularAds = regularAds.filter(ad => 
                      !ad.market && (!ad.country || ad.country.trim() === '') || 
                      ad.market === filters.market || 
                      ad.country === filters.market || 
                      ad.country === filters.market?.toUpperCase() ||
                      (marketAr && ad.country === marketAr)
                  );
                }
                if (filters.categories) {
                  regularAds = regularAds.filter(ad => filters.categories?.includes(ad.category));
                }
                handleCombinedResult(regularAds, 'ads_global');
            }, (err) => console.warn("onSnapshot global ads error:", err));
            allUnsubscribes.push(unsubAds);
        }
        
        if ((filters.categories && filters.categories.includes('store-product')) || !filters.categories) {
            const productQuery = collectionGroup(firestore, 'products');
            let productQueryConstraints: QueryConstraint[] = [];
             
            const finalProductQuery = query(productQuery, ...productQueryConstraints);
            
            const unsubProducts = onSnapshot(finalProductQuery, async (snapshot) => {
                let storeProducts = await processSnapshot(snapshot, 'products');
                if (filters.market) {
                  const marketData = markets.find(m => m.id === filters.market);
                  const marketAr = marketData?.name.ar;
                  storeProducts = storeProducts.filter(p => 
                      !p.market && (!p.country || p.country.trim() === '') || 
                      p.market === filters.market || 
                      p.country === filters.market || 
                      p.country === filters.market?.toUpperCase() ||
                      (marketAr && p.country === marketAr)
                  );
                }
                handleCombinedResult(storeProducts, 'products_global');
            }, (err) => console.warn("onSnapshot global products error:", err));
            allUnsubscribes.push(unsubProducts);
        }
    }

    return () => {
        allUnsubscribes.forEach(unsub => unsub());
    };

}, [getUserById, getUserStore]);
    
  const getAdById = useCallback(async (userId: string, adId: string, isStoreProduct: boolean = false): Promise<(Ad & { id: string }) | null> => {
      if (!userId || !adId) return null;
      
      let adSnap;
      
      if(isStoreProduct) {
          const userStore = await getUserStore(userId);
          if (userStore) {
              const productRef = doc(firestore, 'users', userId, 'store', userStore.id, 'products', adId);
              adSnap = await getDoc(productRef);
          }
      } else {
          // Check top-level first
          const topLevelRef = doc(firestore, 'ads', adId);
          adSnap = await getDoc(topLevelRef);
          if (!adSnap.exists()) {
              // Fallback to sub-collection
              const subCollectionRef = doc(firestore, 'users', userId, 'ads', adId);
              adSnap = await getDoc(subCollectionRef);
          }
      }


      if (adSnap && adSnap.exists()) {
          const adData = adSnap.data() as Ad;
          
          if (!adData.userId) {
            adData.userId = userId;
          }
          
          let imageUrls = Array.isArray(adData.imageUrls) ? adData.imageUrls : [];
          if (typeof (adData as any).imageUrl === 'string' && imageUrls.length === 0) {
             imageUrls.push((adData as any).imageUrl);
          } else if (!adData.imageUrls) {
             imageUrls = [];
          }
          adData.imageUrls = imageUrls;

          const userProfileData = await getUserById(adData.userId);
          if (userProfileData) {
              adData.user = userProfileData;
          }

          return { ...adData, id: adSnap.id };
      }

      return null;
  }, [getUserStore, getUserById]);

  const getAdRef = useCallback(async (ad: Ad) => {
    const isStoreProduct = ad.category === 'store-product';
    if (isStoreProduct) {
        const userStore = await getUserStore(ad.userId);
        if (!userStore) throw new Error("تعذر العثور على متجر لهذا المنتج.");
        return doc(firestore, 'users', ad.userId, 'store', userStore.id, 'products', ad.id);
    } else {
        const topLevelRef = doc(firestore, 'ads', ad.id);
        const topLevelSnap = await getDoc(topLevelRef);
        if (topLevelSnap.exists()) {
            return topLevelRef;
        }
        return doc(firestore, 'users', ad.userId, 'ads', ad.id);
    }
  }, [getUserStore]);

  const addReview = useCallback(async (sellerId: string, review: Omit<Review, 'id' | 'createdAt'>, ad?: Ad) => {
    const sellerRef = doc(firestore, 'users', sellerId);
    const reviewCollection = collection(sellerRef, 'reviews');

    const reviewData = {
      ...review,
      adId: ad?.id || review.adId || null,
    };

    await runTransaction(firestore, async (transaction) => {
        const sellerDoc = await transaction.get(sellerRef);
        if (!sellerDoc.exists()) {
            throw "البائع غير موجود!";
        }

        const newReviewRef = doc(reviewCollection);
        transaction.set(newReviewRef, { ...reviewData, createdAt: serverTimestamp() });

        const currentData = sellerDoc.data() as UserProfile;
        const currentRating = currentData.rating || 0;
        const currentReviewCount = currentData.reviewCount || 0;
        
        const newReviewCount = currentReviewCount + 1;
        const newTotalRating = (currentRating * currentReviewCount) + review.rating;
        const newAverageRating = newTotalRating / newReviewCount;
        
        transaction.update(sellerRef, {
            reviewCount: newReviewCount,
            rating: newAverageRating
        });
    });

    if (ad && ad.id) {
      try {
        const adRef = await getAdRef(ad);
        const adSnap = await getDoc(adRef);
        if (adSnap.exists()) {
          const currentAdData = adSnap.data() as Ad;
          const currentAdRating = currentAdData.rating || 0;
          const currentAdReviewCount = currentAdData.reviewCount || 0;

          const newAdReviewCount = currentAdReviewCount + 1;
          const newAdTotalRating = (currentAdRating * currentAdReviewCount) + review.rating;
          const newAdAverageRating = newAdTotalRating / newAdReviewCount;

          await updateDoc(adRef, {
            reviewCount: newAdReviewCount,
            rating: newAdAverageRating,
          });
        }
      } catch (e) {
        console.warn("Could not update ad rating:", e);
      }
    }

    if (userProfile) {
        sendNotification(sellerId, `لقد تلقيت تقييمًا جديدًا من ${userProfile.name}`, 'private');
    }
    
    if (userProfile && userProfile.id === sellerId) {
        refreshUserProfile();
    }
  }, [sendNotification, userProfile, refreshUserProfile, getAdRef]);

  const getReviews = useCallback((sellerId: string, callback: (reviews: Review[]) => void, adId?: string) => {
    const reviewsQuery = query(collection(firestore, 'users', sellerId, 'reviews'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(reviewsQuery, (querySnapshot) => {
        let reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        if (adId) {
            reviews = reviews.filter(r => r.adId === adId);
        }
        callback(reviews);
    }, (error) => {
        console.error("خطأ في جلب المراجعات:", error);
    });

    return unsubscribe;
  }, []);

  const incrementAdView = useCallback(async (ad: Ad) => {
      try {
        if (!ad || !ad.userId || !ad.id) return;
        const adRef = await getAdRef(ad);
        await updateDoc(adRef, { views: increment(1) });
      } catch (e) {
        console.warn("Could not increment ad view:", e);
      }
  }, [getAdRef]);
  
  const incrementAdClick = useCallback(async (ad: Ad) => {
      try {
        if (!ad || !ad.userId || !ad.id) return;
        const adRef = await getAdRef(ad);
        await updateDoc(adRef, { clicks: increment(1) });
      } catch (e) {
        console.warn("Could not increment ad click:", e);
      }
  }, [getAdRef]);

  const incrementSiteVisit = useCallback(async () => {
    try {
      const statsRef = doc(firestore, 'settings', 'stats');
      await setDoc(statsRef, { totalVisits: increment(1) }, { merge: true });
    } catch (e) {
      console.warn("Could not increment site visit:", e);
    }
  }, []);

  const resetAdCounters = useCallback(async (userId: string, adId: string, adData: Ad) => {
    const adRef = await getAdRef({ ...adData, id: adId, userId: userId });
    await updateDoc(adRef, { views: 0, clicks: 0 });
  }, [getAdRef]);
  
  const getStats = useCallback(async (): Promise<SiteStats> => {
    const statsRef = doc(firestore, 'settings', 'stats');
    const statsSnap = await getDoc(statsRef);
    const statsData = statsSnap.exists() ? statsSnap.data() : { totalVisits: 0 };
    
    const usersCollection = collection(firestore, 'users');
    const usersSnapshot = await getCountFromServer(usersCollection);
    const totalMembers = usersSnapshot.data().count;

    const adsCollection = collectionGroup(firestore, 'ads');
    const productsCollection = collectionGroup(firestore, 'products');
    const storesCollection = collectionGroup(firestore, 'store');
    
    const adsSnapshot = await getCountFromServer(adsCollection);
    const productsSnapshot = await getCountFromServer(productsCollection);
    const storesSnapshot = await getCountFromServer(storesCollection);
    const totalStores = storesSnapshot.data().count;
    
    const totalAds = adsSnapshot.data().count + productsSnapshot.data().count;
    const totalVisits = statsData.totalVisits || 0;

    return { totalMembers, totalAds, totalVisits, totalStores };
 }, []);

  const addPortfolioImage = useCallback(async (userId: string, image: Omit<PortfolioImage, 'id'>) => {
      if (!userId) return;
      const userRef = doc(firestore, 'users', userId);
      const newImage: PortfolioImage = { ...image, id: Date.now().toString() };
      await updateDoc(userRef, {
          portfolioImages: arrayUnion(newImage)
      });
      await refreshUserProfile();
  }, [refreshUserProfile]);


  const deletePortfolioImage = useCallback(async (userId: string, imageId: string) => {
    if (!userId) return;
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        const imageToDelete = userData.portfolioImages?.find(img => img.id === imageId);
        
        if (imageToDelete) {
             await deleteStorageEntry(imageToDelete, storage);
             const updatedPortfolio = userData.portfolioImages?.filter(img => img.id !== imageId) || [];
             await updateDoc(userRef, {
                 portfolioImages: updatedPortfolio
             });
        }
        await refreshUserProfile();
    }
  }, [storage, refreshUserProfile]);

  const getAdsForModeration = useCallback((callback: (ads: (Ad & { id: string })[]) => void, setLoading: (loading: boolean) => void) => {
    const adsRef = collectionGroup(firestore, 'ads');
    const productsRef = collectionGroup(firestore, 'products');

    const processAndCombine = async (adsSnapshot: any, productsSnapshot: any) => {
        setLoading(true);
        const adsList = adsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data(), type: 'ad' }));
        const productsList = productsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data(), type: 'product' }));
        
        let combined = [...adsList, ...productsList];
        combined.sort((a: Ad, b: Ad) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

        const adsWithUsers = await Promise.all(
          combined.map(async (ad: any) => {
            const userProfile = await getUserById(ad.userId);
            return { ...ad, user: userProfile };
          })
        );
        
        callback(adsWithUsers);
        setLoading(false);
    };

    const unsubAds = onSnapshot(adsRef, (adsSnapshot) => {
        const unsubProducts = onSnapshot(productsRef, (productsSnapshot) => {
            processAndCombine(adsSnapshot, productsSnapshot);
        });
        return unsubProducts;
    });

    return () => {
        unsubAds();
    };
  }, [getUserById]);


  const value: AuthContextType = {
    user,
    userProfile,
    adSenseSettings,
    loading,
    categories,
    professions,
    specializations,
    isPhoneNumberInUse,
    sendVerificationCode,
    confirmVerificationCode,
    signIn,
    signInWithGoogle,
    signUp,
    signOutUser,
    sendPasswordReset,
    verifyPasswordResetCode: (code: string) => verifyPasswordResetCode(auth, code),
    confirmPasswordReset: (code: string, newPassword: string) => confirmPasswordReset(auth, code, newPassword),
    createUserProfile,
    updateUserProfile,
    createOrUpdateUserStore,
    getUserStore,
    deleteStore,
    uploadProfileImage,
    deleteUserProfile,
    refreshUserProfile,
    getAllUsers,
    getUsersWithStores,
    sendNotification,
    sendGeneralNotification,
    getUserNotifications,
    deleteNotification,
    markNotificationsAsRead,
    getAnnouncement,
    saveAnnouncement,
    getAdSenseSettings,
    saveAdSenseSettings,
    addAd,
    updateAd,
    deleteAd,
    getAdsForModeration,
    updateAdStatus,
    getPricingPlans,
    savePricingPlans,
    getCategories,
    saveCategories: saveCategories,
    getProfessions,
    saveProfessions: saveProfessions,
    getSpecializations,
    saveSpecializations,
    getAds,
    getAdById,
    getUserById,
    addReview,
    getReviews,
    incrementAdView,
    incrementAdClick,
    incrementSiteVisit,
    resetAdCounters,
    getStats,
    addPortfolioImage,
    deletePortfolioImage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
