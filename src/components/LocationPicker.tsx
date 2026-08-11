
'use client';

import { useState, useCallback, FormEvent, useRef } from 'react';
import { Map, Marker, Point } from "pigeon-maps";
const MapMarker = Marker as any;
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, LocateFixed, Layers, Search, Camera, MapPin, Navigation, PenLine, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Input } from './ui/input';
import { Card } from './ui/card';
import html2canvas from "html2canvas";

// الترجمات
const translations = {
  ar: {
    locating: "جارٍ تحديد الموقع...",
    locateMe: "تحديد موقعي",
    confirmLocation: "تأكيد الموقع",
    locationNotSupported: "خدمات الموقع الجغرافي غير مدعومة في هذا المتصفح.",
    locationSuccess: "تم تحديد الموقع",
    locationSetTo: "تم تحديد موقعك الحالي.",
    locationFailed: "فشل تحديد الموقع",
    locationConvertFailed: "لا يمكن تحويل الإحداثيات إلى موقع. الرجاء المحاولة مرة أخرى.",
    locationPermissionDenied: "لقد رفضت طلب تحديد الموقع الجغرافي.",
    locationUnavailable: "معلومات الموقع غير متاحة.",
    locationTimeout: "انتهت مهلة طلب تحديد الموقع.",
    unknownLocationError: "حدث خطأ غير معروف.",
    fetchingAddress: "جارٍ جلب العنوان...",
    toggleView: "تبديل عرض الخريطة",
    searchPlaceholder: "ابحث عن عنوان أو مكان...",
    noResults: "لا توجد نتائج",
    searchError: "خطأ في البحث. حاول مرة أخرى.",
    searchButton: "بحث",
    screenshot: "أخذ لقطة",
    screenshotError: "فشل في أخذ اللقطة",
    // Permission dialog
    permissionTitle: "تفعيل الموقع الجغرافي",
    permissionDesc: "للحصول على أفضل استهداف للعملاء بدقة، نحتاج إلى الوصول إلى موقعك الجغرافي. هذا يتيح لك تحديد منطقتك بدقة على الخريطة.",
    permissionBenefit: "✓ استهداف عملاء المنطقة المجاورة لك بدقة عالية",
    allowLocation: "السماح بتحديد الموقع",
    manualInput: "إدخال يدوي",
    manualInputPlaceholder: "اكتب اسم منطقتك (مثال: الرياض، النزهة)",
    manualInputConfirm: "تأكيد المنطقة",
    manualInputCancel: "إلغاء",
    orManual: "أو",
    backToMap: "العودة للخريطة",
  }
};

interface LocationPickerProps {
  onLocationSelect: (address: string) => void;
}

const DEFAULT_CENTER: Point = [24.7136, 46.6753]; // Riyadh
const DEFAULT_ZOOM = 11;

type MapProvider = 'osm' | 'satellite';
type PickerMode = 'permission' | 'locating' | 'map' | 'manual';

const osmProvider = (x: number, y: number, z: number) => {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}

const satelliteProvider = (x: number, y: number, z: number) => {
  return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
}

