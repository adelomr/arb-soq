// Test blog post seeder using firebase-admin
const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: "arb-soq",
};

// Try to initialize with application default credentials
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'arb-soq',
  });
} catch(e) {
  // If no service account, fall back to using client SDK approach
  console.log('Admin SDK not available, using REST API instead...');
  
  const https = require('https');
  
  const testContent = `<h2>اختبار أزرار التواصل الاحترافية</h2>
<p>هذا موضوع تجريبي لاختبار أزرار الواتساب والاتصال الاحترافية في الموقع.</p>
<h3>أزرار الاتصال المحسّنة</h3>
<p>
<span class="contact-btn-custom" data-contact-btn="whatsapp" data-phone="966555123456" data-text="راسلنا على واتساب" contenteditable="false"><span style="pointer-events: none;">📱 راسلنا على واتساب</span></span>&nbsp;
<span class="contact-btn-custom" data-contact-btn="call" data-phone="+966555123456" data-text="اتصل بنا الآن" contenteditable="false"><span style="pointer-events: none;">📞 اتصل بنا الآن</span></span>
</p>
<p>نحن هنا لخدمتك على مدار الساعة.</p>`;

  const postData = JSON.stringify({
    fields: {
      slug: { stringValue: 'test-contact-buttons' },
      title: { stringValue: 'اختبار أزرار التواصل - واتساب واتصال' },
      content: { stringValue: testContent },
      author: { stringValue: 'فريق الاختبار' },
      tags: { arrayValue: { values: [{ stringValue: 'اختبار' }, { stringValue: 'أزرار' }] } },
      views: { integerValue: '0' },
    }
  });

  const options = {
    hostname: 'firestore.googleapis.com',
    path: '/v1/projects/arb-soq/databases/(default)/documents/blogs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const doc = JSON.parse(data);
        console.log('✅ Test blog post created:', doc.name);
        console.log('🔗 View at: http://localhost:3000/blog/test-contact-buttons');
      } else {
        console.log('⚠️ Status:', res.statusCode);
        console.log(data.substring(0, 500));
      }
    });
  });

  req.on('error', (e) => console.error('Error:', e));
  req.write(postData);
  req.end();
  return;
}

// Admin SDK path
const db = admin.firestore();

const testContent = `<h2>اختبار أزرار التواصل الاحترافية</h2>
<p>هذا موضوع تجريبي لاختبار أزرار الواتساب والاتصال الاحترافية في الموقع.</p>
<h3>أزرار الاتصال المحسّنة (نمط جديد)</h3>
<p>
<span class="contact-btn-custom" data-contact-btn="whatsapp" data-phone="966555123456" data-text="راسلنا على واتساب" contenteditable="false"><span style="pointer-events: none;">📱 راسلنا على واتساب</span></span>&nbsp;
<span class="contact-btn-custom" data-contact-btn="call" data-phone="+966555123456" data-text="اتصل بنا الآن" contenteditable="false"><span style="pointer-events: none;">📞 اتصل بنا الآن</span></span>
</p>
<p>نحن هنا لخدمتك على مدار الساعة.</p>`;

db.collection('blogs').add({
  slug: 'test-contact-buttons',
  title: 'اختبار أزرار التواصل - واتساب واتصال',
  content: testContent,
  author: 'فريق الاختبار',
  tags: ['اختبار', 'أزرار'],
  views: 0,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
}).then(ref => {
  console.log('✅ Created:', ref.id);
  console.log('🔗 View at: http://localhost:3000/blog/test-contact-buttons');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
