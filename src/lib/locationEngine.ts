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
 * بناء العنوان الكامل بالتسلسل المنطقي المطابق لكود تطبيق الأندرويد القديم (SignupActivity):
 * [القرية/الحي]، [المدينة]، [المحافظة]، [الدولة]
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
    (!cleanVillage || cleanVillage.toLowerCase() !== cleanCity.toLowerCase())
  ) {
    parts.push(cleanCity);
  }

  if (
    cleanGov &&
    cleanGov !== 'غير محدد' &&
    (!cleanCity || cleanCity.toLowerCase() !== cleanGov.toLowerCase()) &&
    (!cleanVillage || cleanVillage.toLowerCase() !== cleanGov.toLowerCase())
  ) {
    parts.push(cleanGov);
  }

  if (cleanCountry && cleanCountry !== 'غير محدد') {
    parts.push(cleanCountry);
  }

  return parts.length > 0 ? parts.join('، ') : 'غير محدد';
}

/**
 * تحديد أفضل اسم للعرض السريع (سوق بلدنا / الشريط العلوي) وفق النطاق المحدد أو الترتيب المنطقي
 */
export function getBestLocationName(loc: Partial<LocationData>): string {
  // 1. إذا كان المستخدم قد اختار نطاقاً محدداً (الدولة، المحافظة، المدينة، أو القرية)
  if (loc.scope === 'village' && loc.village && loc.village !== 'غير محدد') return loc.village;
  if (loc.scope === 'city' && loc.city && loc.city !== 'غير محدد') return loc.city;
  if (loc.scope === 'governorate' && loc.governorate && loc.governorate !== 'غير محدد') return loc.governorate;
  if (loc.scope === 'country' && loc.country && loc.country !== 'غير محدد') return loc.country;

  // 2. الترتيب التلقائي البديل عند عدم تحديد نطاق محدد
  if (loc.village && loc.village !== 'غير محدد') return loc.village;
  if (loc.city && loc.city !== 'غير محدد') return loc.city;
  if (loc.governorate && loc.governorate !== 'غير محدد') return loc.governorate;
  if (loc.country && loc.country !== 'غير محدد') return loc.country;
  return 'تحديد الموقع';
}

