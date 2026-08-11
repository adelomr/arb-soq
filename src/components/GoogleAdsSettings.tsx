"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Settings2, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function GoogleAdsSettings() {
  const { adSenseSettings, saveAdSenseSettings } = useAuth();
  const { toast } = useToast();
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [autoAdsEnabled, setAutoAdsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adSenseSettings) {
      setAdsEnabled(adSenseSettings.adsEnabled);
      setAutoAdsEnabled(adSenseSettings.autoAdsEnabled);
    }
  }, [adSenseSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAdSenseSettings({
        adsEnabled,
        autoAdsEnabled,
      });
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات إعلانات جوجل أدسنس بنجاح.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-border bg-card max-w-2xl mx-auto">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold font-headline">
          <Settings2 className="h-6 w-6 text-primary" />
          إعدادات إعلانات جوجل (AdSense)
        </CardTitle>
        <CardDescription>التحكم في ظهور إعلانات جوجل أدسنس على الموقع بالكامل لراحة المستخدمين.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 text-right" dir="rtl">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
          <div className="space-y-1 text-right">
            <Label htmlFor="ads-toggle" className="text-base font-bold text-foreground flex items-center gap-2 cursor-pointer">
              {adsEnabled ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              تفعيل إعلانات جوجل أدسنس
            </Label>
            <p className="text-xs text-muted-foreground">عند الإيقاف، لن يتم تحميل كود جوجل أدسنس ولن تظهر أي إعلانات للمستخدمين.</p>
          </div>
          <Switch
            id="ads-toggle"
            checked={adsEnabled}
            onCheckedChange={setAdsEnabled}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
          <div className="space-y-1 text-right">
            <Label htmlFor="autoads-toggle" className="text-base font-bold text-foreground flex items-center gap-2 cursor-pointer">
              <ShieldCheck className="h-4 w-4 text-primary" />
              تفعيل الإعلانات التلقائية (Auto Ads)
            </Label>
            <p className="text-xs text-muted-foreground">السماح لجوجل بتحديد أماكن الإعلانات وعرضها تلقائياً في الأماكن المناسبة.</p>
          </div>
          <Switch
            id="autoads-toggle"
            checked={autoAdsEnabled}
            onCheckedChange={setAutoAdsEnabled}
            disabled={!adsEnabled}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-end border-t border-border/50 pt-6">
        <Button onClick={handleSave} disabled={saving} className="font-bold flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </CardFooter>
    </Card>
  );
}
