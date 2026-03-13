
'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Map, Marker, Point } from "pigeon-maps";
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, LocateFixed, Layers, Search, Camera } from 'lucide-react';
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
    screenshotError: "فشل في أخذ اللقطة"
  }
};

interface LocationPickerProps {
  onLocationSelect: (address: string) => void;
}

const DEFAULT_CENTER: Point = [24.7136, 46.6753]; // Riyadh
const DEFAULT_ZOOM = 11;

type MapProvider = 'osm' | 'satellite';

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

  const [center, setCenter] = useState<Point>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [markerPosition, setMarkerPosition] = useState<Point>(DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(true);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [initialPositionLoaded, setInitialPositionLoaded] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('osm');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);

  // تحديد الموقع أول مرة
  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        title: t.locationFailed,
        description: t.locationNotSupported,
        variant: 'destructive',
      });
      setIsLocating(false);
      setInitialPositionLoaded(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos: Point = [latitude, longitude];
        setCenter(newPos);
        setMarkerPosition(newPos);
        setZoom(14);
        setIsLocating(false);
        setInitialPositionLoaded(true);
      },
      () => {
        toast({
          title: t.locationFailed,
          description: t.locationPermissionDenied,
          variant: 'destructive',
        });
        setIsLocating(false);
        setInitialPositionLoaded(true);
      }
    );
  }, [t, toast]);

  // البحث
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

  const handleLocateMe = () => {
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

  if (!initialPositionLoaded) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-muted/50 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>{t.locating}</p>
      </div>
    )
  }

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
          <Marker
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
        <Button size="icon" onClick={handleLocateMe} disabled={isLocating}>
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </Button>
        <Button size="icon" onClick={toggleProvider}>
          <Layers className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={handleTakeScreenshot}>
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
