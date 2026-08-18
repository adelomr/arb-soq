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

  // تنظيف التكرارات: لا نظهر المحافظة كقرية إذا كانت متطابقة
  if (village && governorate && village.toLowerCase() === governorate.toLowerCase()) {
    village = '';
  }

  if (city && governorate && city.toLowerCase() === governorate.toLowerCase()) {
    city = '';
  }

  // إذا كانت القرية أو الحي غير موجودة ولكن المدينة محددة، المدينة تعتبر المكان الأقرب
  if (!village && city) {
    village = city;
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
    scope: raw.scope || (village ? 'village' : city ? 'city' : 'governorate'),
    updatedAt: Date.now(),
  };
}

/**
 * جلب العنوان الدقيق من الإحداثيات باستخدام مزودي خدمات متعددين بالعربية
 * الترتيب الأقرب دائماً: القرية / الحي / الشارع -> المدينة / المركز -> المحافظة -> الدولة
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

      // 2. استخراج المحافظة / المنطقة
      const governorate =
        addr.state ||
        addr.governorate ||
        addr.province ||
        addr.region ||
        addr.state_district ||
        '';

      // 3. استخراج المدينة / المركز / الدائرة
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.county ||
        addr.district ||
        addr.city_district ||
        addr.subdistrict ||
        '';

      // 4. استخراج أدق تسمية: القرية / الحي / الشارع / التجمع السكني (الأقرب جغرافياً للمستخدم)
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

  // محاولة 2: Photon Komoot Reverse Geocode (عالي الدقة ومفتوح يدعم العربية)
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

        if (village || city || governorate) {
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

  // محاولة 3: BigDataCloud مع استخراج أدق المستويات الإدارية والمحلية
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

      // استخراج الحي أو القرية من Informative أو أدنى مستوى إداري
      let village = '';
      if (informs.length > 0 && informs[0]?.name) {
        village = informs[0].name;
      } else {
        // البحث عن المستويات الأكثر تفصيلاً (adminLevel >= 7 أو أعلى order)
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