// شكل الدبوس
const CustomMarker = () => (
  <svg width="40" height="40" viewBox="0 0 50 50" style={{ transform: 'translate(-20px, -40px)' }}>
    <defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.3" />
      </filter>
    </defs>
    <g style={{ filter: 'url(#shadow)' }}>
      <path
        d="M25 0 C15.67 0 8 7.67 8 17 C8 28.89 25 50 25 50 C25 50 42 28.89 42 17 C42 7.67 34.33 0 25 0 Z"
        fill="hsl(var(--primary))"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2"
      />
      <circle cx="25" cy="17" r="7" fill="hsl(var(--primary-foreground))" />
    </g>
  </svg>
);

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const { language } = useLanguage();
  const t = translations.ar;
  const { toast } = useToast();

  const [mode, setMode] = useState<PickerMode>('permission');
  const [isLocating, setIsLocating] = useState(false);
  const [center, setCenter] = useState<Point>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [markerPosition, setMarkerPosition] = useState<Point>(DEFAULT_CENTER);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('osm');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [manualText, setManualText] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);

  // ───────────────────────────────────────────
  // 1. طلب إذن الموقع الجغرافي
  // ───────────────────────────────────────────
  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t.locationFailed,
        description: t.locationNotSupported,
        variant: 'destructive',
      });
      setMode('map');
      return;
    }

    setMode('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos: Point = [latitude, longitude];
        setCenter(newPos);
        setMarkerPosition(newPos);
        setZoom(14);
        setMode('map');
      },
      (error) => {
        let errorMessage = t.unknownLocationError;
        switch (error.code) {
          case 1: errorMessage = t.locationPermissionDenied; break;
          case 2: errorMessage = t.locationUnavailable; break;
          case 3: errorMessage = t.locationTimeout; break;
        }
        toast({ title: t.locationFailed, description: errorMessage, variant: 'destructive' });
        setMode('map'); // fallback to map with default center
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // ───────────────────────────────────────────
  // 2. زر "تحديد موقعي" داخل الخريطة
  // ───────────────────────────────────────────
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos: Point = [latitude, longitude];
        setCenter(newPos);
        setMarkerPosition(newPos);
        setZoom(14);
        toast({ title: t.locationSuccess, description: t.locationSetTo });
        setIsLocating(false);
      },
      (error) => {
        let errorMessage = t.unknownLocationError;
        switch (error.code) {
          case 1: errorMessage = t.locationPermissionDenied; break;
          case 2: errorMessage = t.locationUnavailable; break;
          case 3: errorMessage = t.locationTimeout; break;
        }
        toast({ title: t.locationFailed, description: errorMessage, variant: 'destructive' });
        setIsLocating(false);
      }
    );
  };

  // ───────────────────────────────────────────
  // 3. البحث
  // ───────────────────────────────────────────
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&accept-language=${language}`);
      const data = await response.json();
      setSearchResults(data);
      if (data.length === 0) {
        toast({ title: t.noResults, variant: 'default' });
      }
    } catch (error) {
      toast({ title: t.searchError, variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const newPos: Point = [lat, lon];
    setCenter(newPos);
    setMarkerPosition(newPos);
    setZoom(16);
    setSearchResults([]);
  };

  const handleMarkerDragEnd = useCallback((payload: Point) => {
    setMarkerPosition(payload);
  }, []);

  // ───────────────────────────────────────────
  // 4. تأكيد الموقع من الخريطة
  // ───────────────────────────────────────────
  const handleConfirm = async () => {
    setIsFetchingAddress(true);
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${markerPosition[0]}&longitude=${markerPosition[1]}&localityLanguage=${language}`);
      const data = await response.json();
      if (!data.city || !data.countryName) {
        throw new Error("Invalid location data from API");
      }
      const locationString = `${data.locality}, ${data.city}, ${data.countryName}`;
      onLocationSelect(locationString);
    } catch (error) {
      toast({
        title: t.locationFailed,
        description: t.locationConvertFailed,
        variant: 'destructive',
      });
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const toggleProvider = () => {
    setMapProvider(p => p === 'osm' ? 'satellite' : 'osm');
  };

  // أخذ لقطة
  const handleTakeScreenshot = async () => {
    if (mapRef.current) {
      try {
        const canvas = await html2canvas(mapRef.current, { useCORS: true });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = "map-screenshot.png";
        link.click();
        toast({ title: t.screenshot });
      } catch (error) {
        toast({ title: "خطأ", description: t.screenshotError, variant: "destructive" });
      }
    }
  };

  // ───────────────────────────────────────────
  // 5. تأكيد الإدخال اليدوي
  // ───────────────────────────────────────────
  const handleManualConfirm = () => {
    if (!manualText.trim()) return;
    onLocationSelect(manualText.trim());
  };

  // ═══════════════════════════════════════════
  // RENDER: شاشة طلب الإذن
  // ═══════════════════════════════════════════
  if (mode === 'permission') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg" dir="rtl">
        <div className="max-w-sm w-full space-y-5 text-center">
          {/* أيقونة */}
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Navigation className="h-8 w-8 text-primary" />
          </div>

          {/* العنوان */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">{t.permissionTitle}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.permissionDesc}</p>
          </div>

          {/* الفائدة */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-medium text-primary text-right">{t.permissionBenefit}</p>
          </div>

          {/* زر السماح */}
          <Button
            className="w-full gap-2 h-11 text-base"
            onClick={handleAllowLocation}
          >
            <LocateFixed className="h-5 w-5" />
            {t.allowLocation}
          </Button>

          {/* فاصل */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t.orManual}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* زر الإدخال اليدوي */}
          <Button
            variant="outline"
            className="w-full gap-2 h-10"
            onClick={() => setMode('manual')}
          >
            <PenLine className="h-4 w-4" />
            {t.manualInput}
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // RENDER: شاشة تحميل الموقع
  // ═══════════════════════════════════════════
  if (mode === 'locating') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-muted/30 rounded-lg gap-4" dir="rtl">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Navigation className="h-8 w-8 text-primary" />
          </div>
          <Loader2 className="absolute -top-1 -right-1 h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">{t.locating}</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // RENDER: شاشة الإدخال اليدوي
  // ═══════════════════════════════════════════
  if (mode === 'manual') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg" dir="rtl">
        <div className="max-w-sm w-full space-y-5">
          {/* رأس */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <PenLine className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{t.manualInput}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMode('permission')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* حقل الإدخال */}
          <div className="space-y-3">
            <Input
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder={t.manualInputPlaceholder}
              className="h-12 text-base"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleManualConfirm(); }}
            />
            <Button
              className="w-full gap-2 h-11"
              onClick={handleManualConfirm}
              disabled={!manualText.trim()}
            >
              <Check className="h-4 w-4" />
              {t.manualInputConfirm}
            </Button>
          </div>

          {/* العودة للخريطة */}
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => setMode('permission')}
          >
            <Navigation className="h-4 w-4" />
            {t.backToMap}
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // RENDER: الخريطة الكاملة
  // ═══════════════════════════════════════════
  return (
    <div className="w-full h-full rounded-md z-0 relative" ref={mapRef}>
      {/* البحث */}
      <div className="absolute top-2 left-2 right-2 z-[1001] space-y-2">
        <form onSubmit={handleSearch} className='flex gap-2'>
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="shadow-lg flex-1"
          />
          <Button type="submit" disabled={isSearching} size="icon" className="shadow-lg">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <Card className="shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map(result => (
              <div key={result.place_id} onClick={() => handleSelectResult(result)} className="p-2 border-b cursor-pointer hover:bg-secondary last:border-b-0">
                <p className="text-sm font-medium">{result.display_name}</p>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* الخريطة */}
      <div className="absolute inset-0">
        <Map
          provider={mapProvider === 'osm' ? osmProvider : satelliteProvider}
          center={center}
          zoom={zoom}
          onBoundsChanged={({ center, zoom }) => {
            setCenter(center)
            setZoom(zoom)
          }}
          onClick={({ latLng }) => setMarkerPosition(latLng)}
        >
          <MapMarker
            width={40}
            draggable={true}
            anchor={markerPosition}
            onDragEnd={handleMarkerDragEnd}
            render={() => <CustomMarker />}
          />
        </Map>
      </div>

      {/* أزرار التحكم */}
      <div className="absolute top-16 right-2 z-[1000] flex flex-col gap-2">
        <Button size="icon" onClick={handleLocateMe} disabled={isLocating} title={t.locateMe}>
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </Button>
        <Button size="icon" onClick={toggleProvider} title={t.toggleView}>
          <Layers className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={() => setMode('manual')} title={t.manualInput}>
          <PenLine className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={handleTakeScreenshot} title={t.screenshot}>
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {/* زر تأكيد */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full px-4">
        <Button className="w-full gap-2" size="lg" onClick={handleConfirm} disabled={isFetchingAddress}>
          {isFetchingAddress ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.fetchingAddress}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {t.confirmLocation}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
