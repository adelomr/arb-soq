'use client';

import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Download, Link as LinkIcon, Trash2, Check, X } from 'lucide-react';

export default function DownloadButtonNodeView(props: any) {
  const { node, updateAttributes, deleteNode } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState(node.attrs.text || 'تحميل الملف');
  const [url, setUrl] = useState(node.attrs.url || '');

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
    updateAttributes({ text, url });
    setIsOpen(false);
  };

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
        className="download-btn-custom inline-flex items-center gap-2 cursor-pointer select-none"
        style={{ userSelect: 'none' }}
        title="انقر لتعديل الزر"
        contentEditable={false}
        draggable={false}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px', pointerEvents: 'none' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{node.attrs.text || 'تحميل الملف'}</span>

        {/* Small edit hint badge */}
        <span style={{
          fontSize: '9px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#059669',
          borderRadius: '4px',
          padding: '1px 4px',
          marginRight: '2px',
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
              <Download className="h-4 w-4 text-emerald-500" />
              خصائص زر التحميل
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
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                اسم/نص الزر
              </label>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="مثال: تحميل الملف"
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                dir="rtl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                رابط التحميل (URL)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="https://example.com/file.pdf"
                  className="w-full text-sm pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  dir="ltr"
                />
                <LinkIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                حفظ
              </button>
              <button
                type="button"
                onClick={(e) => {
                  stopAll(e);
                  if (window.confirm('هل أنت متأكد من حذف زر التحميل هذا؟')) {
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