/**
 * معالجة وتدقيق بيانات العناوين لإزالة التكرارات وفق معايير أندرويد الدقيقة (SignupActivity)
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

  // تنظيف القيم الافتراضية
  if (village === 'غير محدد') village = '';
  if (city === 'غير محدد') city = '';
  if (governorate === 'غير محدد') governorate = '';
  if (country === 'غير محدد') country = '';

  // قواعد منع التكرار المطابقة لـ SignupActivity.java:
  // 1. إذا كان الحي/القرية يطابق المحافظة -> إلغاء الحي
  if (village && governorate && village.toLowerCase() === governorate.toLowerCase()) {
    village = '';
  }

  // 2. إذا كانت المدينة تطابق المحافظة -> إلغاء المحافظة المكررة أو المدينة
  if (city && governorate && city.toLowerCase() === governorate.toLowerCase()) {
    // نفضل إبقاء المحافظة وتعيين المدينة حسب الحي إن وجد
  }

  // 3. إذا كان الحي والمدينة متطابقين
  if (village && city && village.toLowerCase() === city.toLowerCase()) {
    // الإبقاء على اسم واحد
  }

  // إذا كانت القرية غير متوفرة ولكن المدينة متوفرة
  if (!village && city) {
    village = city;
  }

  const fullAddress = buildFullAddress(village, city, governorate, country);

  return {
    village: village || city || governorate || 'غير محدد',
    city: city || governorate || 'غير محدد',
    governorate: governorate || country || 'غير محدد',
    country: country || 'غير محدد',
    fullAddress,
    latitude: raw.latitude,
    longitude: raw.longitude,
    accuracy: raw.accuracy,
    scope: raw.scope || (village ? 'village' : city ? 'city' : 'governorate'),
    updatedAt: Date.now(),
  };
}

/**
 * تحويل الإحداثيات إلى أسماء المربعات الأربعة بالعربية (Geocoder Reverse Geocoding)
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

      // 1. الدولة
      const country = addr.country || '';

      // 2. المحافظة / المنطقة
      const governorate =
        addr.state ||
        addr.governorate ||
        addr.province ||
        addr.region ||
        addr.state_district ||
        '';

      // 3. المدينة / المركز / الدائرة
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.county ||
        addr.district ||
        addr.city_district ||
        addr.subdistrict ||
        '';

      // 4. الحي / القرية / الشارع
      const village =
        addr.neighbourhood ||
        addr.suburb ||
        addr.quarter ||
        addr.village ||
        addr.hamlet ||
        addr.residential ||
        addr.isolated_dwelling ||
        addr.road ||
        addr.street ||
        addr.pedestrian ||
        addr.subdivision ||
        addr.allotments ||
        (data.name && data.name !== country && data.name !== governorate ? data.name : '') ||
        '';

      if (village || city || governorate || country) {
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

  // محاولة 2: Photon Komoot Reverse Geocode بالعربية
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=ar`;
    const response = await fetch(photonUrl);
    if (response.ok) {
      const data = await response.json();
      const feature = data.features && data.features[0];
      if (feature && feature.properties) {
        const props = feature.properties;
        const country = props.country || '';
        const governorate = props.state || '';
        const city = props.city || props.county || props.district || '';
        const village =
          props.district ||
          props.street ||
          props.name ||
          props.locality ||
          '';

        if (village || city || governorate || country) {
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
    }
  } catch (err) {
    console.warn('[LocationEngine] Photon geocode error:', err);
  }

  // محاولة 3: BigDataCloud Reverse Geocoding
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`;
    const response = await fetch(bdcUrl);
    if (response.ok) {
      const data = await response.json();
      const country = data.countryName || '';
      const governorate = data.principalSubdivision || '';

      const admins: Array<{ name: string; adminLevel?: number; order?: number }> =
        data.localityInfo?.administrative || [];
      const informs: Array<{ name: string; description?: string }> =
        data.localityInfo?.informative || [];

      let village = '';
      if (informs.length > 0 && informs[0]?.name) {
        village = informs[0].name;
      } else {
        const detailedAdmin = admins
          .filter((a) => a.name && a.name !== country && a.name !== governorate)
          .sort((a, b) => (b.order || 0) - (a.order || 0))[0];

        if (detailedAdmin) {
          village = detailedAdmin.name;
        }
      }

      const city = data.city || data.locality || (admins.find((a) => (a.adminLevel || 0) <= 6 && a.name !== governorate)?.name || '');

      return cleanAndDeduplicateAddress({
        village: village || city,
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

  // في حال فشل المزودات، إرجاع الإحداثيات كعنوان
  return {
    village: 'غير محدد',
    city: 'غير محدد',
    governorate: 'غير محدد',
    country: 'غير محدد',
    fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    latitude: lat,
    longitude: lng,
    accuracy,
    scope: 'city',
    updatedAt: Date.now(),
  };
}

/**
/**
 * استخراج الموقع الاحتياطي عبر عنوان الشبكة والـ IP بدقة وسرعة فائقة
 */
export async function getLocationFromIP(): Promise<LocationData> {
  // 1. محاولة BigDataCloud المجاني بالعربية
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=ar');
    if (res.ok) {
      const data = await res.json();
      if (data.countryName || data.principalSubdivision) {
        const country = data.countryName || '';
        const governorate = data.principalSubdivision || '';
        const city = data.city || data.locality || '';
        return cleanAndDeduplicateAddress({
          country,
          governorate,
          city,
          village: data.locality || city,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          accuracy: 5000,
        });
      }
    }
  } catch (err) {
    console.warn('[LocationEngine] BigDataCloud IP lookup failed:', err);
  }

  // 2. محاولة ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.country_name || data.city) {
        return cleanAndDeduplicateAddress({
          country: data.country_name || '',
          governorate: data.region || '',
          city: data.city || '',
          village: data.city || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          accuracy: 5000,
        });
      }
    }
  } catch (err) {
    console.warn('[LocationEngine] IPAPI lookup failed:', err);
  }

  return {
    village: 'غير محدد',
    city: 'غير محدد',
    governorate: 'غير محدد',
    country: 'غير محدد',
    fullAddress: 'غير محدد',
    latitude: 0,
    longitude: 0,
    scope: 'city',
    updatedAt: Date.now(),
  };
}

