// script to seed a test blog post with contact buttons
const { initializeApp } = require('firebase/app');
const { getFirestore, addDoc, collection, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDpWBWFpS7NWvkAGR2FZlrH901qVwB0Iww",
  authDomain: "arb-soq.firebaseapp.com",
  databaseURL: "https://arb-soq-default-rtdb.firebaseio.com",
  projectId: "arb-soq",
  storageBucket: "arb-soq.firebasestorage.app",
  messagingSenderId: "264703833176",
  appId: "1:264703833176:web:a66bad059758a42fc3862d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HTML content with both old-style contact buttons (stored before our fix)
// AND new-style nodes to test both render correctly
const testContent = `
<h2>اختبار أزرار التواصل الاحترافية</h2>
<p>هذا موضوع تجريبي لاختبار أزرار الواتساب والاتصال الاحترافية في الموقع.</p>
<p>يمكنك الاختبار بالنقر على الأزرار أدناه للتأكد من أنها تعمل بشكل صحيح.</p>
<h3>أزرار التواصل الجديدة (نمط span[data-contact-btn])</h3>
<p>
  <span class="contact-btn-custom" data-contact-btn="whatsapp" data-phone="966555123456" data-text="راسلنا على واتساب" contenteditable="false"><span style="pointer-events: none;">📱 راسلنا على واتساب</span></span>&nbsp;
  <span class="contact-btn-custom" data-contact-btn="call" data-phone="+966555123456" data-text="اتصل بنا الآن" contenteditable="false"><span style="pointer-events: none;">📞 اتصل بنا الآن</span></span>
</p>
<h3>أزرار التواصل القديمة (نمط a.contact-btn-wrapper)</h3>
<p>
  <a href="https://wa.me/966555123456" target="_blank" rel="noopener noreferrer" class="contact-btn-wrapper"><span class="contact-btn-custom" data-contact-btn="whatsapp" data-href="https://wa.me/966555123456" data-label="واتساب" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;border-radius:10px;padding:8px 16px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;">📱 واتساب</span></a>&nbsp;
  <a href="tel:+966555123456" class="contact-btn-wrapper"><span class="contact-btn-custom" data-contact-btn="call" data-href="tel:+966555123456" data-label="اتصال" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;border-radius:10px;padding:8px 16px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;">📞 اتصال</span></a>
</p>
<p>نحن هنا لخدمتك على مدار الساعة. لا تتردد في التواصل معنا عبر أي من الوسائل المتاحة.</p>
<h3>زر التحميل الاحترافي</h3>
<p>
  <span data-download-btn="true" data-url="https://www.example.com/brochure.pdf" data-text="تحميل الكتالوج" class="download-btn-custom" contenteditable="false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-left: 6px; pointer-events: none;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span style="pointer-events: none;">تحميل الكتالوج</span></span>
</p>
`;

async function seedTestPost() {
  try {
    const ref = await addDoc(collection(db, 'blogs'), {
      slug: 'test-contact-buttons-2024',
      title: 'اختبار أزرار التواصل الاحترافية - واتساب واتصال وتحميل',
      content: testContent,
      author: 'فريق الاختبار',
      tags: ['اختبار', 'أزرار', 'واتساب'],
      views: 0,
      createdAt: serverTimestamp(),
    });
    console.log('✅ Test blog post created with ID:', ref.id);
    console.log('🔗 View at: http://localhost:3000/blog/test-contact-buttons-2024');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedTestPost();
