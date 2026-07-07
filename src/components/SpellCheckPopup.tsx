'use client';

import React from 'react';
import { X, CheckCircle } from 'lucide-react';

interface SpellPopupProps {
    word: string;
    message: string;
    replacements: string[];
    position: { top: number; left: number };
    onReplace: (replacement: string) => void;
    onIgnore: () => void;
    onIgnoreAll: () => void;
    onClose: () => void;
}

export default function SpellCheckPopup({
    word,
    message,
    replacements,
    position,
    onReplace,
    onIgnore,
    onIgnoreAll,
    onClose,
}: SpellPopupProps) {
    return (
        <div
            className="fixed z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-0 w-64 overflow-hidden"
            style={{ top: position.top, left: position.left }}
            dir="rtl"
            onMouseDown={e => e.preventDefault()} // prevent editor losing focus
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/30">
                <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">خطأ إملائي</p>
                    <p className="text-xs text-red-600/70 dark:text-red-400/60 truncate">"{word}"</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Suggestions */}
            {replacements.length > 0 && (
                <div className="p-2">
                    <p className="text-[10px] font-medium text-muted-foreground px-1 mb-1.5">اقتراحات التصحيح:</p>
                    <div className="space-y-0.5">
                        {replacements.map((r, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onReplace(r)}
                                className="w-full text-right px-3 py-2 text-sm font-medium rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group"
                            >
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                <span>{r}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-2 space-y-0.5">
                <button
                    type="button"
                    onClick={onIgnore}
                    className="w-full text-right px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    تجاهل هذه المرة
                </button>
                <button
                    type="button"
                    onClick={onIgnoreAll}
                    className="w-full text-right px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    تجاهل دائماً
                </button>
            </div>
        </div>
    );
}
