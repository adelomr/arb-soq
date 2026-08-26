const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
require('dotenv').config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 5005;
const AUTH_DIR = path.join(__dirname, 'auth_session');

app.use(cors());
app.use(express.json());

// ── حالة الاتصال والـ QR الحالية ──
let sock = null;
let currentQR = null;
let connectionStatus = 'connecting'; // 'connecting' | 'connected' | 'qr_ready' | 'disconnected'
let connectedNumber = null;

// دالة تنسيق رقم الهاتف ليصبح JID صالح لواتساب
function formatPhoneToJid(phone) {
  let cleaned = String(phone).replace(/[^\d]/g, '');

  // إذا بدأ بـ 00 نستبدلها
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // أرقام مصر (تبدأ بـ 01)
  if (/^01[0125]\d{8}$/.test(cleaned)) {
    cleaned = '2' + cleaned;
  }
  // أرقام السعودية (تبدأ بـ 05)
  else if (/^05\d{8}$/.test(cleaned)) {
    cleaned = '966' + cleaned.substring(1);
  }
  // أرقام الإمارات (تبدأ بـ 05)
  else if (/^05[024568]\d{7}$/.test(cleaned)) {
    cleaned = '971' + cleaned.substring(1);
  }

  return cleaned + '@s.whatsapp.net';
}

// ── بدء وتشغيل اتصال واتساب ──
async function connectToWhatsApp() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: true }));

  console.log(`[WhatsApp Gateway] Using Baileys version: ${version.join('.')} (isLatest: ${isLatest})`);

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Arb-Soq Gateway', 'Chrome', '1.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
  });

  sock.ev.on('creds.update', saveCreds);

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
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WhatsApp Gateway] Connection closed. Reason: ${statusCode}, shouldReconnect: ${shouldReconnect}`);
      connectionStatus = 'disconnected';
      currentQR = null;
      connectedNumber = null;

      if (shouldReconnect) {
        console.log('[WhatsApp Gateway] Reconnecting in 5 seconds...');
        setTimeout(connectToWhatsApp, 5000);
      } else {
        console.log('[WhatsApp Gateway] Logged out. Clearing session and regenerating QR...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch (e) {}
        setTimeout(connectToWhatsApp, 2000);
      }
    } else if (connection === 'open') {
      connectionStatus = 'connected';
      currentQR = null;
      connectedNumber = sock?.user?.id?.split(':')[0] || sock?.user?.id?.split('@')[0] || 'Unknown';
      console.log('\n🎉 ========================================');
      console.log(`✅ [WhatsApp Gateway] CONNECTED SUCCESSFULLY!`);
      console.log(`📱 Logged in as: +${connectedNumber}`);
      console.log(`🚀 Gateway API ready on http://localhost:${PORT}`);
      console.log('========================================\n');
    }
  });
}

// ── مسارات الـ REST API ──

// 1. فحص حالة السيرفر والاتصال
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    phone: connectedNumber,
    timestamp: new Date().toISOString(),
  });
});

// 2. صفحة ويب لمسح الـ QR Code من المتصفح
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
            <p>تم ربط السيرفر بنجاح بحساب واتساب الخاص بك ويعمل الآن لاستقبال وإرسال الرسائل والأكواد تلقائياً.</p>
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
            <p style="color:#94a3b8;">سيتم تحديث الصفحة تلقائياً خلال ثوانٍ.</p>
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
            <p style="color:#94a3b8; font-size: 13px; margin: 0;">يتم الربط مرة واحدة فقط لتمكين إرسال أكواد التفعيل والإشعارات</p>
            
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

// 3. مسار إرسال رسالة نصية عامة
app.post('/send-message', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    if (connectionStatus !== 'connected' || !sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp Gateway is not connected yet. Please scan the QR code first.',
        status: connectionStatus,
      });
    }

    const jid = formatPhoneToJid(phone);
    const sent = await sock.sendMessage(jid, { text: message });

    return res.json({
      success: true,
      messageId: sent.key.id,
      to: jid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WhatsApp Gateway] Send error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send WhatsApp message' });
  }
});

// 4. مسار إرسال كود التفعيل المنسق (OTP)
app.post('/send-otp', async (req, res) => {
  try {
    const { phone, code, appName = 'سوق العرب' } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, error: 'Phone and code are required' });
    }

    if (connectionStatus !== 'connected' || !sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp Gateway is not connected yet. Please scan the QR code first.',
        status: connectionStatus,
      });
    }

    const jid = formatPhoneToJid(phone);
    const otpMessage = `*${appName}* 🛒\n\nرمز تفعيل حسابك هو:\n\n*${code}*\n\nيرجى إدخال هذا الرمز في الموقع لتأكيد رقم هاتفك. الرمز صالح لمدة 5 دقائق.\n\n_لا تشارك هذا الرمز مع أي شخص._`;

    const sent = await sock.sendMessage(jid, { text: otpMessage });

    return res.json({
      success: true,
      messageId: sent.key.id,
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
