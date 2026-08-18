'use client';

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';

export interface LocationData {
  village: string;        // القرية / الحي
  city: string;           // المدينة / المركز
  governorate: string;    // المحافظة / الإمارة / المنطقة
  country: string;        // الدولة
  fullAddress: string;    // العنوان الكامل المنسق
  latitude: number;       // خط العرض
  longitude: number;      // خط الطول
  accuracy?: number;      // دقة الـ GPS بالأمتار
  scope?: 'village' | 'city' | 'governorate' | 'country'; // نطاق البحث الافتراضي
  updatedAt?: number;
}

export const STORAGE_LOCATION_KEY = 'arb_soq_location_data';
export const BALADNA_STORAGE_KEY = 'arb_soq_my_balad_name';
export const BALADNA_COORDS_KEY = 'arb_soq_my_balad_coords';
export const LOCATION_SCOPE_KEY = 'arb_soq_location_scope';

/**
 * بناء العنوان الكامل بالتسلسل المنطقي المطابق لكود تطبيق الأندرويد
 * village, city, governorate, country
 */
export function buildFullAddress(
  village?: string | null,
  city?: string | null,
  governorate?: string | null,
  country?: string | null
): string {
  const parts: string[] = [];

  const cleanVillage = village?.trim();
  const cleanCity = city?.trim();
  const cleanGov = governorate?.trim();
  const cleanCountry = country?.trim();

  if (cleanVillage && cleanVillage !== 'غير محدد') {
    parts.push(cleanVillage);
  }

  if (
    cleanCity &&
    cleanCity !== 'غير محدد' &&
    (!cleanVillage || cleanVillage !== cleanCity)
  ) {
    parts.push(cleanCity);
  }

  if (
    cleanGov &&
    cleanGov !== 'غير محدد' &&
    (!cleanCity || cleanCity !== cleanGov) &&
    (!cleanVillage || cleanVillage !== cleanGov)
  ) {
    parts.push(cleanGov);
  }

  if (cleanCountry && cleanCountry !== 'غير محدد') {
    parts.push(cleanCountry);
  }

  return parts.length > 0 ? parts.join('، ') : 'غير محدد';
}

/**
 * تحديد أفضل اسم للعرض السريع (سوق بلدنا / الشريط العلوي)
 */
export function getBestLocationName(loc: Partial<LocationData>): string {
  if (loc.village && loc.village !== 'غير محدد') return loc.village;
  if (loc.city && loc.city !== 'غير محدد') return loc.city;
  if (loc.governorate && loc.governorate !== 'غير محدد') return loc.governorate;
  if (loc.country && loc.country !== 'غير محدد') return loc.country;
  return 'تحديد الموقع';
}

/**
 * معالجة وتدقيق بيانات العناوين لإزالة التكرارات وفق معايير أندرويد الدقيقة
 */
export function cleanAndDeduplicateAddress(raw: {
  village?: string;
  city?: string;
  governorate?: string;
  country?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  scope?: 'village' | 'city' | 'governorate' | 'country';
}): LocationData {
  let village = (raw.village || '').trim();
  let city = (raw.city || '').trim();
  let governorate = (raw.governorate || '').trim();
  let country = (raw.country || '').trim();

  // تطبيق منطق Cleanup كما في SignupActivity.java & UserDetailsActivity.java
  if (village && governorate && village.toLowerCase() === governorate.toLowerCase()) {
    village = '';
  }

  if (city && governorate && city.toLowerCase() === governorate.toLowerCase()) {
    city = '';
  }

  if (village && city && village.toLowerCase() === city.toLowerCase()) {
    // إذا كانت القرية مطابقة للمدينة، نعتمدها كمدينة ونفرغ القرية تجنباً للتكرار
    village = '';
  }

  const fullAddress = buildFullAddress(village, city, governorate, country);

  return {
    village,
    city,
    governorate,
    country,
    fullAddress,
    latitude: raw.latitude,
    longitude: raw.longitude,
    accuracy: raw.accuracy,
    scope: raw.scope || 'city',
    updatedAt: Date.now(),
  };
}