/**
 * طلب موقع الـ GPS مع دعم التراجع التلقائي من الدقة العالية للدقة المتوسطة
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

    // المحاولة 1: طلب الدقة العالية مع مهلة ذكية (7 ثوانٍ)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (firstError) => {
        // إذا استغرق وقتاً طويلاً أو كانت إشارة الأقمار غير متوفرة -> المحاولة فوراً عبر شبكة الواي فاي والإنترنت
        if (firstError.code === 3 || firstError.code === 2) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              });
            },
            (secondError) => {
              reject(secondError);
            },
            {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 300000,
            }
          );
        } else {
          reject(firstError);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 120000,
      }
    );
  });
}

/**
 * الدالة الشاملة لتحديد الموقع وتعبئة المربعات الأربعة (تطبيق الحاوية + الويب):
 * 1. إذا كان التطبيق يعمل داخل حاوية الأندرويد الأصلية -> يستدعي واجهة النظام الأصلية AndroidLocation
 * 2. إذا كان متصفح ويب -> يستدعي Geolocation API مع تراجع فوري وتلقائي إلى موقع الـ IP دون إيقاف المستخدم
 */
export async function detectUserLocation(): Promise<LocationData> {
  if (typeof window === 'undefined') {
    throw new Error('بيئة غير مدعومة');
  }

  // 1. فحص وجود جسر الأندرويد الأصلي (Android Native Container Bridge)
  const win = window as any;
  if (win.AndroidLocation && typeof win.AndroidLocation.getUserLocation === 'function') {
    try {
      const nativePromise = new Promise<LocationData>((resolve, reject) => {
        const timeout = setTimeout(() => {
          delete win.onNativeLocationReceived;
          delete win.onNativeLocationError;
          reject(new Error('انتهت مهلة استجابة نظام الأندرويد لتحديد الموقع.'));
        }, 15000);

        win.onNativeLocationReceived = (jsonString: string) => {
          clearTimeout(timeout);
          delete win.onNativeLocationReceived;
          delete win.onNativeLocationError;
          try {
            const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
            const cleaned = cleanAndDeduplicateAddress({
              village: data.village,
              city: data.city,
              governorate: data.governorate || data.province,
              country: data.country,
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              accuracy: data.accuracy,
            });
            resolve(cleaned);
          } catch (parseErr) {
            reject(new Error('خطأ في معالجة بيانات الموقع المستلمة من الأندرويد.'));
          }
        };

        win.onNativeLocationError = (errMsg: string) => {
          clearTimeout(timeout);
          delete win.onNativeLocationReceived;
          delete win.onNativeLocationError;
          reject(new Error(errMsg || 'فشل تحديد الموقع من نظام الأندرويد.'));
        };

        win.AndroidLocation.getUserLocation();
      });

      return await nativePromise;
    } catch (nativeErr: any) {
      console.warn('[LocationEngine] Native Android location failed, falling back to Web GPS:', nativeErr);
    }
  }

  // 2. الـ GPS والـ Geocoder عبر الويب مع التراجع التلقائي إلى الـ IP
  try {
    const pos = await getCurrentGpsPosition();
    return await reverseGeocodeCoordinates(pos.latitude, pos.longitude, pos.accuracy);
  } catch (gpsError) {
    console.warn('[LocationEngine] Web GPS failed/timed out, seamlessly falling back to IP Geolocation:', gpsError);
    return await getLocationFromIP();
  }
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
        village: legacyBalad,
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
