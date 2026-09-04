const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Firestore } = require('@google-cloud/firestore');
require('dotenv').config();

const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  proto,
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 5005;
const AUTH_DIR = path.join(__dirname, 'auth_session');
const FIRESTORE_COLLECTION = process.env.WHATSAPP_SESSION_COLLECTION || 'whatsapp_gateway_session';

app.use(cors());
app.use(express.json());

// ── تهيئة Firestore للتخزين السحابي الدائم ──
let firestore = null;
try {
  firestore = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'arb-soq',
  });
  console.log(`[Firestore Session] Firestore client initialized (Collection: ${FIRESTORE_COLLECTION})`);
} catch (e) {
  console.warn('[Firestore Session] Firestore init warning:', e.message);
}

// ذاكرة تخزين مؤقتة سريعة في الرام (In-Memory Cache)
const memoryKeysCache = new Map();
const msgRetryCounterCache = new Map();
const sentMessagesStore = new Map();

/**
 * استرجاع النسخة الاحتياطية للجلسة من Firestore عند تشغيل حاوية سحابية جديدة
 */
async function restoreAuthFromFirestore() {
  if (!firestore) return;
  try {
    const doc = await firestore.collection(FIRESTORE_COLLECTION).doc('session_backup').get();
    if (doc.exists && doc.data()?.files) {
      if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
      const files = doc.data().files;
      for (const [filename, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(AUTH_DIR, filename), content, 'utf8');
      }
      console.log(`[Firestore Auth] Restored ${Object.keys(files).length} session files from cloud backup.`);
    }
  } catch (err) {
    console.warn('[Firestore Auth] Restore warning:', err.message);
  }
}

/**
 * حفظ نسخة احتياطية من ملفات الجلسة في Firestore
 */
async function backupAuthToFirestore() {
  if (!firestore || !fs.existsSync(AUTH_DIR)) return;
  try {
    const filenames = fs.readdirSync(AUTH_DIR);
    const files = {};
    for (const file of filenames) {
      if (file.endsWith('.json')) {
        files[file] = fs.readFileSync(path.join(AUTH_DIR, file), 'utf8');
      }
    }
    if (Object.keys(files).length > 0) {
      await firestore.collection(FIRESTORE_COLLECTION).doc('session_backup').set({
        files,
        updatedAt: new Date(),
      });
      console.log(`[Firestore Auth] Synced ${Object.keys(files).length} session files to Firestore.`);
    }
  } catch (err) {
    console.warn('[Firestore Auth] Backup warning:', err.message);
  }
}

/**
 * مسح شامل لكافة ملفات الجلسات القديمة محلياً وسحابياً لإنشاء جلسة نظيفة 100%
 */
async function clearAllSessionStorage() {
  console.log('[WhatsApp Gateway] Clearing all local and cloud session data...');
  msgRetryCounterCache.clear();
  sentMessagesStore.clear();

  // تنظيف القرص المحلي
  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
  } catch (e) {}

  // تنظيف Firestore
  if (firestore) {
    try {
      const snapshot = await firestore.collection(FIRESTORE_COLLECTION).get();
      if (!snapshot.empty) {
        const batch = firestore.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`[Firestore Auth] Cleared ${snapshot.size} session docs from Firestore.`);
      }
    } catch (err) {
      console.warn('[Firestore Auth] Clear warning:', err.message);
    }
  }
}

// ── حالة الاتصال والـ QR الحالية ──
let sock = null;
let currentQR = null;
let connectionStatus = 'disconnected'; // 'connecting' | 'connected' | 'qr_ready' | 'disconnected'
let connectedNumber = null;
let isConnecting = false;
let reconnectAttempts = 0;

