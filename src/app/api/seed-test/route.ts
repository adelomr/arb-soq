import { createBlogPost, generateSlug } from '@/lib/blog-service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const testContent = `<h2>اختبار أزرار التواصل الاحترافية</h2>
<p>هذا موضوع تجريبي لاختبار أزرار الواتساب والاتصال الاحترافية في الموقع.</p>
<p>يمكنك النقر على الأزرار أدناه للتأكد من أنها تعمل بشكل صحيح وتفتح واتساب أو الاتصال مباشرةً.</p>
<h3>أزرار التواصل الجديدة</h3>
<p>
<span class="contact-btn-custom" data-contact-btn="whatsapp" data-phone="966590454131" data-text="راسلنا على واتساب" contenteditable="false"><span style="pointer-events: none;">📱 راسلنا على واتساب</span></span>&nbsp;&nbsp;
<span class="contact-btn-custom" data-contact-btn="call" data-phone="0590454131" data-text="اتصل بنا الآن" contenteditable="false"><span style="pointer-events: none;">📞 اتصل بنا الآن</span></span>
</p>
<p>نحن هنا لخدمتك على مدار الساعة طوال أيام الأسبوع. لا تتردد في التواصل معنا عبر أي من الوسائل المتاحة.</p>
<h3>معلومات إضافية</h3>
<p>يتيح لك محرر المقالات الجديد إدراج أزرار التواصل المخصصة بشكل احترافي داخل أي مقال أو صفحة.</p>`;

  try {
    const slug = generateSlug('اختبار أزرار التواصل الاحترافية');
    const id = await createBlogPost({
      slug: 'test-contact-buttons',
      title: 'اختبار أزرار التواصل - واتساب واتصال احترافي',
      content: testContent,
      author: 'فريق الاختبار',
      tags: ['اختبار', 'أزرار', 'تواصل'],
      views: 0,
    });
    return NextResponse.json({ 
      success: true, 
      id,
      url: '/blog/test-contact-buttons',
      message: 'تم إنشاء الموضوع التجريبي بنجاح'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
