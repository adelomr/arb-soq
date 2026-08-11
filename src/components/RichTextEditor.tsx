'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Youtube from '@tiptap/extension-youtube';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import DownloadButton from './DownloadButton';
import ContactButton from './ContactButton';
import SpellCheckExtension, { spellCheckKey } from './SpellCheckExtension';
import SpellCheckPopup from './SpellCheckPopup';
import {
    Bold, Italic, List, ListOrdered, Image as ImageIcon, Link as LinkIcon,
    Heading1, Heading2, Heading3, Undo, Redo, Loader2, AlignLeft, AlignCenter,
    AlignRight, Unlink, Paperclip, Underline as UnderlineIcon, Strikethrough,
    Highlighter, Quote, Minus, Palette, Type, X, Check, Settings2, Download,
    Code, Phone, MessageCircle, Plus, Eraser, Maximize2, Minimize2, Copy,
    Table2, Youtube as YoutubeIcon, Smile, Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon, Trash2, ChevronDown, ChevronUp,
    ChevronLeft, ChevronRight,
} from 'lucide-react';

// ──────────────── Interfaces ────────────────
interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    stickyTopOffset?: string;
}

// ──────────────── Constants ────────────────
const FONT_SIZES = [
    { label: 'صغير جداً', value: '12px' },
    { label: 'صغير',      value: '14px' },
    { label: 'عادي',      value: '16px' },
    { label: 'كبير',      value: '20px' },
    { label: 'كبير جداً', value: '24px' },
    { label: 'ضخم',       value: '32px' },
];

const TEXT_COLORS = [
    '#000000', '#374151', '#DC2626', '#D97706', '#059669',
    '#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#65A30D',
    '#FFFFFF', '#F3F4F6', '#FEE2E2', '#FEF3C7', '#D1FAE5',
];

const EMOJI_CATEGORIES = [
    { name: 'وجوه', emojis: ['😀','😊','😂','🤣','😍','🥰','😎','🤩','🥳','😜','🤔','😐','😏','😒','😢','😭','😤','😠','😡','🤯','😳','🥺','😬','😌','😪','😷','🤒','🤧','🥵','🥶','😵','🤠','🤡','😈','👻','💀'] },
    { name: 'أشخاص', emojis: ['👋','🤚','✋','👌','✌️','🤞','🤟','👍','👎','👏','🙌','🤲','🙏','💪','🤝','💅','🤳','🧑','👶','🧒','👦','👧','🧑','👱','🧔','👴','👵','🧓'] },
    { name: 'قلوب', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️'] },
    { name: 'طبيعة', emojis: ['🌸','🌺','🌹','🌷','🌻','🌼','💐','🍀','🌿','🌱','🌲','🌳','🌴','🌵','☀️','🌤️','⛅','☁️','🌧️','⛈️','❄️','🌊','💧','🔥','⭐','🌙','🌍','🌈','🌄','🌅','🏔️','🏝️'] },
    { name: 'طعام', emojis: ['🍕','🍔','🍟','🌭','🍿','🥚','🍳','🥞','🍞','🥐','🧁','🍰','🎂','🍩','🍪','🍫','🍬','🍭','☕','🍵','🥤','🧃','🥛','🍺','🥂','🍷','🍓','🍎','🍊','🍋','🍇','🍉','🥝','🍑','🥭'] },
    { name: 'نشاطات', emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','⛳','🎱','🏓','🎮','🎲','🎭','🎨','🎬','🎤','🎸','🎺','🎷','🎵','🎶','🎯','🥊','🥋','🏅','🥇','🥈','🥉','🏆','🎪','🎠','🎡'] },
    { name: 'رموز', emojis: ['✅','❌','⚠️','🚫','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','💯','🔔','📢','📣','💡','🔑','🔒','🔓','🔎','📝','📌','📍','📎','✏️','📅','📆','⏰','⌚','⏳','💰','💳','🎁','🏠','🚗','✈️'] },
];

// ──────────────── Image Compression ────────────────
async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<File> {
    if (!file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            if (width <= maxWidth) { resolve(file); return; }
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const outExt  = file.type === 'image/png' ? 'png' : 'jpg';
            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    resolve(new File([blob], file.name.replace(/\.[^.]+$/, `.${outExt}`), { type: outType }));
                },
                outType,
                quality,
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

// ──────────────── Separator ────────────────
const Sep = () => <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center mx-0.5 flex-shrink-0" />;

// ──────────────── Toolbar Button ────────────────
interface ToolbarBtnProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
    danger?: boolean;
}
const ToolbarBtn = ({ onClick, active, disabled, title, children, danger }: ToolbarBtnProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
            p-1.5 rounded transition-colors flex-shrink-0
            ${active
                ? 'bg-primary/15 text-primary'
                : danger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }
            disabled:opacity-30 disabled:cursor-not-allowed
        `}
    >
        {children}
    </button>
);

// ──────────────── Image Size Panel ────────────────
interface ImagePanelProps {
    onClose: () => void;
    onApply: (size: string, alt: string) => void;
    onDelete?: () => void;
    currentAlt: string;
    currentSize?: string;
}
const IMAGE_SIZES = [
    { label: 'صغير (25%)',   value: '25%'  },
    { label: 'متوسط (50%)',  value: '50%'  },
    { label: 'كبير (75%)',   value: '75%'  },
    { label: 'الحجم الأصلي', value: '100%' },
];
function ImagePanel({ onClose, onApply, onDelete, currentAlt, currentSize }: ImagePanelProps) {
    const [selectedSize, setSelectedSize] = useState(currentSize || '50%');
    const [altText, setAltText] = useState(currentAlt || '');

    useEffect(() => {
        if (currentSize) setSelectedSize(currentSize);
    }, [currentSize]);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 w-72" dir="rtl">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />خصائص الصورة
                </h4>
                <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">حجم الصورة</label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {IMAGE_SIZES.map(({ label, value }) => (
                            <button key={value} type="button" onClick={() => setSelectedSize(value)}
                                className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                                    selectedSize === value
                                        ? 'border-primary bg-primary/10 text-primary font-medium'
                                        : 'border-border hover:border-primary/50 text-muted-foreground'
                                }`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">وصف الصورة (SEO Alt)</label>
                    <input type="text" value={altText} onChange={e => setAltText(e.target.value)}
                        placeholder="وصف مختصر للصورة..."
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        dir="rtl" />
                </div>
                <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => onApply(selectedSize, altText)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <Check className="h-4 w-4" />تطبيق
                    </button>
                    {onDelete && (
                        <button type="button" onClick={onDelete}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
                            title="حذف الصورة">
                            <Trash2 className="h-4 w-4" />
                            <span>حذف</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ──────────────── Anchor type for fixed popovers ────────────────
interface Anchor { top: number; left: number; }
function getAnchor(btn: HTMLButtonElement | null): Anchor | null {
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 240) };
}

// ──────────────── Color Picker ────────────────
function ColorPicker({ onSelect, onClose, anchor }: { onSelect: (c: string) => void; onClose: () => void; anchor: Anchor }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 w-56"
            style={{ position: 'fixed', top: anchor.top, left: anchor.left, zIndex: 9999 }}
            dir="rtl">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">لون النص</span>
                <button type="button" onClick={onClose}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
                {TEXT_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => { onSelect(color); onClose(); }}
                        className="w-8 h-8 rounded-lg border-2 border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: color }} title={color} />
                ))}
            </div>
            <button type="button" onClick={() => { onSelect(''); onClose(); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1 border border-dashed border-border rounded-lg">
                إزالة اللون
            </button>
        </div>
    );
}

// ──────────────── Font Size Picker ────────────────
function FontSizePicker({ onSelect, onClose, anchor }: { onSelect: (s: string) => void; onClose: () => void; anchor: Anchor }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 w-44"
            style={{ position: 'fixed', top: anchor.top, left: anchor.left, zIndex: 9999 }}
            dir="rtl">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-muted-foreground">حجم الخط</span>
                <button type="button" onClick={onClose}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
            {FONT_SIZES.map(({ label, value }) => (
                <button key={value} type="button" onClick={() => { onSelect(value); onClose(); }}
                    className="w-full text-right px-3 py-1.5 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground">
                    {label}
                </button>
            ))}
        </div>
    );
}