// دالة تنسيق رقم الهاتف ليصبح JID صالح لواتساب
function formatPhoneToJid(phone) {
  let cleaned = String(phone).replace(/[^\d]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // إزالة الصفر الزائد بعد كود الدولة تلقائياً (مثل 2001... أو 96605... أو 97105...)
  if (cleaned.startsWith('2001') && cleaned.length === 13) {
    cleaned = '20' + cleaned.substring(3);
  } else if (cleaned.startsWith('96605') && cleaned.length === 14) {
    cleaned = '966' + cleaned.substring(4);
  } else if (cleaned.startsWith('97105') && cleaned.length === 14) {
    cleaned = '971' + cleaned.substring(4);
  } else if (cleaned.startsWith('9650') && cleaned.length === 12) {
    cleaned = '965' + cleaned.substring(4);
  }

  if (/^01[0125]\d{8}$/.test(cleaned)) {
    cleaned = '2' + cleaned;
  } else if (/^05\d{8}$/.test(cleaned)) {
    cleaned = '966' + cleaned.substring(1);
  } else if (/^05[024568]\d{7}$/.test(cleaned)) {
    cleaned = '971' + cleaned.substring(1);
  }

  return cleaned + '@s.whatsapp.net';
}

/**
 * دالة الانتظار الذكي لجاهزية الاتصال
 * تتيح إرسال الرسائل فوراً بمجرد استيقاظ السيرفر دون إرجاع خطأ 503
 */
async function waitForConnection(timeoutMs = 12000) {
  if (connectionStatus === 'connected' && sock) return true;

  if (!isConnecting && connectionStatus !== 'connected') {
    connectToWhatsApp().catch((err) => console.error('[WhatsApp Gateway] Auto-connect trigger error:', err));
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (connectionStatus === 'connected' && sock) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return connectionStatus === 'connected' && !!sock;
}

// ── بدء وتشغيل اتصال واتساب الرسمي بـ MultiFileAuth ──
async function connectToWhatsApp() {
  if (isConnecting) {
    console.log('[WhatsApp Gateway] Connection attempt already in progress. Skipping duplicate.');
    return;
  }

  isConnecting = true;
  connectionStatus = 'connecting';

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // محاولة الاسترجاع السحابي إذا كان المجلد فارغاً
    if (fs.readdirSync(AUTH_DIR).length === 0) {
      await restoreAuthFromFirestore();
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1015901307],
      isLatest: true,
    }));

    const logger = pino({ level: 'info' });
    console.log(`[WhatsApp Gateway] Connecting with Baileys v${version.join('.')} (isLatest: ${isLatest})...`);

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      retryRequestDelayMs: 2000,
      emitOwnEvents: true,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      msgRetryCounterCache,
      getMessage: async (key) => {
        if (key?.id && sentMessagesStore.has(key.id)) {
          return sentMessagesStore.get(key.id);
        }
        return { conversation: 'رمز تفعيل سوق العرب' };
      },
    });

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      await backupAuthToFirestore();
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        connectionStatus = 'qr_ready';
        console.log('\n========================================');
        console.log('📱 [WhatsApp Gateway] SCAN THIS QR CODE WITH YOUR PHONE:');
        console.log('Or open in browser: http://localhost:' + PORT + '/qr');
        console.log('========================================\n');
        qrcodeTerminal.generate(qr, { small: true });
      }

      if (connection === 'close') {
        isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isExplicitLogout = statusCode === DisconnectReason.loggedOut || statusCode === 401;

        console.log(`[WhatsApp Gateway] Connection closed. StatusCode: ${statusCode}, isExplicitLogout: ${isExplicitLogout}`);
        connectionStatus = 'disconnected';
        currentQR = null;
        connectedNumber = null;

        if (isExplicitLogout) {
          console.log('[WhatsApp Gateway] ⚠️ Device was unlinked from phone. Clearing all old session storage for fresh QR scan...');
          await clearAllSessionStorage();
          reconnectAttempts = 0;
          setTimeout(connectToWhatsApp, 2000);
        } else {
          // إعادة الاتصال التلقائي الدائم (مع الحفاظ الكامل على الجلسة الحالية)
          reconnectAttempts++;
          const delay = statusCode === DisconnectReason.restartRequired ? 1000 : Math.min(reconnectAttempts * 3000, 15000);
          console.log(`[WhatsApp Gateway] 🔄 Auto-reconnecting in ${delay / 1000}s (Attempt #${reconnectAttempts}, Session preserved)...`);
          setTimeout(connectToWhatsApp, delay);
        }
      } else if (connection === 'open') {
        isConnecting = false;
        reconnectAttempts = 0;
        connectionStatus = 'connected';
        currentQR = null;
        connectedNumber = sock?.user?.id?.split(':')[0] || sock?.user?.id?.split('@')[0] || 'Unknown';

        console.log('\n🎉 ========================================');
        console.log(`✅ [WhatsApp Gateway] CONNECTED SUCCESSFULLY!`);
        console.log(`📱 Logged in as: +${connectedNumber}`);
        console.log(`🚀 Gateway API ready on port ${PORT}`);
        console.log('========================================\n');

        // حفظ بيانات الاعتماد فوراً وتحديث النسخة السحابية المحفوظة
        await saveCreds();
        await backupAuthToFirestore();
      }
    });
  } catch (err) {
    isConnecting = false;
    connectionStatus = 'disconnected';
    console.error('[WhatsApp Gateway] Init connection error:', err);
    setTimeout(connectToWhatsApp, 5000);
  }
}

