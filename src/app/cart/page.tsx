
'use client';

import { useCart } from '@/context/CartContext';
import { useMarket } from '@/context/MarketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Trash2, ShoppingCart, Minus, Plus, MessageCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

const t = {
  cartTitle: 'سلة المشتريات',
  cartEmpty: 'سلتك فارغة حاليًا.',
  browseProducts: 'تصفح المنتجات',
  product: 'المنتج',
  price: 'السعر',
  quantity: 'الكمية',
  total: 'الإجمالي',
  orderSummary: 'ملخص الطلب',
  subtotal: 'المجموع الفرعي',
  shipping: 'الشحن',
  shippingNote: 'سيتم تحديده مع البائع',
  grandTotal: 'المجموع الكلي',
  checkout: 'إتمام الطلب عبر واتساب',
  removeItem: 'إزالة المنتج',
  // WhatsApp message translations
  invoiceTitle: "طلب شراء جديد من متجر",
  invoiceSeparator: "-----------------------------------",
  productsHeader: "*المنتجات المطلوبة:*",
  quantityLabel: "الكمية",
  priceLabel: "السعر",
  totalLabel: "الإجمالي",
  productCodeLabel: "كود المنتج",
  summaryHeader: "*ملخص الطلب:*",
  subtotalLabel: "المجموع الفرعي",
  shippingLabel: "الشحن",
  shippingValue: "يتم تحديده مع البائع",
  grandTotalLabel: "*المجموع الإجمالي*",
  invoiceFooter: "الرجاء تأكيد الطلب وتزويدي بتفاصيل التوصيل والدفع. شكراً لك!",
  orderSent: "تم إرسال الطلب!",
  orderSentDesc: "تم توجيهك إلى واتساب لإرسال طلبك.",
  sellerPhoneNotAvailable: "رقم هاتف البائع غير متوفر أو لم يتم التحقق منه.",
  preparingOrder: "جارٍ تحضير الطلب...",
  errorTitle: "خطأ",
  checkoutError: "حدث خطأ غير متوقع أثناء معالجة الطلب.",
  popupBlocked: "فشل فتح نافذة واتساب. الرجاء التأكد من السماح بالنوافذ المنبثقة.",
};

// ⭐ دالة إنشاء رابط معاينة داخل موقعك
function createPreviewUrl(productId: string, userId: string) {
  return `https://arb-soq.allqaqasyana.com/ad/${userId}/${productId}`;
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { market } = useMarket();
  const { getUserById } = useAuth();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const currencyFormatter = new Intl.NumberFormat(
    'ar-SA',
    {
      style: 'currency',
      currency: market.currency,
      maximumFractionDigits: 2,
      numberingSystem: 'latn',
    }
  );

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price || 0) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);
  
    try {
      const firstItem = cart[0];
      // Always fetch the latest seller profile at the moment of checkout.
      const sellerProfile = await getUserById(firstItem.userId);
  
      if (!sellerProfile || !sellerProfile.phoneNumber || !sellerProfile.phoneVerified) {
        toast({
          title: t.errorTitle,
          description: t.sellerPhoneNotAvailable,
          variant: "destructive",
        });
        return;
      }
      
      const sellerPhone = sellerProfile.phoneNumber;
      const storeName = sellerProfile.store?.storeName || '';
      
      const previewUrl = createPreviewUrl(firstItem.id, firstItem.userId);
  
      const productDetails = cart.map((item, index) => {
        const itemTotal = (item.price || 0) * item.quantity;
        const productCodeLine = item.productCode ? `   - ${t.productCodeLabel}: ${item.productCode}\n` : '';
        return `${index + 1}. *${item.title}*\n${productCodeLine}   - ${t.quantityLabel}: ${item.quantity}\n   - ${t.priceLabel}: ${item.price || 0} ${market.currency}\n   - ${t.totalLabel}: ${itemTotal} ${market.currency}`;
      }).join('\n\n');
  
      const messageParts = [
        previewUrl,
        "",
        `*${t.invoiceTitle} "${storeName}"*`,
        t.invoiceSeparator,
        t.productsHeader,
        productDetails,
        t.invoiceSeparator,
        t.summaryHeader,
        `- ${t.subtotalLabel}: ${subtotal} ${market.currency}`,
        `- ${t.shippingLabel}: ${t.shippingValue}`,
        t.invoiceSeparator,
        `${t.grandTotalLabel}: *${subtotal} ${market.currency}*`,
        '',
        t.invoiceFooter
      ];
      
      const message = messageParts.filter(part => part !== undefined && part !== null).join('\n');
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${sellerPhone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
      
      const newWindow = window.open(whatsappUrl, '_blank');
      
      if (newWindow) {
        toast({
            title: t.orderSent,
            description: t.orderSentDesc,
        });
        // Clear cart only after successfully opening the window.
        clearCart();
      } else {
        toast({
            title: t.errorTitle,
            description: t.popupBlocked,
            variant: "destructive"
        });
      }
  
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: t.errorTitle,
        description: t.checkoutError,
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  if (cart.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-background py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold mb-4">{t.cartEmpty}</h1>
            <Button asChild size="lg">
              <Link href="/">{t.browseProducts}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">{t.cartTitle}</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item.id} className="flex items-center p-4 gap-4">
                  <Image
                    src={item.imageUrls?.[0] || item.imageUrl || '/placeholder.png'}
                    alt={item.title}
                    width={100}
                    height={100}
                    className="rounded-md object-cover w-24 h-24"
                  />
                  <div className="flex-1">
                    <Link href={`/ad/${item.userId}/${item.id}`} className="font-semibold hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-primary font-medium mt-1">
                      {currencyFormatter.format(item.price || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                   <p className="font-bold text-right w-24">
                        {currencyFormatter.format((item.price || 0) * item.quantity)}
                   </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={t.removeItem}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </Card>
              ))}
            </div>
            <Card className="lg:col-span-1 sticky top-24">
              <CardHeader>
                <CardTitle>{t.orderSummary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.subtotal}</span>
                  <span>{currencyFormatter.format(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.shipping}</span>
                  <span className="text-sm">{t.shippingNote}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>{t.grandTotal}</span>
                  <span>{currencyFormatter.format(subtotal)}</span>
                </div>
                <Button size="lg" className="w-full gap-2" onClick={handleCheckout} disabled={isCheckingOut}>
                  {isCheckingOut ? (
                    <Loader2 className="h-5 w-5 animate-spin"/>
                  ) : (
                    <MessageCircle className="h-5 w-5" />
                  )}
                  {isCheckingOut ? t.preparingOrder : t.checkout}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
