import { redirect } from 'next/navigation';

// /admin/login لا وجود له — يُعيد التوجيه لصفحة الدخول الرئيسية
export default function AdminLoginRedirect() {
  redirect('/login');
}