// ── مسارات الـ REST API ──

// 1. فحص حالة السيرفر والاتصال
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    phone: connectedNumber,
    reconnectAttempts,
    timestamp: new Date().toISOString(),
  });
});

// 2. نقطة فحص خفيفة (Health Check)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', connected: connectionStatus === 'connected' });
});

// 3. إعادة الربط اليدوي عند الحاجة
app.post('/reconnect', async (req, res) => {
  console.log('[WhatsApp Gateway] Manual reconnect requested via API');
  if (sock) {
    try {
      sock.end(undefined);
    } catch (e) {}
  }
  isConnecting = false;
  connectToWhatsApp().catch((err) => console.error(err));
  res.json({ success: true, message: 'Reconnection triggered' });
});

// 4. تسجيل خروج يدوي وتنظيف الجلسة
app.post('/logout', async (req, res) => {
  console.log('[WhatsApp Gateway] Manual logout requested via API');
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {}
    try {
      sock.end(undefined);
    } catch (e) {}
  }
  await clearAllSessionStorage();
  isConnecting = false;
  connectionStatus = 'disconnected';
  currentQR = null;
  connectedNumber = null;
  setTimeout(connectToWhatsApp, 1000);
  res.json({ success: true, message: 'Logged out and session cleared. New QR will generate.' });
});

