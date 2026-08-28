# SMSGatewayApp API

## Auth
- Query/body param: `token=SECRET123` (replace if customized)
- Optional HMAC headers for extra security:
  - `X-Timestamp`: unix seconds
  - `X-Signature`: hex(HMAC-SHA256(secret, canonicalString))
  - `X-Signature-Alg`: `HMAC-SHA256`

Canonical string to sign:
```
{timestamp}\n{HTTP_METHOD}\n{PATH}\n{payload}
```
- For GET: payload = raw query string (without leading `?`)
- For POST(JSON): payload = raw JSON body

Secret: configurable in app preferences (`hmac_secret`, default `HMACSECRET123`).

---

## Endpoints

### POST /send
Content-Type: application/json

Body:
```json
{
  "phone": "+201234567890",
  "code": "123456",
  "sim": 1,
  "token": "SECRET123",
  "idempotencyKey": "abc123",
  "webhook": "https://example.com/hook"
}
```

Response:
- 200 `{ "status": "ok" }`
- 200 `{ "status": "duplicate" }` if same `idempotencyKey` already processed
- 4xx/5xx `{ "status": "error", "message": "..." }`

Example cURL:
```bash
TS=$(date +%s)
BODY='{"phone":"+201234567890","code":"123456","sim":1,"token":"SECRET123","idempotencyKey":"abc123"}'
SIG=$(printf "%s\nPOST\n/send\n%s" "$TS" "$BODY" | openssl dgst -sha256 -hmac "HMACSECRET123" -hex | sed 's/^.* //')
curl -X POST "http://<PHONE-IP>:8080/send" \
  -H "Content-Type: application/json" \
  -H "X-Timestamp: $TS" \
  -H "X-Signature: $SIG" \
  -H "X-Signature-Alg: HMAC-SHA256" \
  -d "$BODY"
```

### GET /send
Query params: `phone`, `code`, `sim`, `token`, `idempotencyKey`, `webhook`

Example:
```bash
TS=$(date +%s)
QP='phone=%2B201234567890&code=123456&sim=1&token=SECRET123'
SIG=$(printf "%s\nGET\n/send\n%s" "$TS" "$QP" | openssl dgst -sha256 -hmac "HMACSECRET123" -hex | sed 's/^.* //')
curl "http://<PHONE-IP>:8080/send?$QP" \
  -H "X-Timestamp: $TS" \
  -H "X-Signature: $SIG" \
  -H "X-Signature-Alg: HMAC-SHA256"
```

---

## Webhook Callback
- Method: POST
- Body(JSON):
```json
{ "success": true, "phone": "+201234567890", "code": "123456", "sim": 1 }
```
- On failure:
```json
{ "success": false, "phone": "+201234567890", "code": "123456", "sim": 1, "error": "..." }
```
- Headers include HMAC:
  - `X-Timestamp`, `X-Signature`, `X-Signature-Alg: HMAC-SHA256`
- Canonical string: `TS + "\nPOST\n/webhook\n" + payload`

Verification (Node.js example):
```js
const crypto = require('crypto');
function verify(ts, sig, body, secret){
  const str = `${ts}\nPOST\n/webhook\n${body}`;
  const expected = crypto.createHmac('sha256', secret).update(str).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected,'hex'), Buffer.from(sig,'hex'));
}
```

---

## SDK Examples

### Node.js
```js
const fetch = require('node-fetch');
const crypto = require('crypto');
async function send(phone, code, sim=1){
  const ts = Math.floor(Date.now()/1000);
  const body = JSON.stringify({phone, code, sim, token:'SECRET123'});
  const str = `${ts}\nPOST\n/send\n${body}`;
  const sig = crypto.createHmac('sha256','HMACSECRET123').update(str).digest('hex');
  const r = await fetch('http://<PHONE-IP>:8080/send',{
    method:'POST', headers:{'Content-Type':'application/json','X-Timestamp':ts,'X-Signature':sig,'X-Signature-Alg':'HMAC-SHA256'}, body
  });
  return r.json();
}
```

### PHP
```php
<?php
$ts = time();
$body = json_encode(["phone"=>"+201234567890","code"=>"123456","sim"=>1,"token"=>"SECRET123"]);
$data = $ts."\nPOST\n/send\n".$body;
$sig = hash_hmac('sha256', $data, 'HMACSECRET123');
$ch = curl_init('http://<PHONE-IP>:8080/send');
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json","X-Timestamp: $ts","X-Signature: $sig","X-Signature-Alg: HMAC-SHA256"]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$resp = curl_exec($ch);
?>
```

### Python
```python
import time, hmac, hashlib, requests, json
secret=b'HMACSECRET123'
ts=str(int(time.time()))
body=json.dumps({"phone":"+201234567890","code":"123456","sim":1,"token":"SECRET123"})
msg=f"{ts}\nPOST\n/send\n{body}".encode()
sig=hmac.new(secret,msg,hashlib.sha256).hexdigest()
r=requests.post('http://<PHONE-IP>:8080/send',headers={'Content-Type':'application/json','X-Timestamp':ts,'X-Signature':sig,'X-Signature-Alg':'HMAC-SHA256'},data=body)
print(r.text)
```

---

## أخطاء شائعة
- 403 Unauthorized: token غير صحيح
- error: invalid signature: توقيع HMAC غير مطابق
- error: timestamp skew: فرق وقت كبير (>5 دقائق)
- missing phone or code: حقول ناقصة
- status duplicate: تم استخدام نفس idempotencyKey سابقًا
