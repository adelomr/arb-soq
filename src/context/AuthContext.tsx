

'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset, updatePhoneNumber, PhoneAuthProvider, linkWithCredential, PhoneAuthCredential, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, writeBatch, collectionGroup, QueryConstraint, Query, runTransaction, increment, getCountFromServer, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref as dbRef, get, child, set } from "firebase/database";
import { ref, getStorage } from 'firebase/storage';
import { auth, firestore, database } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import type { Ad, AdSenseSettings, AdStatus, AdType, Notification, Announcement, UserProfile, PricingPlan, Category, SubCategory, Review, Store, SiteStats, Profession, PortfolioImage, AdImageMeta } from '@/lib/types';
import { uploadFileAndReturnInfo, deleteMultipleEntries, deleteStorageEntry } from '@/lib/firebase-storage-helpers';


interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  adSenseSettings: AdSenseSettings | null;
  loading: boolean;
  categories: Category[];
  professions: Profession[];
  isPhoneNumberInUse: (phoneNumber: string) => Promise<boolean>;
  sendVerificationCode: (phoneNumber: string) => Promise<ConfirmationResult>;
  confirmVerificationCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  signIn: (email:string,password:string) => Promise<any>;
  signInWithGoogle: () => Promise<void>;
  signUp: typeof createUserWithEmailAndPassword;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetCode: (code: string) => Promise<string>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  createUserProfile: (uid: string, data: Partial<Omit<UserProfile, 'id' | 'avatarUrl' | 'phoneVerified' | 'role' | 'status' | 'walletBalance' | 'reviewCount' | 'rating' | 'store' | 'portfolioImages'>>) => Promise<void>;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  createOrUpdateUserStore: (uid: string, storeData: Omit<Store, 'id'>) => Promise<string>;
  getUserStore: (uid: string) => Promise<Store | null>;
  deleteStore: (uid: string) => Promise<void>;
  uploadProfileImage: (uid: string, file: File, path?: string) => Promise<string>;
  deleteUserProfile: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  getAllUsers: () => Promise<(UserProfile & { id: string })[]>;
  getUsersWithStores: () => Promise<(UserProfile & { id: string })[]>;
  sendNotification: (userId: string, message: string, type: 'private' | 'general') => Promise<void>;
  sendGeneralNotification: (message: string) => Promise<void>;
  getUserNotifications: (userId: string, callback: (notifications: Notification[]) => void) => () => void;
  deleteNotification: (notificationId: string) => Promise<void>;
  markNotificationsAsRead: (userId: string) => Promise<void>;
  getAnnouncement: () => Promise<Announcement | null>;
  saveAnnouncement: (announcement: Omit<Announcement, 'id' | 'updatedAt' | 'message' | 'linkText'> & { message: { ar: string }, linkText?: { ar: string } }) => Promise<void>;
  getAdSenseSettings: () => Promise<AdSenseSettings | null>;
  saveAdSenseSettings: (settings: AdSenseSettings) => Promise<void>;
  addAd: (adData: any, imageFiles: File[], user: User, progressCallback: (message: string) => void) => Promise<{ success: boolean; error?: string; }>;
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
  getAds: (filters: { status?: AdStatus; userId?: string; market?: string; isPromoted?: boolean; adType?: AdType; categories?: string[]; limit?: number }, callback: (ads: (Ad & { id: string })[]) => void) => () => void;
  getAdById: (userId: string, adId: string, isStoreProduct?: boolean) => Promise<(Ad & { id: string }) | null>;
  getUserById: (userId: string) => Promise<(UserProfile & { id: string }) | null>;
  addReview: (sellerId: string, review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  getReviews: (sellerId: string, callback: (reviews: Review[]) => void) => () => void;
  incrementAdView: (ad: Ad) => Promise<void>;
  incrementAdClick: (ad: Ad) => Promise<void>;
  incrementSiteVisit: () => Promise<void>;
  resetAdCounters: (userId: string, adId: string, adData: Ad) => Promise<void>;
  getStats: () => Promise<SiteStats>;
  addPortfolioImage: (userId: string, image: PortfolioImage) => Promise<void>;
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
    const role = data.email === 'adelomr1878@gmail.com' ? 'admin' : 'user';
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
      // New user, redirect to signup to complete profile
      router.push('/signup');
      return null;
    }
  }, [router, getUserStore]);
  
  const getCategories = useCallback(async (): Promise<Category[]> => {
    const dbRootRef = dbRef(database);
    const snapshot = await get(child(dbRootRef, 'categories'));
    if (snapshot.exists()) {
        const categoriesObject = snapshot.val();
        const categoriesArray = Object.values(categoriesObject);
        return categoriesArray as Category[];
    }
    return [];
  }, [database]);
  
    const getAdSenseSettings = useCallback(async (): Promise<AdSenseSettings | null> => {
        const docRef = doc(firestore, 'settings', 'adsense');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as AdSenseSettings;
        }
        return { adsEnabled: true, autoAdsEnabled: false };
    }, []);

    const getProfessions = useCallback(async (): Promise<Profession[]> => {
      const dbRootRef = dbRef(database);
      const snapshot = await get(child(dbRootRef, 'professions'));
      if (snapshot.exists()) {
        const professionsObject = snapshot.val();
        if (Array.isArray(professionsObject)) {
           // Handle old array of strings format
           return professionsObject.map((profName, index) => ({
             id: `prof_${index}`,
             name: { ar: profName },
             hasSpecialization: ['طبيب', 'معلم'].includes(profName),
           }));
        } else if (typeof professionsObject === 'object') {
           // Handle new object format
           return Object.entries(professionsObject).map(([key, value]) => {
              const profData = value as any;
              return {
                 id: profData.id || key, // Use the id field if it exists
                 name: { ar: profData.name?.ar || key },
                 hasSpecialization: profData.hasSpecialization === true || ['طبيب', 'معلم'].includes(profData.name?.ar || ''),
              };
           });
        }
      }
      return [];
    }, [database]);

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
      const fetchedAdSenseSettings = await getAdSenseSettings();
      setAdSenseSettings(fetchedAdSenseSettings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile, getCategories, getAdSenseSettings, getProfessions, pathname, router]);
  
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
      
      const userDoc = await getDoc(doc(firestore, 'users', googleUser.uid));
      if (userDoc.exists()) {
          await fetchUserProfile(googleUser);
          router.push('/');
      } else {
          router.push('/signup');
      }

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


  const sendNotification = useCallback(async (userId: string, message: string, type: 'private' | 'general' = 'private') => {
    const notificationsCollection = collection(firestore, 'notifications');
    await addDoc(notificationsCollection, {
      userId,
      message,
      type,
      isRead: false,
      createdAt: serverTimestamp()
    });
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

const addAd = useCallback(async (adData: any, imageFiles: File[], user: User, progressCallback: (message: string) => void): Promise<{ success: boolean; error?: string; }> => {
    if (!userProfile) return { success: false, error: "لم يتم تحميل ملف المستخدم الشخصي" };

    try {
        let imageMeta: AdImageMeta[] = [];
        if (imageFiles.length > 0) {
            progressCallback(`جارٍ رفع ${imageFiles.length} صورة...`);
            imageMeta = await Promise.all(
                imageFiles.map(file => uploadFileAndReturnInfo(file, `ads/${user.uid}`, storage))
            );
            progressCallback("اكتمل رفع الصور بنجاح!");
        }

        const newAdData: Partial<Ad> = {
            ...adData,
            userId: user.uid,
            postedAt: new Date().toISOString(),
            status: 'active',
            imageUrls: imageMeta.map(meta => meta.url),
            imageMeta: imageMeta,
            imageHints: [], 
            views: 0,
            clicks: 0,
        };

        delete (newAdData as any).images;
        
        let collectionRef;
        if (newAdData.category === 'store-product') {
            if (!userProfile.store) return { success: false, error: "المستخدم ليس لديه متجر" };
            collectionRef = collection(firestore, 'users', user.uid, 'store', userProfile.store.id, 'products');
        } else {
            collectionRef = collection(firestore, 'users', user.uid, 'ads');
        }
        
        progressCallback("جارٍ حفظ بيانات الإعلان...");
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
        adRef = doc(firestore, 'users', userId, 'ads', adId);
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
        dataForUpdate.imageMeta = newImageMeta;
    } else if (oldAdData) {
        // If no new files, keep old images
        dataForUpdate.imageUrls = oldAdData.imageUrls;
        dataForUpdate.imageMeta = oldAdData.imageMeta;
    }
    
    dataForUpdate.status = 'active'; // Reset status to active on edit
    
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
        adRef = doc(firestore, 'users', userId, 'ads', adId);
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
        adRef = doc(firestore, 'users', userId, 'ads', adId);
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
    const docRef = doc(firestore, 'settings', 'categories');
    await setDoc(docRef, { categories: categoriesToSave }, { merge: true });
    setCategories(categoriesToSave);
  }, []);

  const saveProfessions = useCallback(async (professionsToSave: Profession[]) => {
    const docRef = doc(firestore, 'settings', 'professions');
    const uniqueProfessions = uniqueByKey(professionsToSave, 'id');
    await setDoc(docRef, { professions: uniqueProfessions }, { merge: true });
    setProfessions(uniqueProfessions);
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
    filters: {
        status?: AdStatus;
        userId?: string;
        market?: string;
        isPromoted?: boolean;
        adType?: AdType;
        categories?: string[];
        limit?: number;
    },
    callback: (ads: (Ad & { id: string })[]) => void
) => {
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
                id: doc.id,
                ...adData,
                userId: userId,
                category: collectionName === 'products' ? 'store-product' : adData.category,
            } as Ad & { id: string };
        });

        const adsWithUsers = await Promise.all(
            adsData.map(async (ad) => {
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

    const handleCombinedResult = (newAds: (Ad & { id: string })[], type: 'ads' | 'products') => {
      if (type === 'ads') {
        allAds = [...allAds.filter(ad => ad.category === 'store-product'), ...newAds];
      } else { // products
        allAds = [...allAds.filter(ad => ad.category !== 'store-product'), ...newAds];
      }
      
      let finalAds = uniqueByKey(allAds, 'id');
      finalAds.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      
      if (filters.categories && !filters.userId && !filters.categories.includes('store-product')) {
          finalAds = finalAds.filter(ad => filters.categories?.includes(ad.category));
      }
      
      callback(finalAds);
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
            const adQuery = collection(firestore, 'users', filters.userId, 'ads');
            const finalAdQuery = query(adQuery, ...adQueryConstraints);
            const unsubAds = onSnapshot(finalAdQuery, async (snapshot) => {
                const regularAds = await processSnapshot(snapshot, 'ads');
                handleCombinedResult(regularAds, 'ads');
            });
            allUnsubscribes.push(unsubAds);
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
                    });
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
                  regularAds = regularAds.filter(ad => ad.market === filters.market);
                }
                if (filters.categories) {
                  regularAds = regularAds.filter(ad => filters.categories?.includes(ad.category));
                }
                handleCombinedResult(regularAds, 'ads');
            });
            allUnsubscribes.push(unsubAds);
        }
        
        if ((filters.categories && filters.categories.includes('store-product')) || !filters.categories) {
            const productQuery = collectionGroup(firestore, 'products');
            let productQueryConstraints: QueryConstraint[] = [];
             
            const finalProductQuery = query(productQuery, ...productQueryConstraints);
            
            const unsubProducts = onSnapshot(finalProductQuery, async (snapshot) => {
                let storeProducts = await processSnapshot(snapshot, 'products');
                if (filters.market) {
                    storeProducts = storeProducts.filter(p => p.market === filters.market);
                }
                handleCombinedResult(storeProducts, 'products');
            });
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
          const adRef = doc(firestore, 'users', userId, 'ads', adId);
          adSnap = await getDoc(adRef);
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

          return { id: adSnap.id, ...adData };
      }

      return null;
  }, [getUserStore, getUserById]);

  const addReview = useCallback(async (sellerId: string, review: Omit<Review, 'id' | 'createdAt'>) => {
    const sellerRef = doc(firestore, 'users', sellerId);
    const reviewCollection = collection(sellerRef, 'reviews');

    await runTransaction(firestore, async (transaction) => {
        const sellerDoc = await transaction.get(sellerRef);
        if (!sellerDoc.exists()) {
            throw "البائع غير موجود!";
        }

        const newReviewRef = doc(reviewCollection);
        transaction.set(newReviewRef, { ...review, createdAt: serverTimestamp() });

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

    if (userProfile) {
        sendNotification(sellerId, `لقد تلقيت تقييمًا جديدًا من ${userProfile.name}`, 'private');
    }
    
    if (userProfile && userProfile.id === sellerId) {
        refreshUserProfile();
    }
  }, [sendNotification, userProfile, refreshUserProfile]);

  const getReviews = useCallback((sellerId: string, callback: (reviews: Review[]) => void) => {
    const reviewsQuery = query(collection(firestore, 'users', sellerId, 'reviews'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(reviewsQuery, (querySnapshot) => {
        const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        callback(reviews);
    }, (error) => {
        console.error("خطأ في جلب المراجعات:", error);
    });

    return unsubscribe;
  }, []);

  const getAdRef = useCallback(async (ad: Ad) => {
    const isStoreProduct = ad.category === 'store-product';
    if (isStoreProduct) {
        const userStore = await getUserStore(ad.userId);
        if (!userStore) throw new Error("تعذر العثور على متجر لهذا المنتج.");
        return doc(firestore, 'users', ad.userId, 'store', userStore.id, 'products', ad.id);
    } else {
        return doc(firestore, 'users', ad.userId, 'ads', ad.id);
    }
  }, [getUserStore]);

  const incrementAdView = useCallback(async (ad: Ad) => {
      if (!ad || !ad.userId || !ad.id) return;
      const adRef = await getAdRef(ad);
      await updateDoc(adRef, { views: increment(1) });
  }, [getAdRef]);
  
  const incrementAdClick = useCallback(async (ad: Ad) => {
      if (!ad || !ad.userId || !ad.id) return;
      const adRef = await getAdRef(ad);
      await updateDoc(adRef, { clicks: increment(1) });
  }, [getAdRef]);

  const incrementSiteVisit = useCallback(async () => {
    const statsRef = doc(firestore, 'settings', 'stats');
    await setDoc(statsRef, { totalVisits: increment(1) }, { merge: true });
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
