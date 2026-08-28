# دليل ربط تطبيق SMS Gateway

## 📱 **معلومات الخادم:**
- **المنفذ**: 8080
- **الرابط الأساسي**: `http://<IP-الهاتف>:8080`
- **الرابط المحلي**: `http://127.0.0.1:8080` (للاختبار)

## 🔑 **المصادقة:**
- **الرمز الافتراضي**: `SECRET123`
- **يمكن تغييره من إعدادات التطبيق**

## 📡 **طرق الإرسال:**

### **1. GET Request (بسيط):**
```http
GET http://<IP-الهاتف>:8080/send?phone=%2B201234567890&code=123456&sim=1&token=SECRET123
```

### **2. POST Request (JSON):**
```http
POST http://<IP-الهاتف>:8080/send
Content-Type: application/json

{
  "phone": "+201234567890",
  "code": "123456",
  "sim": 1,
  "token": "SECRET123"
}
```

### **3. POST Request (مع HMAC للأمان):**
```http
POST http://<IP-الهاتف>:8080/send
Content-Type: application/json
X-Timestamp: 1640995200
X-Signature: abc123...
X-Signature-Alg: HMAC-SHA256

{
  "phone": "+201234567890",
  "code": "123456",
  "sim": 1,
  "token": "SECRET123"
}
```

## 💻 **أمثلة الكود:**

### **JavaScript (Fetch):**
```javascript
// GET Request
async function sendSMS(phone, code, sim = 1) {
    const url = `http://<IP-الهاتف>:8080/send?phone=${encodeURIComponent(phone)}&code=${code}&sim=${sim}&token=SECRET123`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log('SMS sent:', result);
        return result;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}

// POST Request
async function sendSMSPost(phone, code, sim = 1) {
    const url = 'http://<IP-الهاتف>:8080/send';
    const data = {
        phone: phone,
        code: code,
        sim: sim,
        token: 'SECRET123'
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log('SMS sent:', result);
        return result;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}
```

### **Python:**
```python
import requests
import json

def send_sms(phone, code, sim=1, server_ip="127.0.0.1"):
    url = f"http://{server_ip}:8080/send"
    
    # GET Request
    params = {
        'phone': phone,
        'code': code,
        'sim': sim,
        'token': 'SECRET123'
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        result = response.json()
        print(f"SMS sent: {result}")
        return result
    except Exception as e:
        print(f"Error sending SMS: {e}")
        raise e

def send_sms_post(phone, code, sim=1, server_ip="127.0.0.1"):
    url = f"http://{server_ip}:8080/send"
    
    data = {
        'phone': phone,
        'code': code,
        'sim': sim,
        'token': 'SECRET123'
    }
    
    try:
        response = requests.post(url, json=data, timeout=10)
        result = response.json()
        print(f"SMS sent: {result}")
        return result
    except Exception as e:
        print(f"Error sending SMS: {e}")
        raise e

# استخدام المثال
send_sms("+201234567890", "123456", 1)
```

### **PHP:**
```php
<?php
function sendSMS($phone, $code, $sim = 1, $serverIP = "127.0.0.1") {
    $url = "http://{$serverIP}:8080/send";
    
    // GET Request
    $params = http_build_query([
        'phone' => $phone,
        'code' => $code,
        'sim' => $sim,
        'token' => 'SECRET123'
    ]);
    
    $fullUrl = $url . '?' . $params;
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 10
        ]
    ]);
    
    $response = file_get_contents($fullUrl, false, $context);
    $result = json_decode($response, true);
    
    echo "SMS sent: " . json_encode($result) . "\n";
    return $result;
}

function sendSMSPost($phone, $code, $sim = 1, $serverIP = "127.0.0.1") {
    $url = "http://{$serverIP}:8080/send";
    
    $data = [
        'phone' => $phone,
        'code' => $code,
        'sim' => $sim,
        'token' => 'SECRET123'
    ];
    
    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode($data),
            'timeout' => 10
        ]
    ];
    
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    $result = json_decode($response, true);
    
    echo "SMS sent: " . json_encode($result) . "\n";
    return $result;
}

// استخدام المثال
sendSMS("+201234567890", "123456", 1);
?>
```

### **cURL:**
```bash
# GET Request
curl "http://<IP-الهاتف>:8080/send?phone=%2B201234567890&code=123456&sim=1&token=SECRET123"

# POST Request
curl -X POST "http://<IP-الهاتف>:8080/send" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+201234567890","code":"123456","sim":1,"token":"SECRET123"}'
```

## 📋 **المعاملات:**

| المعامل | النوع | مطلوب | الوصف |
|---------|-------|--------|--------|
| `phone` | string | ✅ | رقم الهاتف مع رمز الدولة |
| `code` | string | ✅ | كود التفعيل |
| `sim` | integer | ❌ | رقم الشريحة (1 أو 2) |
| `token` | string | ✅ | رمز المصادقة |
| `idempotencyKey` | string | ❌ | مفتاح منع التكرار |
| `webhook` | string | ❌ | رابط webhook للإشعارات |

## 📤 **الاستجابات:**

### **نجح الإرسال:**
```json
{
  "status": "ok"
}
```

### **فشل الإرسال:**
```json
{
  "status": "error",
  "message": "error description"
}
```

### **طلب مكرر:**
```json
{
  "status": "duplicate"
}
```

## 🔒 **الأمان (HMAC):**

### **JavaScript (CryptoJS):**
```javascript
const crypto = require('crypto-js');

function generateHMAC(secret, timestamp, method, path, body) {
    const stringToSign = `${timestamp}\n${method}\n${path}\n${body}`;
    return crypto.HmacSHA256(stringToSign, secret).toString();
}

// استخدام المثال
const timestamp = Math.floor(Date.now() / 1000);
const secret = 'HMACSECRET123';
const method = 'POST';
const path = '/send';
const body = JSON.stringify({phone: '+201234567890', code: '123456', sim: 1, token: 'SECRET123'});

const signature = generateHMAC(secret, timestamp, method, path, body);

fetch('http://<IP-الهاتف>:8080/send', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        'X-Signature-Alg': 'HMAC-SHA256'
    },
    body: body
});
```

## 🌐 **فحص الحالة:**
```http
GET http://<IP-الهاتف>:8080/health
```

**الاستجابة:**
```json
{
  "status": "up"
}
```

## ⚠️ **ملاحظات مهمة:**

1. **تأكد من أن الهاتف متصل بنفس الشبكة**
2. **استخدم IP الهاتف الحقيقي بدلاً من 127.0.0.1**
3. **تأكد من منح صلاحية SEND_SMS للتطبيق**
4. **تأكد من وجود رصيد كافي في الشريحة**
5. **استخدم رمز المصادقة الصحيح**

## 🔧 **استكشاف الأخطاء:**

### **خطأ 403 Unauthorized:**
- تحقق من رمز المصادقة
- تأكد من صحة HMAC (إذا استخدمته)

### **خطأ 500 Internal Server Error:**
- تحقق من صلاحيات التطبيق
- تأكد من وجود شريحة SIM نشطة
- تحقق من الرصيد

### **خطأ Connection Refused:**
- تأكد من تشغيل الخادم
- تحقق من IP الهاتف
- تأكد من اتصال الشبكة
