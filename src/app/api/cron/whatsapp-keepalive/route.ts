import { NextResponse } from 'next/server';
import { pingWhatsAppGatewayKeepAlive, checkWhatsAppGatewayStatus } from '@/lib/whatsapp-gateway-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const pingResult = await pingWhatsAppGatewayKeepAlive();
    const statusResult = await checkWhatsAppGatewayStatus();

    return NextResponse.json({
      success: pingResult.success,
      timestamp: new Date().toISOString(),
      server: {
        url: pingResult.url,
        latencyMs: pingResult.latencyMs,
        status: statusResult.status,
        connected: statusResult.connected,
        phone: statusResult.phone || null,
      },
      message: statusResult.connected
        ? 'سيرفر واتساب السحابي نشط وجلسة واتساب متصلة بنجاح 🟢'
        : 'سيرفر واتساب مستيقظ ونشط ولكن يحتاج مسح QR Code لربط الحساب 🟡',
      qrUrl: `${pingResult.url}/qr`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to keep-alive whatsapp gateway',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
