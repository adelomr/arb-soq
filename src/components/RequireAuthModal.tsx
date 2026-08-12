'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

interface RequireAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  redirectUrl?: string;
}

export default function RequireAuthModal({
  isOpen,
  onClose,
  message = "يجب تسجيل الدخول حتى تتمكن من إضافة إعلان",
  redirectUrl = "/submit",
}: RequireAuthModalProps) {
  const router = useRouter();

  const handleConfirm = () => {
    onClose();
    router.push(`/login?redirectUrl=${encodeURIComponent(redirectUrl)}`);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md text-right font-body" dir="rtl">
        <AlertDialogHeader className="text-right">
          <AlertDialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground font-headline">
            <LogIn className="h-5 w-5 text-primary" />
            <span>تسجيل الدخول مطلوب</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row-reverse items-center justify-start gap-2 mt-4">
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 px-5"
          >
            موافق
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={onClose}
            className="font-semibold border-border hover:bg-secondary mt-0"
          >
            إلغاء
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