// ──────────────── Emoji Picker ────────────────
function EmojiPickerPanel({ onSelect, onClose, anchor }: { onSelect: (e: string) => void; onClose: () => void; anchor: Anchor }) {
    const [activeCategory, setActiveCategory] = useState(0);
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 w-72"
            style={{ position: 'fixed', top: anchor.top, left: Math.min(anchor.left, window.innerWidth - 296), zIndex: 9999 }}
            dir="rtl">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">رموز تعبيرية</span>
                <button type="button" onClick={onClose}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
            <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                {EMOJI_CATEGORIES.map((cat, i) => (
                    <button key={i} type="button" onClick={() => setActiveCategory(i)}
                        className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors ${
                            activeCategory === i
                                ? 'bg-primary/15 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}>
                        {cat.name}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                    <button key={i} type="button" onClick={() => { onSelect(emoji); onClose(); }}
                        className="w-8 h-8 text-lg hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
                        title={emoji}>
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ──────────────── Table Dialog ────────────────
// ──────────────── Table Templates ────────────────
const TABLE_TEMPLATES = [
    {
        id: 'comparison',
        name: 'جدول مقارنة',
        desc: '3 أعمدة × 4 صفوف',
        icon: '⚖️',
        rows: 4, cols: 3,
        html: `<table><thead><tr><th>المميزات</th><th>الخطة الأساسية</th><th>الخطة المتقدمة</th></tr></thead><tbody><tr><td>السعر</td><td>مجاناً</td><td>99 ر.س/شهر</td></tr><tr><td>التخزين</td><td>5 GB</td><td>100 GB</td></tr><tr><td>الدعم</td><td>بريد إلكتروني</td><td>24/7 مباشر</td></tr></tbody></table>`,
        preview: [['المميزات','الأساسية','المتقدمة'],['السعر','مجاناً','99 ر.س'],['التخزين','5 GB','100 GB']],
    },
    {
        id: 'pricing',
        name: 'قائمة أسعار',
        desc: '4 أعمدة × 5 صفوف',
        icon: '💰',
        rows: 5, cols: 4,
        html: `<table><thead><tr><th>#</th><th>المنتج / الخدمة</th><th>الكمية</th><th>السعر</th></tr></thead><tbody><tr><td>1</td><td>اسم المنتج</td><td>1</td><td>0 ر.س</td></tr><tr><td>2</td><td>اسم المنتج</td><td>1</td><td>0 ر.س</td></tr><tr><td>3</td><td>اسم المنتج</td><td>1</td><td>0 ر.س</td></tr><tr><td colspan="3" style="text-align:left;font-weight:700">الإجمالي</td><td style="font-weight:700">0 ر.س</td></tr></tbody></table>`,
        preview: [['#','المنتج','الكمية','السعر'],['1','منتج','1','0 ر.س'],['2','منتج','1','0 ر.س'],['الإجمالي','','','0 ر.س']],
    },
    {
        id: 'schedule',
        name: 'جدول مواعيد',
        desc: '4 أعمدة × 5 صفوف',
        icon: '📅',
        rows: 5, cols: 4,
        html: `<table><thead><tr><th>اليوم</th><th>الوقت</th><th>الموضوع</th><th>الحالة</th></tr></thead><tbody><tr><td>السبت</td><td>9:00 ص</td><td>اجتماع</td><td>✅ مؤكد</td></tr><tr><td>الأحد</td><td>11:00 ص</td><td>تدريب</td><td>⏳ قيد الانتظار</td></tr><tr><td>الاثنين</td><td>2:00 م</td><td>متابعة</td><td>✅ مؤكد</td></tr><tr><td>الثلاثاء</td><td>4:00 م</td><td>مراجعة</td><td>❌ ملغى</td></tr></tbody></table>`,
        preview: [['اليوم','الوقت','الموضوع','الحالة'],['السبت','9:00 ص','اجتماع','✅'],['الأحد','11:00 ص','تدريب','⏳'],['الثلاثاء','2:00 م','مراجعة','❌']],
    },
    {
        id: 'specs',
        name: 'مواصفات',
        desc: '2 عمود × 6 صفوف',
        icon: '📋',
        rows: 6, cols: 2,
        html: `<table><thead><tr><th>الخاصية</th><th>القيمة</th></tr></thead><tbody><tr><td>الماركة</td><td>-</td></tr><tr><td>الموديل</td><td>-</td></tr><tr><td>اللون</td><td>-</td></tr><tr><td>الوزن</td><td>-</td></tr><tr><td>الضمان</td><td>سنة واحدة</td></tr></tbody></table>`,
        preview: [['الخاصية','القيمة'],['الماركة','-'],['الموديل','-'],['اللون','-'],['الوزن','-']],
    },
    {
        id: 'team',
        name: 'فريق العمل',
        desc: '3 أعمدة × 4 صفوف',
        icon: '👥',
        rows: 4, cols: 3,
        html: `<table><thead><tr><th>الاسم</th><th>المنصب</th><th>التواصل</th></tr></thead><tbody><tr><td>الاسم الأول</td><td>المدير التنفيذي</td><td>info@email.com</td></tr><tr><td>الاسم الثاني</td><td>مدير التطوير</td><td>dev@email.com</td></tr><tr><td>الاسم الثالث</td><td>مسؤول المبيعات</td><td>sales@email.com</td></tr></tbody></table>`,
        preview: [['الاسم','المنصب','التواصل'],['الاسم الأول','المدير','info@...'],['الاسم الثاني','التطوير','dev@...'],['الاسم الثالث','المبيعات','sales@...']],
    },
    {
        id: 'simple',
        name: 'جدول بسيط',
        desc: '3 أعمدة × 3 صفوف',
        icon: '📊',
        rows: 3, cols: 3,
        html: `<table><thead><tr><th>العمود 1</th><th>العمود 2</th><th>العمود 3</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table>`,
        preview: [['العمود 1','العمود 2','العمود 3'],['','',''],['','','']],
    },
];

function TableDialog({ onInsert, onClose, onInsertHtml }: {
    onInsert: (r: number, c: number) => void;
    onClose: () => void;
    onInsertHtml?: (html: string) => void;
}) {
    const [tab, setTab] = useState<'templates' | 'custom'>('templates');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('comparison');
    const [hovered, setHovered] = useState<[number, number] | null>(null);
    const [customSize, setCustomSize] = useState<[number, number]>([3, 3]);
    const MAX = 8;

    const activeTemplate = TABLE_TEMPLATES.find(t => t.id === selectedTemplate) ?? TABLE_TEMPLATES[0];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg mx-4" dir="rtl">

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Table2 size={18} className="text-primary" /> إدراج جدول
                    </h3>
                    <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-5">
                    {([['templates','نماذج جاهزة'],['custom','مخصص']] as const).map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setTab(key)}
                            className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                                tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Templates Tab */}
                {tab === 'templates' && (
                    <div className="p-4">
                        {/* Template Cards Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {TABLE_TEMPLATES.map(t => (
                                <button key={t.id} type="button"
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`rounded-xl border-2 p-2.5 text-right transition-all ${
                                        selectedTemplate === t.id
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/40'
                                    }`}>
                                    <div className="text-xl mb-1">{t.icon}</div>
                                    <div className="text-xs font-semibold text-foreground leading-tight">{t.name}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
                                </button>
                            ))}
                        </div>

                        {/* Live Preview of selected template */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
                            <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 text-xs text-muted-foreground font-medium">
                                معاينة: {activeTemplate.name}
                            </div>
                            <div className="p-2 overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr>
                                            {activeTemplate.preview[0].map((cell, ci) => (
                                                <th key={ci} className="bg-primary/10 text-primary font-semibold px-2 py-1.5 border border-primary/20 text-right whitespace-nowrap">
                                                    {cell}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeTemplate.preview.slice(1).map((row, ri) => (
                                            <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-800/40'}>
                                                {row.map((cell, ci) => (
                                                    <td key={ci} className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-right whitespace-nowrap text-foreground">
                                                        {cell || <span className="text-slate-300">—</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <button type="button"
                            onClick={() => { onInsertHtml?.(activeTemplate.html); onClose(); }}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                            <Check size={16} /> إدراج &quot;{activeTemplate.name}&quot;
                        </button>
                    </div>
                )}

                {/* Custom Tab */}
                {tab === 'custom' && (
                    <div className="p-4">
                        <p className="text-xs text-muted-foreground mb-3">اختر عدد الصفوف والأعمدة بالتمرير على الشبكة:</p>
                        <div className="flex justify-center mb-3">
                            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${MAX}, 1fr)` }}>
                                {Array.from({ length: MAX }, (_, r) =>
                                    Array.from({ length: MAX }, (_, c) => (
                                        <div key={`${r}-${c}`}
                                            onMouseEnter={() => setHovered([r + 1, c + 1])}
                                            onMouseLeave={() => setHovered(null)}
                                            onClick={() => setCustomSize([r + 1, c + 1])}
                                            className={`w-7 h-7 rounded border cursor-pointer transition-all ${
                                                hovered
                                                    ? (r < hovered[0] && c < hovered[1] ? 'bg-primary/40 border-primary/60 scale-105' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700')
                                                    : (r < customSize[0] && c < customSize[1] ? 'bg-primary/25 border-primary/40' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700')
                                            }`}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-center font-bold text-primary mb-4">
                            {hovered ? `${hovered[0]} صف × ${hovered[1]} عمود` : `${customSize[0]} صف × ${customSize[1]} عمود`}
                        </p>
                        <button type="button"
                            onClick={() => { onInsert(customSize[0], customSize[1]); onClose(); }}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                            <Check size={16} /> إدراج جدول {customSize[0]}×{customSize[1]}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


// ──────────────── YouTube Dialog ────────────────
function YoutubeDialog({ onInsert, onClose }: { onInsert: (url: string) => void; onClose: () => void }) {
    const [url, setUrl] = useState('');
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-slate-200 dark:border-slate-700" dir="rtl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <YoutubeIcon size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-base">تضمين فيديو يوتيوب</h3>
                        <p className="text-xs text-muted-foreground">أدخل رابط الفيديو ليُضمَّن في المحتوى</p>
                    </div>
                </div>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (url.trim()) onInsert(url.trim()); } }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
                    dir="ltr" autoFocus />
                <div className="flex gap-2">
                    <button type="button" onClick={() => { if (url.trim()) onInsert(url.trim()); }} disabled={!url.trim()}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40">
                        <Check size={16} /> تضمين
                    </button>
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────── MenuBar ────────────────
interface MenuBarProps {
    editor: any;
    onImageUpload: () => void;
    onFileUpload: () => void;
    onInsertPhone: (type: 'call' | 'whatsapp') => void;
    imagePanelOpen: boolean;    setImagePanelOpen: (v: boolean) => void;
    colorPickerOpen: boolean;   setColorPickerOpen: (v: boolean) => void;
    fontSizeOpen: boolean;      setFontSizeOpen: (v: boolean) => void;
    emojiPickerOpen: boolean;   setEmojiPickerOpen: (v: boolean) => void;
    isHtmlMode: boolean;
    onToggleHtml: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    onOpenTable: () => void;
    onOpenYoutube: () => void;
}

const MenuBar = ({
    editor, onImageUpload, onFileUpload, onInsertPhone,
    imagePanelOpen, setImagePanelOpen,
    colorPickerOpen, setColorPickerOpen,
    fontSizeOpen, setFontSizeOpen,
    emojiPickerOpen, setEmojiPickerOpen,
    isHtmlMode, onToggleHtml,
    isFullscreen, onToggleFullscreen,
    onOpenTable, onOpenYoutube,
}: MenuBarProps) => {
    if (!editor) return null;

    // Refs for popover anchor buttons
    const colorBtnRef    = useRef<HTMLButtonElement>(null);
    const fontSizeBtnRef = useRef<HTMLButtonElement>(null);
    const emojiBtnRef    = useRef<HTMLButtonElement>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            const isRTL = window.getComputedStyle(el).direction === 'rtl';
            if (isRTL) {
                el.scrollLeft -= e.deltaY;
            } else {
                el.scrollLeft += e.deltaY;
            }
            e.preventDefault();
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    // Anchor positions (fixed coordinates)
    const [colorAnchor,    setColorAnchor]    = useState<Anchor | null>(null);
    const [fontSizeAnchor, setFontSizeAnchor] = useState<Anchor | null>(null);
    const [emojiAnchor,    setEmojiAnchor]    = useState<Anchor | null>(null);

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('أدخل رابط الموقع (URL):', previousUrl);
        if (url === null) return;
        if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const insertDownloadButton = useCallback(() => {
        editor.chain().focus().insertContent({ type: 'downloadButton', attrs: { text: 'تحميل الملف', url: '' } }).run();
    }, [editor]);

    const closeAllPopovers = () => {
        setColorPickerOpen(false);
        setFontSizeOpen(false);
        setImagePanelOpen(false);
        setEmojiPickerOpen(false);
    };

    const isInTable = editor.isActive('table');

    return (
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] rounded-t-xl">
            <div className="flex items-center justify-between p-2 gap-2">
            {/* ── Scrollable Toolbar Area ── */}
            <div 
                ref={scrollContainerRef}
                className="flex items-center gap-0.5 overflow-x-auto custom-scrollbar flex-1 min-w-0 py-0.5"
            >
                <div className="flex items-center gap-0.5 flex-shrink-0">

                    {/* Undo / Redo */}
                    <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || isHtmlMode} title="تراجع (Ctrl+Z)">
                        <Undo size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || isHtmlMode} title="إعادة (Ctrl+Y)">
                        <Redo size={16} />
                    </ToolbarBtn>
                    <Sep />

                    {/* Headings */}
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} disabled={isHtmlMode} title="عنوان H1">
                        <Heading1 size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} disabled={isHtmlMode} title="عنوان H2">
                        <Heading2 size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} disabled={isHtmlMode} title="عنوان H3">
                        <Heading3 size={16} />
                    </ToolbarBtn>
                    <Sep />

                    {/* Text Styles */}
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} disabled={isHtmlMode} title="عريض (Ctrl+B)">
                        <Bold size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} disabled={isHtmlMode} title="مائل (Ctrl+I)">
                        <Italic size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} disabled={isHtmlMode} title="تسطير (Ctrl+U)">
                        <UnderlineIcon size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} disabled={isHtmlMode} title="شطب (Ctrl+Shift+S)">
                        <Strikethrough size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} disabled={isHtmlMode} title="تمييز (Ctrl+Shift+H)">
                        <Highlighter size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} disabled={isHtmlMode} title="نص منخفض">
                        <SubscriptIcon size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} disabled={isHtmlMode} title="نص مرتفع">
                        <SuperscriptIcon size={16} />
                    </ToolbarBtn>
                    <Sep />

                    {/* Color */}
                    <button
                        ref={colorBtnRef}
                        type="button"
                        onClick={() => {
                            closeAllPopovers();
                            if (!colorPickerOpen) setColorAnchor(getAnchor(colorBtnRef.current));
                            setColorPickerOpen(!colorPickerOpen);
                        }}
                        disabled={isHtmlMode}
                        title="لون الخط"
                        className={`p-1.5 rounded transition-colors flex-shrink-0 ${colorPickerOpen ? 'bg-primary/15 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                        <Palette size={16} />
                    </button>
                    {colorPickerOpen && colorAnchor && (
                        <ColorPicker
                            anchor={colorAnchor}
                            onSelect={(color) => { if (color) editor.chain().focus().setColor(color).run(); else editor.chain().focus().unsetColor().run(); }}
                            onClose={() => setColorPickerOpen(false)}
                        />
                    )}

                    {/* Font Size */}
                    <button
                        ref={fontSizeBtnRef}
                        type="button"
                        onClick={() => {
                            closeAllPopovers();
                            if (!fontSizeOpen) setFontSizeAnchor(getAnchor(fontSizeBtnRef.current));
                            setFontSizeOpen(!fontSizeOpen);
                        }}
                        disabled={isHtmlMode}
                        title="حجم الخط"
                        className={`p-1.5 rounded transition-colors flex-shrink-0 ${fontSizeOpen ? 'bg-primary/15 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                        <Type size={16} />
                    </button>
                    {fontSizeOpen && fontSizeAnchor && (
                        <FontSizePicker
                            anchor={fontSizeAnchor}
                            onSelect={(size) => { editor.chain().focus().setMark('textStyle', { fontSize: size }).run(); }}
                            onClose={() => setFontSizeOpen(false)}
                        />
                    )}

                    {/* Clear Formatting */}
                    <ToolbarBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} disabled={isHtmlMode} title="مسح التنسيق">
                        <Eraser size={16} />
                    </ToolbarBtn>
                    <Sep />

                    {/* Alignment */}
                    <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} disabled={isHtmlMode} title="محاذاة يمين">
                        <AlignRight size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} disabled={isHtmlMode} title="توسيط">
                        <AlignCenter size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} disabled={isHtmlMode} title="محاذاة يسار">
                        <AlignLeft size={16} />
                    </ToolbarBtn>
                    <Sep />

                    {/* Lists */}
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} disabled={isHtmlMode} title="قائمة نقطية">
                        <List size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} disabled={isHtmlMode} title="قائمة مرقمة">
                        <ListOrdered size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} disabled={isHtmlMode} title="اقتباس">
                        <Quote size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={isHtmlMode} title="خط فاصل">
                        <Minus size={16} />
                    </ToolbarBtn>
                    <Sep />

                    {/* Table */}
                    <ToolbarBtn onClick={onOpenTable} disabled={isHtmlMode} title="إدراج جدول" active={editor.isActive('table')}>
                        <Table2 size={16} />
                    </ToolbarBtn>

                    {/* YouTube */}
                    <ToolbarBtn onClick={onOpenYoutube} disabled={isHtmlMode} title="تضمين فيديو يوتيوب">
                        <YoutubeIcon size={16} className="text-red-500 dark:text-red-400" />
                    </ToolbarBtn>
                    <Sep />

                    {/* Link */}
                    <ToolbarBtn onClick={setLink} active={editor.isActive('link')} disabled={isHtmlMode} title="إدراج رابط (Ctrl+K)">
                        <LinkIcon size={16} />
                    </ToolbarBtn>
                    {editor.isActive('link') && (
                        <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} danger disabled={isHtmlMode} title="إزالة الرابط">
                            <Unlink size={16} />
                        </ToolbarBtn>
                    )}

                    {/* WhatsApp */}
                    <ToolbarBtn onClick={() => onInsertPhone('whatsapp')} disabled={isHtmlMode} title="رابط واتساب">
                        <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-500" />
                    </ToolbarBtn>

                    {/* Phone */}
                    <ToolbarBtn onClick={() => onInsertPhone('call')} disabled={isHtmlMode} title="رابط اتصال">
                        <Phone size={16} className="text-blue-600 dark:text-blue-500" />
                    </ToolbarBtn>
                    <Sep />

                    {/* Emoji */}
                    <button
                        ref={emojiBtnRef}
                        type="button"
                        onClick={() => {
                            closeAllPopovers();
                            if (!emojiPickerOpen) setEmojiAnchor(getAnchor(emojiBtnRef.current));
                            setEmojiPickerOpen(!emojiPickerOpen);
                        }}
                        disabled={isHtmlMode}
                        title="رموز تعبيرية"
                        className={`p-1.5 rounded transition-colors flex-shrink-0 ${emojiPickerOpen ? 'bg-primary/15 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                        <Smile size={16} />
                    </button>
                    {emojiPickerOpen && emojiAnchor && (
                        <EmojiPickerPanel
                            anchor={emojiAnchor}
                            onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()}
                            onClose={() => setEmojiPickerOpen(false)}
                        />
                    )}

                    {/* Image */}
                    <ToolbarBtn onClick={onImageUpload} disabled={isHtmlMode} title="إدراج صورة">
                        <ImageIcon size={16} />
                    </ToolbarBtn>

                    {/* File */}
                    <ToolbarBtn onClick={onFileUpload} disabled={isHtmlMode} title="إرفاق ملف">
                        <Paperclip size={16} />
                    </ToolbarBtn>

                    {/* Download Button */}
                    <ToolbarBtn onClick={insertDownloadButton} disabled={isHtmlMode} title="زر تحميل احترافي">
                        <Download size={16} />
                    </ToolbarBtn>
                </div>
            </div>

            {/* Separator between tools and fixed options */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center mx-1 flex-shrink-0" />

            {/* ── Fixed Controls (on the left side because of RTL) ── */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={onToggleFullscreen}
                    title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
                    className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button type="button" onClick={onToggleHtml}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        isHtmlMode
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                    }`}
                    title={isHtmlMode ? 'عرض المحرر المرئي' : 'عرض كود HTML'}>
                    <Code size={14} />
                    <span>{isHtmlMode ? 'المحرر المرئي' : 'كود HTML'}</span>
                </button>
            </div>
        </div>

            {/* ── Table Controls Bar (shows when cursor is inside a table) ── */}
            {isInTable && !isHtmlMode && (
                <div className="flex flex-wrap gap-1 items-center px-2 py-1.5 border-t border-blue-100 dark:border-blue-900/30 bg-blue-50/60 dark:bg-blue-950/20">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 ml-1">جدول:</span>
                    <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1">
                        <ChevronUp size={11} /><Plus size={9} /> صف أعلى
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1">
                        <ChevronDown size={11} /><Plus size={9} /> صف أسفل
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().deleteRow().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 hover:border-red-400 text-red-500 transition-colors flex items-center gap-1">
                        <Trash2 size={11} /> صف
                    </button>
                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center" />
                    <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1">
                        <ChevronRight size={11} /><Plus size={9} /> عمود
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1">
                        <ChevronLeft size={11} /><Plus size={9} /> عمود
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 hover:border-red-400 text-red-500 transition-colors flex items-center gap-1">
                        <Trash2 size={11} /> عمود
                    </button>
                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center" />
                    <button type="button" onClick={() => editor.chain().focus().mergeCells().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 transition-colors">
                        دمج
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().splitCell().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 transition-colors">
                        تقسيم
                    </button>
                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center" />
                    <button type="button" onClick={() => editor.chain().focus().deleteTable().run()}
                        className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 hover:border-red-400 text-red-500 transition-colors flex items-center gap-1">
                        <Trash2 size={11} /> حذف الجدول
                    </button>
                </div>
            )}
        </div>
    );
};

// ──────────────── Main Editor ────────────────
export default function RichTextEditor({ value, onChange, placeholder, stickyTopOffset = 'top-[80px]' }: RichTextEditorProps) {
    const fileInputRef        = useRef<HTMLInputElement>(null);
    const generalFileInputRef = useRef<HTMLInputElement>(null);
    const wrapperRef          = useRef<HTMLDivElement>(null);

    // UI state
    const [uploadingImage, setUploadingImage]       = useState(false);
    const [imagePanelOpen, setImagePanelOpen]       = useState(false);
    const [selectedImageNode, setSelectedImageNode] = useState<any>(null);
    const [selectedImagePos, setSelectedImagePos]   = useState<number | null>(null);
    const [panelCoords, setPanelCoords]             = useState<{ top: number; left: number } | null>(null);
    const [colorPickerOpen, setColorPickerOpen]     = useState(false);
    const [fontSizeOpen, setFontSizeOpen]           = useState(false);
    const [emojiPickerOpen, setEmojiPickerOpen]     = useState(false);
    const [isHtmlMode, setIsHtmlMode]               = useState(false);
    const [isFullscreen, setIsFullscreen]           = useState(false);
    const [tableDialogOpen, setTableDialogOpen]     = useState(false);
    const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
    const [htmlCopied, setHtmlCopied]               = useState(false);

    // Word count
    const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });

    // Contact dialog
    const [contactDialogType, setContactDialogType] = useState<'call' | 'whatsapp' | null>(null);
    const [contactPhone, setContactPhone]           = useState('');
    const [contactLabel, setContactLabel]           = useState('');

    // Spell check
    const [spellPopup, setSpellPopup] = useState<{
        word: string; message: string; replacements: string[];
        from: number; to: number; position: { top: number; left: number };
    } | null>(null);
    const ignoredWordsRef = useRef<Set<string>>(new Set());

    // Custom TextStyle with fontSize
    const CustomTextStyle = TextStyle.extend({
        addAttributes() {
            return {
                ...this.parent?.(),
                fontSize: {
                    default: null,
                    parseHTML: element => element.style.fontSize || null,
                    renderHTML: attributes => {
                        if (!attributes.fontSize) return {};
                        return { style: `font-size: ${attributes.fontSize}` };
                    },
                },
            };
        },
    });

    // Custom Image extension to preserve style (max-width)
    const CustomImage = TiptapImage.extend({
        addAttributes() {
            return {
                ...this.parent?.(),
                style: {
                    default: 'max-width: 50%; height: auto; display: block; margin: 1rem auto; border-radius: 8px; cursor: pointer;',
                    parseHTML: element => element.getAttribute('style') || element.style.cssText || null,
                    renderHTML: attributes => {
                        if (!attributes.style) return {};
                        return { style: attributes.style };
                    },
                },
            };
        },
    });

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            CustomImage.configure({
                inline: false,
                HTMLAttributes: {
                    class: 'editor-image',
                },
            }),
            Link.extend({
                parseHTML() {
                    return [{
                        tag: 'a[href]:not(.download-btn-custom):not(.download-btn-wrapper):not([data-download-btn]):not(.contact-btn-wrapper)',
                    }];
                },
            }).configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline decoration-primary/30 underline-offset-4 font-medium hover:text-primary/80 transition-colors',
                },
            }),
            Placeholder.configure({ placeholder: placeholder || 'اكتب محتواك هنا...' }),
            CustomTextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Underline,
            Subscript,
            Superscript,
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Youtube.configure({
                controls: true,
                HTMLAttributes: { class: 'editor-youtube' },
            }),
            DownloadButton,
            ContactButton,
            SpellCheckExtension,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
            // Update word count
            const text = editor.getText();
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            setWordCount({ words, chars: text.length });
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate dark:prose-invert max-w-none min-h-[320px] p-4 focus:outline-none text-right',
                dir: 'rtl',
                spellcheck: 'true',
            },
            handleClick(view, pos, event) {
                const target = event.target as HTMLElement;
                if (target.tagName === 'IMG') {
                    setSpellPopup(null);
                    setSelectedImageNode(target);
                    setSelectedImagePos(pos);
                    setImagePanelOpen(true);
                    try {
                        editor?.commands.setNodeSelection(pos);
                    } catch (e) {}
                    const rect = target.getBoundingClientRect();
                    if (wrapperRef.current) {
                        const wrapperRect = wrapperRef.current.getBoundingClientRect();
                        const panelWidth = 288;
                        let left = (rect.left + rect.width / 2) - wrapperRect.left - (panelWidth / 2);
                        left = Math.max(8, Math.min(wrapperRect.width - panelWidth - 8, left));
                        setPanelCoords({ top: rect.bottom - wrapperRect.top + 8, left });
                    }
                } else if (!(target as HTMLElement).closest?.('.spell-error')) {
                    setImagePanelOpen(false);
                    setSelectedImageNode(null);
                    setSelectedImagePos(null);
                }
                return false;
            },
        },
    });

    // Sync external value
    useEffect(() => {
        if (editor && !editor.isDestroyed && value !== editor.getHTML() && !isHtmlMode) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor, isHtmlMode]);

    // Escape key exits fullscreen
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isFullscreen]);

    const handleToggleHtml = useCallback(() => {
        if (isHtmlMode) editor?.commands.setContent(value);
        setIsHtmlMode(prev => !prev);
    }, [isHtmlMode, editor, value]);

    const handleToggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    const handleCopyHtml = useCallback(() => {
        navigator.clipboard.writeText(value).then(() => {
            setHtmlCopied(true);
            setTimeout(() => setHtmlCopied(false), 2000);
        });
    }, [value]);

    const handleImageUpload   = useCallback(() => fileInputRef.current?.click(), []);
    const handleFileUpload    = useCallback(() => generalFileInputRef.current?.click(), []);

    const handleWrapperClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest('a');
        if (anchor) e.preventDefault();

        const spellEl = target.classList.contains('spell-error') ? target : (target.closest('.spell-error') as HTMLElement | null);
        if (spellEl) {
            const word = spellEl.dataset.spellWord || '';
            if (ignoredWordsRef.current.has(word)) return;
            const rawReplacements = spellEl.dataset.spellReplacements || '';
            const replacements = rawReplacements ? rawReplacements.split('||').filter(Boolean) : [];
            const message = spellEl.dataset.spellMessage || 'خطأ إملائي';
            const from = parseInt(spellEl.dataset.spellFrom || '0', 10);
            const to   = parseInt(spellEl.dataset.spellTo   || '0', 10);
            const rect = spellEl.getBoundingClientRect();
            const viewportH = window.innerHeight;
            const popupH = 280;
            const popupTop = rect.bottom + 6 + popupH > viewportH ? rect.top - popupH - 4 : rect.bottom + 6;
            const popupLeft = Math.min(Math.max(4, rect.left), window.innerWidth - 268);
            setSpellPopup({ word, message, replacements, from, to, position: { top: popupTop, left: popupLeft } });
            setImagePanelOpen(false);
        } else if (!(target.tagName === 'IMG')) {
            setSpellPopup(null);
        }
    }, []);

    // Image upload with compression
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;
        setUploadingImage(true);
        const compressed = await compressImage(file);
        const storageRef = ref(storage, `general_images/${Date.now()}_${compressed.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressed);
        uploadTask.on('state_changed', null,
            (error) => { console.error('Upload error:', error); setUploadingImage(false); },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                editor.chain().focus().setImage({ src: downloadURL, alt: file.name }).run();
                setUploadingImage(false);
            }
        );
        e.target.value = '';
    };

    const onGeneralFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;
        const storageRef = ref(storage, `general_files/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', null,
            (error) => console.error('Upload error:', error),
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                editor.chain().focus().setLink({ href: downloadURL }).insertContent(file.name).run();
            }
        );
        e.target.value = '';
    };

    const handleApplyImageProps = (size: string, alt: string) => {
        const newStyle = `max-width: ${size}; height: auto; display: block; margin: 1rem auto; border-radius: 8px; cursor: pointer;`;
        if (selectedImageNode) {
            selectedImageNode.style.maxWidth = size;
            selectedImageNode.setAttribute('style', newStyle);
            if (alt) selectedImageNode.alt = alt;
        }
        if (editor) {
            if (selectedImagePos !== null) {
                try {
                    editor.chain().focus().setNodeSelection(selectedImagePos).updateAttributes('image', { style: newStyle, alt }).run();
                } catch (e) {
                    editor.commands.updateAttributes('image', { style: newStyle, alt });
                }
            } else {
                editor.commands.updateAttributes('image', { style: newStyle, alt });
            }
            onChange(editor.getHTML());
        }
        setImagePanelOpen(false);
        setSelectedImageNode(null);
        setSelectedImagePos(null);
    };

    const handleDeleteImage = () => {
        if (editor) {
            if (selectedImagePos !== null) {
                try {
                    editor.chain().focus().setNodeSelection(selectedImagePos).deleteSelection().run();
                } catch (e) {
                    selectedImageNode?.remove();
                }
            } else if (selectedImageNode) {
                selectedImageNode.remove();
            }
            onChange(editor.getHTML());
        }
        setImagePanelOpen(false);
        setSelectedImageNode(null);
        setSelectedImagePos(null);
    };

    const handleInsertContact = useCallback((type: 'call' | 'whatsapp') => {
        setContactPhone(''); setContactLabel(''); setContactDialogType(type);
    }, []);

    const handleConfirmContact = useCallback(() => {
        if (!editor || !contactPhone.trim() || !contactDialogType) return;
        const phone = contactPhone.replace(/\s+/g, '');
        const label = contactLabel.trim() || phone;
        editor.chain().focus().insertContent({
            type: 'contactButton',
            attrs: { type: contactDialogType, phone, text: label },
        }).run();
        onChange(editor.getHTML());
        setContactDialogType(null); setContactPhone(''); setContactLabel('');
    }, [editor, contactPhone, contactLabel, contactDialogType, onChange]);

    const handleInsertTable = (rows: number, cols: number) => {
        editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
        setTableDialogOpen(false);
    };

    const handleInsertTableHtml = (html: string) => {
        editor?.chain().focus().insertContent(html, { parseOptions: { preserveWhitespace: 'full' } }).run();
        setTableDialogOpen(false);
    };

    const handleInsertYoutube = (url: string) => {
        editor?.chain().focus().setYoutubeVideo({ src: url }).run();
        setYoutubeDialogOpen(false);
    };

    const handleSpellReplace = (replacement: string) => {
        if (!editor || !spellPopup) return;
        const { from, to } = spellPopup;
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, replacement).run();
        setSpellPopup(null);
    };
    const handleSpellIgnore    = () => { if (spellPopup) { ignoredWordsRef.current.add(spellPopup.word); setSpellPopup(null); } };
    const handleSpellIgnoreAll = () => { if (spellPopup) { ignoredWordsRef.current.add(spellPopup.word); setSpellPopup(null); } };

    if (!editor) {
        return (
            <div className="w-full h-[350px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    return (
        <>
        {/* ── Contact Phone Dialog ── */}
        {contactDialogType && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}
                onClick={(e) => { if (e.target === e.currentTarget) setContactDialogType(null); }}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-slate-200 dark:border-slate-700" dir="rtl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: contactDialogType === 'whatsapp' ? 'linear-gradient(135deg,#25d366,#128c7e)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff' }}>
                            {contactDialogType === 'whatsapp' ? <MessageCircle size={18} /> : <Phone size={18} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground text-base">
                                {contactDialogType === 'whatsapp' ? 'إدراج رابط واتساب' : 'إدراج رابط اتصال'}
                            </h3>
                            <p className="text-xs text-muted-foreground">سيُدرج رابط قابل للنقر في المحتوى</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">
                                رقم الهاتف {contactDialogType === 'whatsapp' ? '(مع رمز الدولة مثال: 967...)' : '(مثال: +9671234567)'}
                            </label>
                            <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmContact(); } }}
                                placeholder="أدخل رقم الهاتف..."
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                dir="ltr" autoFocus />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">نص الرابط (اختياري)</label>
                            <input type="text" value={contactLabel} onChange={e => setContactLabel(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmContact(); } }}
                                placeholder="مثال: تواصل معنا، اضغط للاتصال..."
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                dir="rtl" />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-5">
                        <button type="button" onClick={handleConfirmContact} disabled={!contactPhone.trim()}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
                            style={{ background: contactDialogType === 'whatsapp' ? 'linear-gradient(135deg,#25d366,#128c7e)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                            <Check size={16} /> إدراج في المحتوى
                        </button>
                        <button type="button" onClick={() => setContactDialogType(null)}
                            className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ── Table Dialog ── */}
        {tableDialogOpen && (
            <TableDialog onInsert={handleInsertTable} onClose={() => setTableDialogOpen(false)} onInsertHtml={handleInsertTableHtml} />
        )}

        {/* ── YouTube Dialog ── */}
        {youtubeDialogOpen && (
            <YoutubeDialog onInsert={handleInsertYoutube} onClose={() => setYoutubeDialogOpen(false)} />
        )}

        {/* ── Editor Wrapper (fullscreen aware) ── */}
        <div
            ref={wrapperRef}
            onClick={handleWrapperClick}
            className={`tiptap-wrapper border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all ${
                isFullscreen
                    ? 'fixed inset-0 z-[9990] rounded-none flex flex-col overflow-hidden'
                    : 'relative rounded-xl overflow-visible'
            }`}
            dir="rtl"
        >
            <input type="file" ref={fileInputRef}        onChange={onFileChange}        className="hidden" accept="image/*" />
            <input type="file" ref={generalFileInputRef} onChange={onGeneralFileChange} className="hidden" />

            {/* Toolbar */}
            <div className={isFullscreen ? 'sticky top-0 z-20 flex-shrink-0' : `sticky ${stickyTopOffset} z-20`}>
                <MenuBar
                    editor={editor}
                    onImageUpload={handleImageUpload}
                    onFileUpload={handleFileUpload}
                    onInsertPhone={handleInsertContact}
                    imagePanelOpen={imagePanelOpen}   setImagePanelOpen={setImagePanelOpen}
                    colorPickerOpen={colorPickerOpen} setColorPickerOpen={setColorPickerOpen}
                    fontSizeOpen={fontSizeOpen}       setFontSizeOpen={setFontSizeOpen}
                    emojiPickerOpen={emojiPickerOpen} setEmojiPickerOpen={setEmojiPickerOpen}
                    isHtmlMode={isHtmlMode}           onToggleHtml={handleToggleHtml}
                    isFullscreen={isFullscreen}       onToggleFullscreen={handleToggleFullscreen}
                    onOpenTable={() => setTableDialogOpen(true)}
                    onOpenYoutube={() => setYoutubeDialogOpen(true)}
                />
            </div>

            {/* Image Properties Panel */}
            {imagePanelOpen && selectedImageNode && panelCoords && (
                <div className="absolute z-50" style={{ top: `${panelCoords.top}px`, left: `${panelCoords.left}px` }}>
                    <ImagePanel
                        onClose={() => setImagePanelOpen(false)}
                        onApply={handleApplyImageProps}
                        onDelete={handleDeleteImage}
                        currentAlt={selectedImageNode?.alt || ''}
                        currentSize={selectedImageNode?.style?.maxWidth || '50%'}
                    />
                </div>
            )}

            {/* Upload indicator */}
            {uploadingImage && (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-slate-100 dark:border-slate-800 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري رفع الصورة (مع ضغط تلقائي)...
                </div>
            )}

            {/* Editor content or HTML textarea */}
            {isHtmlMode ? (
                <div className="relative flex-1">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full font-mono text-sm bg-[#0f172a] text-[#f8fafc] border-t border-slate-200 dark:border-slate-700 focus:outline-none resize-y ${isFullscreen ? 'h-full rounded-none' : 'min-h-[320px] rounded-b-xl'}`}
                        style={{ direction: 'ltr', textAlign: 'left', padding: '2.5rem 1rem 1rem' }}
                        placeholder="اكتب ونسق كود HTML هنا..."
                    />
                    {/* Copy HTML button */}
                    <button type="button" onClick={handleCopyHtml}
                        className={`absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            htmlCopied
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}>
                        {htmlCopied ? <><Check size={12} /> تم النسخ!</> : <><Copy size={12} /> نسخ HTML</>}
                    </button>
                </div>
            ) : (
                <div className={isFullscreen ? 'flex-1 overflow-y-auto' : ''}>
                    <EditorContent editor={editor} />
                </div>
            )}

            {/* ── Word Counter Footer ── */}
            {!isHtmlMode && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs text-slate-400 dark:text-slate-500 rounded-b-xl">
                    <div className="flex items-center gap-3">
                        <span><span className="font-semibold text-slate-500 dark:text-slate-400">{wordCount.words}</span> كلمة</span>
                        <span><span className="font-semibold text-slate-500 dark:text-slate-400">{wordCount.chars}</span> حرف</span>
                    </div>
                    {isFullscreen && (
                        <button type="button" onClick={() => setIsFullscreen(false)}
                            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <Minimize2 size={12} /> تصغير
                        </button>
                    )}
                </div>
            )}

            {/* Spell Check Popup */}
            {spellPopup && (
                <SpellCheckPopup
                    word={spellPopup.word} message={spellPopup.message} replacements={spellPopup.replacements}
                    position={spellPopup.position}
                    onReplace={handleSpellReplace} onIgnore={handleSpellIgnore}
                    onIgnoreAll={handleSpellIgnoreAll} onClose={() => setSpellPopup(null)}
                />
            )}

            <style jsx global>{`
                /* ── Toolbar scroll on mobile ── */
                .toolbar-scroll { scrollbar-width: none; }
                .toolbar-scroll::-webkit-scrollbar { display: none; }

                /* ── Placeholder ── */
                .tiptap p.is-editor-empty:first-child::before {
                    color: #94a3b8;
                    content: attr(data-placeholder);
                    float: right;
                    height: 0;
                    pointer-events: none;
                }
                .dark .tiptap p.is-editor-empty:first-child::before { color: #475569; }

                /* ── Images ── */
                .tiptap img.editor-image {
                    height: auto; border-radius: 8px;
                    display: block; margin: 1rem auto; cursor: pointer;
                    border: 2px solid transparent; transition: border-color 0.2s, max-width 0.2s;
                }
                .tiptap img.editor-image:hover { border-color: hsl(var(--primary)); }
                .tiptap img.editor-image.ProseMirror-selectednode {
                    border-color: hsl(var(--primary));
                    outline: 2px solid hsl(var(--primary) / 0.3);
                    outline-offset: 2px;
                }

                /* ── YouTube embed ── */
                .editor-youtube {
                    width: 100% !important; max-width: 100%;
                    aspect-ratio: 16/9; border-radius: 10px;
                    display: block; margin: 1rem auto;
                }

                /* ── Typography ── */
                .prose { font-size: 16px; line-height: 1.7; }
                .prose h1 { font-size: 2em;   margin-top: 1.5rem;  margin-bottom: 0.75rem; font-weight: 700; }
                .prose h2 { font-size: 1.5em;  margin-top: 1.25rem; margin-bottom: 0.5rem;  font-weight: 700; }
                .prose h3 { font-size: 1.25em; margin-top: 1rem;    margin-bottom: 0.5rem;  font-weight: 600; }

                /* ── Lists ── */
                .prose ul, .prose ol { margin-top: 0.75rem; margin-bottom: 0.75rem; padding-right: 1.75rem; padding-left: 0; }
                .prose ul  { list-style-type: disc;    list-style-position: outside; }
                .prose ol  { list-style-type: decimal; list-style-position: outside; }
                .prose ol li::marker { content: counter(list-item) "- "; }
                .prose li  { margin: 0.25rem 0; }

                /* ── Blockquote (enhanced) ── */
                .prose blockquote {
                    border-right: 4px solid hsl(var(--primary));
                    background: linear-gradient(to left, hsl(var(--primary) / 0.06), transparent);
                    padding: 0.85rem 1.25rem 0.85rem 0.75rem;
                    border-radius: 0 10px 10px 0;
                    color: hsl(var(--muted-foreground));
                    margin: 1.25rem 0;
                    position: relative;
                    font-style: normal;
                }
                .prose blockquote::before {
                    content: '"';
                    font-size: 3.5em;
                    color: hsl(var(--primary) / 0.25);
                    position: absolute;
                    top: -10px;
                    right: 10px;
                    line-height: 1;
                    font-family: Georgia, serif;
                    pointer-events: none;
                }

                /* ── Highlight ── */
                .prose mark { background-color: #fef08a; padding: 0.1em 0.2em; border-radius: 3px; }
                .dark .prose mark { background-color: #854d0e; }

                /* ── Horizontal rule (enhanced) ── */
                .prose hr {
                    border: none;
                    height: 2px;
                    background: linear-gradient(to left, transparent, hsl(var(--primary) / 0.45), transparent);
                    margin: 1.75rem 0;
                    border-radius: 999px;
                }

                /* ── Tables (enhanced) ── */
                .prose table, .ProseMirror table {
                    width: 100%; border-collapse: collapse;
                    margin: 1rem 0; border-radius: 8px;
                    border: 1px solid hsl(var(--border));
                    overflow: hidden; font-size: 0.9em;
                }
                .prose th, .ProseMirror th {
                    background: hsl(var(--primary) / 0.1);
                    color: hsl(var(--foreground));
                    font-weight: 700;
                    padding: 0.625rem 0.875rem;
                    text-align: right;
                    border-bottom: 2px solid hsl(var(--primary) / 0.25);
                    border: 1px solid hsl(var(--border));
                }
                .prose td, .ProseMirror td {
                    padding: 0.5rem 0.875rem;
                    border: 1px solid hsl(var(--border));
                    color: hsl(var(--foreground));
                    position: relative;
                    min-width: 60px;
                }
                .ProseMirror tr:hover td { background: hsl(var(--muted) / 0.4); }
                /* Selected cell highlight */
                .ProseMirror .selectedCell::after {
                    content: "";
                    position: absolute; inset: 0;
                    background: hsl(var(--primary) / 0.15);
                    pointer-events: none; z-index: 2;
                }
                /* Table resize handle */
                .ProseMirror .column-resize-handle {
                    position: absolute; right: -2px; top: 0; bottom: 0;
                    width: 4px; background: hsl(var(--primary) / 0.4);
                    cursor: col-resize; z-index: 20;
                }
                .ProseMirror .tableWrapper { overflow-x: auto; }

                /* ── Spell check ── */
                .spell-error {
                    text-decoration: underline wavy #ef4444;
                    text-decoration-skip-ink: none;
                    cursor: pointer; border-radius: 1px;
                    transition: background-color 0.15s;
                }
                .spell-error:hover { background-color: rgba(239, 68, 68, 0.08); }
            `}</style>
        </div>
        </>
    );
}