// 5. صفحة ويب لمسح الـ QR Code من المتصفح
app.get('/qr', async (req, res) => {
  if (connectionStatus === 'connected') {
    return res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>سوق العرب - بوابة واتساب</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; border-radius: 24px; padding: 40px; text-align: center; max-width: 420px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); border: 1px solid #334155; }
            .badge { background: #10b981; color: #fff; padding: 6px 16px; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 16px; }
            h1 { margin: 0 0 10px; font-size: 24px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .phone { font-family: monospace; font-size: 20px; color: #38bdf8; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✅ متصل بنجاح</div>
            <h1>بوابة واتساب سوق العرب جاهزة</h1>
            <p>تم ربط السيرفر بنجاح بحساب واتساب الخاص بك والجلسة محفوظة سحابياً بشكل دائم.</p>
            <div class="phone">+${connectedNumber}</div>
          </div>
        </body>
      </html>
    `);
  }

  if (!currentQR) {
    return res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="3">
          <title>سوق العرب - جاري تجهيز الرمز</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; border-radius: 24px; padding: 40px; text-align: center; max-width: 420px; border: 1px solid #334155; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>⏳ جارٍ تجهيز رمز الاستجابة السريعة (QR)...</h2>
            <p style="color:#94a3b8;">الحالة الحالية: ${connectionStatus} (سيتم التحديث تلقائياً خلال ثوانٍ)</p>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(currentQR, { width: 320, margin: 2 });
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="20">
          <title>مسح رمز QR - بوابة واتساب سوق العرب</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #1e293b; border-radius: 28px; padding: 36px; text-align: center; max-width: 460px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid #334155; }
            .qr-box { background: #fff; padding: 16px; border-radius: 20px; display: inline-block; margin: 20px 0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); }
            .qr-box img { display: block; border-radius: 8px; width: 280px; height: 280px; }
            h1 { margin: 0 0 8px; font-size: 22px; font-weight: 800; }
            .steps { text-align: right; background: #0f172a; padding: 18px 22px; border-radius: 16px; font-size: 13px; color: #cbd5e1; line-height: 1.8; margin-top: 15px; border: 1px solid #334155; }
            .steps ol { margin: 0; padding-right: 20px; }
            .hint { color: #f59e0b; font-size: 12px; margin-top: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>امسح الرمز لربط واتساب سوق العرب</h1>
            <p style="color:#94a3b8; font-size: 13px; margin: 0;">يتم الربط مرة واحدة وتُحفظ الجلسة سحابياً بشكل دائم</p>
            
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="WhatsApp QR Code" />
            </div>

            <div class="steps">
              <ol>
                <li>افتح تطبيق <strong>واتساب</strong> على هاتفك.</li>
                <li>اضغط على القائمة (الثلاث نقاط) أو الإعدادات ⚙️.</li>
                <li>اختر <strong>الأجهزة المرتبطة (Linked Devices)</strong>.</li>
                <li>اضغط على <strong>ربط جهاز</strong> ووجّه الكاميرا نحو الشاشة.</li>
              </ol>
            </div>

            <div class="hint">🔄 يتم تحديث الرمز تلقائياً كل 20 ثانية</div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error generating QR code');
  }
});

// 6. مسار إرسال رسالة نصية عامة
app.post('/send-message', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    // الانتظار الذكي حتى يتصل السيرفر إذا كان مستيقظاً للتو
    const isReady = await waitForConnection(12000);
    if (!isReady || !sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp Gateway is not connected yet. Please scan the QR code first.',
        status: connectionStatus,
      });
    }

    let jid = formatPhoneToJid(phone);
    const cleanDigits = String(jid).split('@')[0];

    // فحص وتأكيد وجود الرقم على دليل خوادم واتساب وجلب الـ JID الدقيق
    try {
      const checkResults = await sock.onWhatsApp(cleanDigits);
      if (checkResults && checkResults.length > 0 && checkResults[0]?.exists && checkResults[0]?.jid) {
        jid = checkResults[0].jid;
      }
    } catch (checkErr) {
      console.warn('[WhatsApp Gateway] onWhatsApp check warning:', checkErr?.message);
    }

    // تهيئة الجلسة والتواجد الفوري لتسريع التسليم
    try {
      await sock.presenceSubscribe(jid);
      await sock.sendPresenceUpdate('composing', jid);
    } catch (pErr) {}

    const sent = await sock.sendMessage(jid, { text: message });
    if (sent?.key?.id && sent?.message) {
      sentMessagesStore.set(sent.key.id, sent.message);
      if (sentMessagesStore.size > 2000) {
        const firstKey = sentMessagesStore.keys().next().value;
        sentMessagesStore.delete(firstKey);
      }
    }

    return res.json({
      success: true,
      messageId: sent?.key?.id,
      to: jid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WhatsApp Gateway] Send error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send WhatsApp message' });
  }
});

// 7. مسار إرسال كود التفعيل المنسق (OTP)
app.post('/send-otp', async (req, res) => {
  try {
    const { phone, code, appName = 'سوق العرب' } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, error: 'Phone and code are required' });
    }

    // الانتظار الذكي حتى يتصل السيرفر إذا كان مستيقظاً للتو
    const isReady = await waitForConnection(12000);
    if (!isReady || !sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp Gateway is not connected yet. Please scan the QR code first.',
        status: connectionStatus,
      });
    }

    let jid = formatPhoneToJid(phone);
    const cleanDigits = String(jid).split('@')[0];

    // فحص وتأكيد وجود الرقم على دليل خوادم واتساب وجلب الـ JID الدقيق
    try {
      const checkResults = await sock.onWhatsApp(cleanDigits);
      if (checkResults && checkResults.length > 0 && checkResults[0]?.exists && checkResults[0]?.jid) {
        jid = checkResults[0].jid;
      }
    } catch (checkErr) {
      console.warn('[WhatsApp Gateway] onWhatsApp check warning:', checkErr?.message);
    }

    // تهيئة الجلسة والتواجد الفوري لتسريع التسليم وفك التشفير
    try {
      await sock.presenceSubscribe(jid);
      await sock.sendPresenceUpdate('composing', jid);
    } catch (pErr) {}

    const otpMessage = `رمز تفعيل ${appName} الخاص بك هو: \`\`\`${code}\`\`\``;

    const sent = await sock.sendMessage(jid, { text: otpMessage });
    if (sent?.key?.id && sent?.message) {
      sentMessagesStore.set(sent.key.id, sent.message);
      if (sentMessagesStore.size > 2000) {
        const firstKey = sentMessagesStore.keys().next().value;
        sentMessagesStore.delete(firstKey);
      }
    }

    return res.json({
      success: true,
      messageId: sent?.key?.id,
      to: jid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WhatsApp Gateway] Send OTP error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send OTP' });
  }
});

// ── بدء تشغيل الخادم ──
app.listen(PORT, () => {
  console.log(`\n🚀 [WhatsApp Gateway] Server running on http://localhost:${PORT}`);
  console.log(`🔗 Open QR Viewer: http://localhost:${PORT}/qr\n`);
  connectToWhatsApp().catch((err) => {
    console.error('[WhatsApp Gateway] Init error:', err);
  });
});
