"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Copy, Check } from "lucide-react"

function ToastCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="نسخ نص الرسالة"
      className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-all cursor-pointer font-medium mt-1 w-fit border border-current/20"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span>تم النسخ!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>نسخ الرسالة</span>
        </>
      )}
    </button>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const fullText = [
          typeof title === 'string' ? title : '',
          typeof description === 'string' ? description : ''
        ].filter(Boolean).join(' - ');

        return (
          <Toast key={id} variant={variant} className="select-text cursor-text" {...props}>
            <div className="grid gap-1 select-text flex-1">
              {title && <ToastTitle className="select-text">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="select-text leading-relaxed">
                  {description}
                </ToastDescription>
              )}
              {fullText && <ToastCopyButton text={fullText} />}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
