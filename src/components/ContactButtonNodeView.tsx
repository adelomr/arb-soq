'use client';

import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Phone, MessageCircle, Link as LinkIcon, Trash2, Check, X } from 'lucide-react';

export default function ContactButtonNodeView(props: any) {
  const { node, updateAttributes, deleteNode } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'whatsapp' | 'call'>(node.attrs.type || 'whatsapp');
  const [phone, setPhone] = useState(node.attrs.phone || '');
  const [text, setText] = useState(node.attrs.text || '');

  // Block ALL mouse events from bubbling up to the editor wrapper / browser
  const stopAll = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateAttributes({ type, phone, text });
    setIsOpen(false);
  };

  const isWhatsApp = type === 'whatsapp';
  const label = text.trim() || phone || (isWhatsApp ? 'واتساب' : 'اتصال');

  return (
    <NodeViewWrapper
      className="inline-block relative select-none align-middle"
      style={{ direction: 'rtl' }}
      onClick={stopAll}
      onMouseDown={stopAll}
    >
      {/* The visible button — clicking opens the edit panel, never navigates */}
      <span
        onClick={handleClick}
        onMouseDown={stopAll}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e as any); }}
        className="contact-btn-custom inline-flex items-center gap-2 cursor-pointer select-none"
        data-contact-btn={type}
        style={{ userSelect: 'none' }}
        title="انقر لتعديل الزر"
        contentEditable={false}
        draggable={false}
      >
        {isWhatsApp ? (
          <MessageCircle size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px', pointerEvents: 'none' }} />
        ) : (
          <Phone size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px', pointerEvents: 'none' }} />
        )}
        <span>{label}</span>

        {/* Small edit hint badge */}
        <span style={{
          fontSize: '9px',
          background: isWhatsApp ? 'rgba(37, 211, 102, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          color: isWhatsApp ? '#128c7e' : '#1d4ed8',
          borderRadius: '4px',
          padding: '1px 4px',
          marginRight: '4px',
          pointerEvents: 'none',
        }}>تعديل</span>
      </span>

      {isOpen && (
        <div
          className="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 w-72 top-full mt-2 right-0"
          style={{ direction: 'rtl' }}
          onClick={stopAll}
          onMouseDown={stopAll}
        >
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-semibold text-sm text-foreground flex items-center gap-2">
              {isWhatsApp ? (
                <MessageCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <Phone className="h-4 w-4 text-blue-500" />
              )}
              خصائص زر الاتصال
            </span>
            <button
              type="button"
              onClick={(e) => { stopAll(e); setIsOpen(false); }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Type selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                نوع الاتصال
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('whatsapp')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    type === 'whatsapp'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-muted-foreground'
                  }`}
                >
                  واتساب
                </button>
                <button
                  type="button"
                  onClick={() => setType('call')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    type === 'call'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 text-muted-foreground'
                  }`}
                >
                  اتصال هاتفي
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                رقم الهاتف (مع رمز الدولة)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="مثال: 967777777777"
                  className="w-full text-sm pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  dir="ltr"
                  required
                />
                <Phone className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                نص الزر (اختياري)
              </label>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={isWhatsApp ? 'تواصل معنا عبر واتساب' : 'اتصل بنا الآن'}
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                dir="rtl"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleApply}
                disabled={!phone.trim()}
                className={`flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-medium py-2 rounded-lg transition-colors ${
                  isWhatsApp ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                حفظ
              </button>
              <button
                type="button"
                onClick={(e) => {
                  stopAll(e);
                  if (window.confirm('هل أنت متأكد من حذف زر الاتصال هذا؟')) {
                    deleteNode();
                  }
                }}
                className="flex items-center justify-center p-2 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                title="حذف الزر"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
