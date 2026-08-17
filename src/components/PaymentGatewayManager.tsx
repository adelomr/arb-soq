'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getPaymobSettings, savePaymobSettings, PaymobSettings } from '@/lib/paymob-service';
import { CreditCard, Save, Loader2, ExternalLink, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, Copy, Smartphone, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PaymentGatewayManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [settings, setSettings] = useState<PaymobSettings>({
    apiKey: '',
    integrationId: '',
    walletIntegrationId: '',
    kioskIntegrationId: '',
    iframeId: '',
    hmacSecret: '',
    isEnabled: true,
    currency: 'EGP',
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.arb-soq.com';
  const callbackUrl = `${baseUrl}/api/paymob/callback`;
  const webhookUrl = `${baseUrl}/api/paymob/webhook`;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getPaymobSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await savePaymobSettings(settings);
      toast({
        title: 'تم الحفظ بنجاح!',
        description: 'تم تحديث إعدادات بوابة الدفع (Paymob) بنجاح.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'فشل الحفظ',
        description: err.message || 'حدث خطأ أثناء حفظ الإعدادات.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast({ title: 'تم نسخ الرابط إلى الحافظة' });
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto" dir="rtl">
      {/* Header Info */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="text-right">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center gap-2.5">
                <CreditCard className="h-6 w-6 text-primary" />
                <span>إدارة بوابة الدفع الإلكتروني (Paymob)</span>
              </CardTitle>
              <CardDescription className="mt-1.5">
                ربط شامل للبطاقات البنكية، فودافون كاش والمحافظ الذكية، ومنافذ فوري وتفعيل الإعلانات فورياً.
              </CardDescription>
            </div>
            <a
              href="https://eg.dashboard.paymob.com/home"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs sm:text-sm border transition-colors shrink-0"
            >
              <span>لوحة تحكم Paymob</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Status Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl border bg-secondary/30">
              <div className="space-y-0.5 text-right">
                <Label className="text-base font-bold">تفعيل بوابة الدفع في الموقع</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  عند التعطيل لن يتمكن المستخدمون من الدفع الإلكتروني حتى إعادة التفعيل.
                </p>
              </div>
              <Switch
                checked={settings.isEnabled}
                onCheckedChange={(val) => setSettings((s) => ({ ...s, isEnabled: val }))}
              />
            </div>

            {/* Keys Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Key */}
              <div className="space-y-2 text-right md:col-span-2">
                <Label htmlFor="apiKey" className="font-bold flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>مفتاح الـ API (API Secret Key)</span>
                </Label>
                <Input
                  id="apiKey"
                  type="text"
                  placeholder="مثال: egy_sk_test_..."
                  value={settings.apiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value.trim() }))}
                  className="font-mono text-left text-xs sm:text-sm"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  من لوحة Paymob ➔ المطورون ➔ مفاتيح API.
                </p>
              </div>

              {/* Cards Integration ID */}
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <Label htmlFor="integrationId" className="font-bold flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>تكامل البطاقات البنكية (Cards ID)</span>
                  </Label>
                  <Badge variant="outline" className="text-2xs bg-primary/10 text-primary border-primary/20">Visa / Master / Meeza</Badge>
                </div>
                <Input
                  id="integrationId"
                  type="text"
                  placeholder="مثال: 5226822"
                  value={settings.integrationId}
                  onChange={(e) => setSettings((s) => ({ ...s, integrationId: e.target.value.trim() }))}
                  className="font-mono text-left"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  معرف تكامل البطاقات البنكية (Online Card VPC).
                </p>
              </div>

              {/* Mobile Wallets Integration ID */}
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <Label htmlFor="walletIntegrationId" className="font-bold flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-emerald-500" />
                    <span>المحافظ الإلكترونية (فودافون كاش)</span>
                  </Label>
                  <Badge variant="outline" className="text-2xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">فودافون / اتصالات / أورنج / وي</Badge>
                </div>
                <Input
                  id="walletIntegrationId"
                  type="text"
                  placeholder="مثال: 5226823 (اختياري)"
                  value={settings.walletIntegrationId || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, walletIntegrationId: e.target.value.trim() }))}
                  className="font-mono text-left"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  معرف تكامل Mobile Wallets من قسم تكاملات الدفع.
                </p>
              </div>

              {/* Fawry / Kiosk Integration ID */}
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <Label htmlFor="kioskIntegrationId" className="font-bold flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-amber-500" />
                    <span>منافذ فوري وأمان (Fawry / Kiosk)</span>
                  </Label>
                  <Badge variant="outline" className="text-2xs bg-amber-500/10 text-amber-600 border-amber-500/20">كود دفع فوري</Badge>
                </div>
                <Input
                  id="kioskIntegrationId"
                  type="text"
                  placeholder="مثال: 5226824 (اختياري)"
                  value={settings.kioskIntegrationId || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, kioskIntegrationId: e.target.value.trim() }))}
                  className="font-mono text-left"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  معرف تكامل Kiosk / Fawry من قسم تكاملات الدفع.
                </p>
              </div>

              {/* iFrame ID */}
              <div className="space-y-2 text-right">
                <Label htmlFor="iframeId" className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>معرف الإطار (iFrame ID)</span>
                </Label>
                <Input
                  id="iframeId"
                  type="text"
                  placeholder="مثال: 946485"
                  value={settings.iframeId}
                  onChange={(e) => setSettings((s) => ({ ...s, iframeId: e.target.value.trim() }))}
                  className="font-mono text-left"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  معرف قالب الدفع من: المطورون ➔ إفريم.
                </p>
              </div>

              {/* HMAC Secret */}
              <div className="space-y-2 text-right md:col-span-2">
                <Label htmlFor="hmacSecret" className="font-bold flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <span>مفتاح الأمان (HMAC Secret)</span>
                </Label>
                <Input
                  id="hmacSecret"
                  type="text"
                  placeholder="مثال: 02FE20F3507FA676BDCAFE350D213FCC"
                  value={settings.hmacSecret || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, hmacSecret: e.target.value.trim() }))}
                  className="font-mono text-left text-xs sm:text-sm"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  تأمين إضافي للتحقق من إشعارات الدفع (المطورون ➔ مفاتيح API ➔ مفتاح HMAC).
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={saving} className="px-6 gap-2 font-bold">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جارٍ الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>حفظ إعدادات بوابة الدفع</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Paymob Configuration Guide Card */}
      <Card className="border border-border/80 bg-card shadow-sm text-right">
        <CardHeader>
          <CardTitle className="text-lg font-bold font-headline flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span>روابط التوجيه والإشعارات لإدخالها في لوحة Paymob</span>
          </CardTitle>
          <CardDescription>
            انسخ الروابط التالية والصقها في إعدادات التكامل (Payment Integration) داخل لوحة Paymob لتفعيل التوجيه والتفعيل التلقائي:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Redirection / Callback URL */}
          <div className="p-4 rounded-xl border bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">
                1. رابط إعادة التوجيه بعد الدفع (Response / Redirection URL):
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-semibold"
                onClick={() => copyToClipboard(callbackUrl, 'callback')}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedKey === 'callback' ? 'تم النسخ!' : 'نسخ'}</span>
              </Button>
            </div>
            <div className="p-2.5 bg-background rounded-lg border font-mono text-xs text-left select-all" dir="ltr">
              {callbackUrl}
            </div>
          </div>

          {/* Webhook / Transaction Processed Callback */}
          <div className="p-4 rounded-xl border bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">
                2. رابط إشعار المعاملة (Transaction Processed Callback / Webhook):
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-semibold"
                onClick={() => copyToClipboard(webhookUrl, 'webhook')}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedKey === 'webhook' ? 'تم النسخ!' : 'نسخ'}</span>
              </Button>
            </div>
            <div className="p-2.5 bg-background rounded-lg border font-mono text-xs text-left select-all" dir="ltr">
              {webhookUrl}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