/**
 * جلب العنوان الدقيق من الإحداثيات باستخدام مزودي خدمات متعددين بالعربية (Nominatim OSM + BigDataCloud)
 * مطابقة دقة كود تطبيق الأندرويد في استخراج: القرية، المدينة، المحافظة، الدولة
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
  accuracy?: number
): Promise<LocationData> {
  // محاولة 1: OpenStreetMap Nominatim بتفاصيل دقيقة بالعربية
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`;
    const response = await fetch(osmUrl, {
      headers: {
        'Accept-Language': 'ar,ar-EG,ar-SA;q=0.9',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      // 1. استخراج الدولة
      const country = addr.country || '';

      // 2. استخراج المحافظة / المنطقة (AdminArea)
      const governorate =
        addr.state ||
        addr.governorate ||
        addr.province ||
        addr.region ||
        addr.state_district ||
        '';

      // 3. استخراج المدينة / المركز (SubAdminArea)
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.district ||
        addr.county ||
        addr.city_district ||
        '';

      // 4. استخراج القرية / الحي / المنطقة الدقيقة (SubLocality / Locality)
      const village =
        addr.village ||
        addr.hamlet ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.isolated_dwelling ||
        addr.residential ||
        addr.subdivision ||
        '';

      if (country || governorate || city || village) {
        return cleanAndDeduplicateAddress({
          village,
          city,
          governorate,
          country,
          latitude: lat,
          longitude: lng,
          accuracy,
        });
      }
    }
  } catch (err) {
    console.warn('[LocationEngine] OSM Nominatim geocode error:', err);
  }

  // محاولة 2: BigDataCloud Reverse Geocoding API كبديل موثوق
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`;
    const response = await fetch(bdcUrl);
    if (response.ok) {
      const data = await response.json();
      const country = data.countryName || '';
      const governorate = data.principalSubdivision || '';
      const city = data.city || data.locality || '';
      const village = (data.locality !== city ? data.locality : '') || '';

      return cleanAndDeduplicateAddress({
        village,
        city,
        governorate,
        country,
        latitude: lat,
        longitude: lng,
        accuracy,
      });
    }
  } catch (err) {
    console.warn('[LocationEngine] BigDataCloud geocode error:', err);
  }

  // في حال فشل المزودات، إرجاع الإحداثيات الخام
  return {
    village: '',
    city: '',
    governorate: '',
    country: '',
    fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    latitude: lat,
    longitude: lng,
    accuracy,
    scope: 'city',
    updatedAt: Date.now(),
  };
}

/**
 * طلب موقع الـ GPS عالي الدقة من المتصفح / الجهاز
 */
export function getCurrentGpsPosition(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('خدمة تحديد الموقع (GPS) غير مدعومة في جهازك أو متصفحك.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'تعذر الحصول على إشارة الموقع.';
        if (error.code === 1) {
          msg = 'تم رفض إذن الوصول للموقع الجغرافي. يرجى تفعيل إذن الموقع في المتصفح.';
        } else if (error.code === 2) {
          msg = 'إشارة الموقع (GPS) غير متوفرة حالياً. تأكد من تشغيل الـ GPS.';
        } else if (error.code === 3) {
          msg = 'استغرق تحديد الموقع وقتاً طويلاً، يرجى المحاولة في مكان مفتوح.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * استرجاع بيانات الموقع المحفوظة محلياً
 */
export function loadSavedLocation(): LocationData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_LOCATION_KEY);
    if (raw) {
      return JSON.parse(raw) as LocationData;
    }
    // فحص المفاتيح القديمة للتوافق
    const legacyBalad = localStorage.getItem(BALADNA_STORAGE_KEY);
    const legacyCoords = localStorage.getItem(BALADNA_COORDS_KEY);
    if (legacyBalad) {
      let lat = 0;
      let lng = 0;
      if (legacyCoords) {
        try {
          const parsed = JSON.parse(legacyCoords);
          lat = parsed.lat || 0;
          lng = parsed.lng || 0;
        } catch {
          // Ignore
        }
      }
      return {
        village: '',
        city: legacyBalad,
        governorate: '',
        country: '',
        fullAddress: legacyBalad,
        latitude: lat,
        longitude: lng,
        scope: 'city',
        updatedAt: Date.now(),
      };
    }
  } catch (e) {
    console.error('Error reading saved location', e);
  }
  return null;
}

/**
 * حفظ وتحديث بيانات الموقع ونشر التحديث لجميع أجزاء التطبيق ومزامنة حساب المستخدم
 */
export async function saveAndSyncLocation(
  data: LocationData,
  userId?: string | null
): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. الحفظ في LocalStorage
  localStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(data));
  const bestBalad = getBestLocationName(data);
  localStorage.setItem(BALADNA_STORAGE_KEY, bestBalad);
  if (data.latitude && data.longitude) {
    localStorage.setItem(
      BALADNA_COORDS_KEY,
      JSON.stringify({ lat: data.latitude, lng: data.longitude })
    );
  }
  if (data.scope) {
    localStorage.setItem(LOCATION_SCOPE_KEY, data.scope);
  }

  // 2. إرسال أحداث التحديث الفوري لجميع المكونات
  window.dispatchEvent(
    new CustomEvent('arb-soq-location-updated', { detail: data })
  );
  window.dispatchEvent(
    new CustomEvent('baladna-location-changed', {
      detail: { name: bestBalad, coords: { lat: data.latitude, lng: data.longitude }, data },
    })
  );

  // 3. المزامنة مع Firestore إذا كان المستخدم مسجل الدخول
  if (userId) {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        village: data.village || '',
        city: data.city || '',
        governorate: data.governorate || '',
        province: data.governorate || '',
        country: data.country || '',
        address: data.fullAddress || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        locationScope: data.scope || 'city',
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('[LocationEngine] Could not sync location to Firestore profile:', e);
    }
  }
}
