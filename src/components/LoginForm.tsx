
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path fill="#4285F4" d="M22.052 12.182c0-.818-.073-1.636-.209-2.455H12v4.654h5.64c-.245 1.5-1.077 2.777-2.396 3.66v3.018h3.868c2.26-2.086 3.56-5.177 3.56-8.877z"/>
        <path fill="#34A853" d="M12 23c3.245 0 5.968-1.077 7.955-2.918l-3.868-3.018c-1.077.723-2.455 1.15-4.087 1.15-3.14 0-5.8-2.11-6.75-4.96H1.36v3.104C3.322 20.332 7.364 23 12 23z"/>
        <path fill="#FBBC05" d="M5.25 14.04c-.16-.482-.25-.99-.25-1.54s.09-.1.06.25-1.56l-3.89 3.104C.59 14.632 0 13.355 0 12s.59-2.632 1.61-3.664l3.89 3.104c.16.48.25.99.25 1.54z"/>
        <path fill="#EA4335" d="M12 4.85c1.75 0 3.33.604 4.58 1.814l3.42-3.418C17.96.97 15.245 0 12 0 7.364 0 3.322 2.668 1.36 6.232l3.89 3.104C6.2 6.43 8.86 4.85 12 4.85z"/>
    </svg>
);

const translations = {
    ar: {
        googleButton: "تسجيل الدخول باستخدام Google",
        googleLoading: "جارٍ التحميل...",
        loginSuccess: "تم تسجيل الدخول بنجاح!",
        welcome: "أهلاً بك.",
        loginFailed: "فشل تسجيل الدخول",
        googleLoginFailedDesc: "لم نتمكن من تسجيل دخولك باستخدام Google. حاول مرة أخرى.",
    },
    en: {
        googleButton: "Sign in with Google",
        googleLoading: "Loading...",
        loginSuccess: "Logged in successfully!",
        welcome: "Welcome back.",
        loginFailed: "Login Failed",
        googleLoginFailedDesc: "Could not sign you in with Google. Please try again.",
    }
}

export default function LoginForm() {
  const { toast } = useToast();
  const { signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Redirection is handled in AuthContext
    } catch (error) {
       toast({
        title: t.loginFailed,
        description: t.googleLoginFailedDesc,
        variant: 'destructive',
      });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" className="w-full" size="lg" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
            {isGoogleLoading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> {t.googleLoading}</> : <><GoogleIcon className="mr-2 h-5 w-5" /> {t.googleButton}</>}
        </Button>
    </div>
  );
}
