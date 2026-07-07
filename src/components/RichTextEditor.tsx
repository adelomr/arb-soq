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
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import DownloadButton from './DownloadButton';
import ContactButton from './ContactButton';
import SpellCheckExtension, { spellCheckKey } from './SpellCheckExtension';
import SpellCheckPopup from './SpellCheckPopup';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Image as ImageIcon,
    Link as LinkIcon,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Loader2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Unlink,
    Paperclip,
    Underline as UnderlineIcon,
    Strikethrough,
    Highlighter,
    Quote,
    Minus,
    Palette,
    Type,
    X,
    Check,
    Settings2,
    Download,
    Code,
    Phone,
    MessageCircle,
    Plus,
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

// ──────────────── Font size options ────────────────
const FONT_SIZES = [
    { label: 'صغير جداً', value: '12px' },
    { label: 'صغير', value: '14px' },
    { label: 'عادي', value: '16px' },
    { label: 'كبير', value: '20px' },
    { label: 'كبير جداً', value: '24px' },
    { label: 'ضخم', value: '32px' },
];

// ──────────────── Color palette ────────────────
const TEXT_COLORS = [
    '#000000', '#374151', '#DC2626', '#D97706', '#059669',
    '#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#65A30D',
    '#FFFFFF', '#F3F4F6', '#FEE2E2', '#FEF3C7', '#D1FAE5',
];

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

// ──────────────── Image Size Panel (appears when image is clicked) ────────────────
interface ImagePanelProps {
    onClose: () => void;
    onApply: (size: string, alt: string) => void;
    currentAlt: string;
}
const IMAGE_SIZES = [
    { label: 'صغير (25%)', value: '25%' },
    { label: 'متوسط (50%)', value: '50%' },
    { label: 'كبير (75%)', value: '75%' },
    { label: 'الحجم الأصلي', value: '100%' },
];
function ImagePanel({ onClose, onApply, currentAlt }: ImagePanelProps) {
    const [selectedSize, setSelectedSize] = useState('50%');
    const [altText, setAltText] = useState(currentAlt || '');

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 w-72" dir="rtl">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    خصائص الصورة
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
                            <button
                                key={value}
                                type="button"
                                onClick={() => setSelectedSize(value)}
                                className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                                    selectedSize === value
                                        ? 'border-primary bg-primary/10 text-primary font-medium'
                                        : 'border-border hover:border-primary/50 text-muted-foreground'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                        وصف الصورة (SEO Alt)
                    </label>
                    <input
                        type="text"
                        value={altText}
                        onChange={e => setAltText(e.target.value)}
                        placeholder="وصف مختصر للصورة..."
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        dir="rtl"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => onApply(selectedSize, altText)}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Check className="h-4 w-4" />
                    تطبيق
                </button>
            </div>
        </div>
    );
}

// Removed FloatingContactFAB to prevent layout overlap.


// ──────────────── Color Picker Popover ────────────────
function ColorPicker({ onSelect, onClose }: { onSelect: (color: string) => void; onClose: () => void }) {
    return (
        <div className="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 w-56 top-full mt-1" dir="rtl">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">لون النص</span>
                <button type="button" onClick={onClose}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
                {TEXT_COLORS.map(color => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => { onSelect(color); onClose(); }}
                        className="w-8 h-8 rounded-lg border-2 border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>
            <button
                type="button"
                onClick={() => { onSelect(''); onClose(); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1 border border-dashed border-border rounded-lg"
            >
                إزالة اللون
            </button>
        </div>
    );
}

// ──────────────── Font Size Picker ────────────────
function FontSizePicker({ onSelect, onClose }: { onSelect: (size: string) => void; onClose: () => void }) {
    return (
        <div className="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 w-44 top-full mt-1" dir="rtl">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-muted-foreground">حجم الخط</span>
                <button type="button" onClick={onClose}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
            {FONT_SIZES.map(({ label, value }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => { onSelect(value); onClose(); }}
                    className="w-full text-right px-3 py-1.5 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

// ──────────────── MenuBar ────────────────
const MenuBar = ({
    editor,
    onImageUpload,
    onFileUpload,
    onInsertPhone,
    imagePanelOpen,
    setImagePanelOpen,
    colorPickerOpen,
    setColorPickerOpen,
    fontSizeOpen,
    setFontSizeOpen,
    isHtmlMode,
    onToggleHtml,
}: {
    editor: any;
    onImageUpload: () => void;
    onFileUpload: () => void;
    onInsertPhone: (type: 'call' | 'whatsapp') => void;
    imagePanelOpen: boolean;
    setImagePanelOpen: (v: boolean) => void;
    colorPickerOpen: boolean;
    setColorPickerOpen: (v: boolean) => void;
    fontSizeOpen: boolean;
    setFontSizeOpen: (v: boolean) => void;
    isHtmlMode: boolean;
    onToggleHtml: () => void;
}) => {
    if (!editor) return null;

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('أدخل رابط الموقع (URL):', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const insertDownloadButton = useCallback(() => {
        editor.chain().focus().insertContent({
            type: 'downloadButton',
            attrs: {
                text: 'تحميل الملف',
                url: '',
            },
        }).run();
    }, [editor]);

    const closeAll = () => {
        setColorPickerOpen(false);
        setFontSizeOpen(false);
        setImagePanelOpen(false);
    };

    return (
        <div className="flex flex-wrap gap-0.5 p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] rounded-t-xl w-full justify-between items-center">
            <div className="flex flex-wrap gap-0.5 items-center">
                {/* Undo / Redo */}
                <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || isHtmlMode} title="تراجع">
                    <Undo size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || isHtmlMode} title="إعادة">
                    <Redo size={16} />
                </ToolbarBtn>
                <Sep />

                {/* Headings */}
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} disabled={isHtmlMode} title="عنوان رئيسي H1">
                    <Heading1 size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} disabled={isHtmlMode} title="عنوان ثانوي H2">
                    <Heading2 size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} disabled={isHtmlMode} title="عنوان ثالثي H3">
                    <Heading3 size={16} />
                </ToolbarBtn>
                <Sep />

                {/* Text Style */}
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} disabled={isHtmlMode} title="عريض (B)">
                    <Bold size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} disabled={isHtmlMode} title="مائل (I)">
                    <Italic size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} disabled={isHtmlMode} title="تسطير">
                    <UnderlineIcon size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} disabled={isHtmlMode} title="شطب">
                    <Strikethrough size={16} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} disabled={isHtmlMode} title="تمييز">
                    <Highlighter size={16} />
                </ToolbarBtn>
                <Sep />

                {/* Color */}
                <div className="relative">
                    <ToolbarBtn
                        onClick={() => { closeAll(); setColorPickerOpen(!colorPickerOpen); }}
                        active={colorPickerOpen}
                        disabled={isHtmlMode}
                        title="لون الخط"
                    >
                        <Palette size={16} />
                    </ToolbarBtn>
                    {colorPickerOpen && (
                        <ColorPicker
                            onSelect={(color) => {
                                if (color) editor.chain().focus().setColor(color).run();
                                else editor.chain().focus().unsetColor().run();
                            }}
                            onClose={() => setColorPickerOpen(false)}
                        />
                    )}
                </div>

                {/* Font Size */}
                <div className="relative">
                    <ToolbarBtn
                        onClick={() => { closeAll(); setFontSizeOpen(!fontSizeOpen); }}
                        active={fontSizeOpen}
                        disabled={isHtmlMode}
                        title="حجم الخط"
                    >
                        <Type size={16} />
                    </ToolbarBtn>
                    {fontSizeOpen && (
                        <FontSizePicker
                            onSelect={(size) => {
                                editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
                            }}
                            onClose={() => setFontSizeOpen(false)}
                        />
                    )}
                </div>
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

                {/* Link */}
                <ToolbarBtn onClick={setLink} active={editor.isActive('link')} disabled={isHtmlMode} title="إدراج رابط">
                    <LinkIcon size={16} />
                </ToolbarBtn>
                {editor.isActive('link') && (
                    <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} danger disabled={isHtmlMode} title="إزالة الرابط">
                        <Unlink size={16} />
                    </ToolbarBtn>
                )}

                {/* WhatsApp */}
                <ToolbarBtn onClick={() => onInsertPhone('whatsapp')} disabled={isHtmlMode} title="إدراج رابط واتساب">
                    <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-500" />
                </ToolbarBtn>

                {/* Phone Call */}
                <ToolbarBtn onClick={() => onInsertPhone('call')} disabled={isHtmlMode} title="إدراج رابط اتصال">
                    <Phone size={16} className="text-blue-600 dark:text-blue-500" />
                </ToolbarBtn>

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

            {/* HTML Mode Toggle */}
            <div className="flex items-center mr-auto">
                <button
                    type="button"
                    onClick={onToggleHtml}
                    className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                        ${isHtmlMode 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                        }
                    `}
                    title={isHtmlMode ? "عرض المحرر المرئي" : "عرض كود HTML"}
                >
                    <Code size={14} />
                    <span>{isHtmlMode ? "المحرر المرئي" : "عرض كود HTML"}</span>
                </button>
            </div>
        </div>
    );
};

// ──────────────── Main Editor ────────────────
export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const generalFileInputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePanelOpen, setImagePanelOpen] = useState(false);
    const [selectedImageNode, setSelectedImageNode] = useState<any>(null);
    const [panelCoords, setPanelCoords] = useState<{ top: number; left: number } | null>(null);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const [fontSizeOpen, setFontSizeOpen] = useState(false);
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [contactDialogType, setContactDialogType] = useState<'call' | 'whatsapp' | null>(null);
    const [contactPhone, setContactPhone] = useState('');
    const [contactLabel, setContactLabel] = useState('');
    const [spellPopup, setSpellPopup] = useState<{
        word: string;
        message: string;
        replacements: string[];
        from: number;
        to: number;
        position: { top: number; left: number };
    } | null>(null);
    const ignoredWordsRef = useRef<Set<string>>(new Set());


    // Custom TextStyle with fontSize support
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

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TiptapImage.configure({
                inline: false,
                HTMLAttributes: {
                    class: 'editor-image',
                    style: 'max-width: 50%; height: auto; display: block; margin: 1rem auto; border-radius: 8px; cursor: pointer;',
                },
            }),
            Link.extend({
                parseHTML() {
                    return [
                        {
                            // Exclude download buttons AND contact buttons (call/whatsapp) from link parsing
                            // so their custom HTML/styles are preserved as-is
                            tag: 'a[href]:not(.download-btn-custom):not(.download-btn-wrapper):not([data-download-btn]):not(.contact-btn-wrapper)',
                        },
                    ];
                },
            }).configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline decoration-primary/30 underline-offset-4 font-medium hover:text-primary/80 transition-colors',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'اكتب محتواك هنا...',
            }),
            CustomTextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Underline,
            DownloadButton,
            ContactButton,
            SpellCheckExtension,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate dark:prose-invert max-w-none min-h-[320px] p-4 focus:outline-none text-right',
                dir: 'rtl',
                spellcheck: 'true',
            },
            handleClick(view, pos, event) {
                const target = event.target as HTMLElement;
                // ── Image click ──
                if (target.tagName === 'IMG') {
                    setSpellPopup(null);
                    setSelectedImageNode(target);
                    setImagePanelOpen(true);
                    const rect = target.getBoundingClientRect();
                    if (wrapperRef.current) {
                        const wrapperRect = wrapperRef.current.getBoundingClientRect();
                        const panelWidth = 288;
                        let left = (rect.left + rect.width / 2) - wrapperRect.left - (panelWidth / 2);
                        const minLeft = 8;
                        const maxLeft = wrapperRect.width - panelWidth - 8;
                        left = Math.max(minLeft, Math.min(maxLeft, left));
                        const top = rect.bottom - wrapperRect.top + 8;
                        setPanelCoords({ top, left });
                    }
                } else if (!(target as HTMLElement).closest?.('.spell-error')) {
                    // Only close image panel/spell popup when not clicking a spell-error span
                    setImagePanelOpen(false);
                    setSelectedImageNode(null);
                }
                return false;
            },
        },
    });

    useEffect(() => {
        if (editor && !editor.isDestroyed && value !== editor.getHTML() && !isHtmlMode) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor, isHtmlMode]);

    const handleToggleHtml = useCallback(() => {
        if (isHtmlMode) {
            // Sync the HTML value back to the Tiptap editor
            editor?.commands.setContent(value);
        }
        setIsHtmlMode(prev => !prev);
    }, [isHtmlMode, editor, value]);

    const handleImageUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileUpload = useCallback(() => {
        generalFileInputRef.current?.click();
    }, []);

    // ── Spell-error click: handled here (React onClick) so it always has fresh state ──
    const handleWrapperClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        
        // Prevent default navigation when clicking links inside the editor wrapper
        const anchor = target.closest('a');
        if (anchor) {
            e.preventDefault();
        }

        const spellEl = (
            target.classList.contains('spell-error') ? target
                : (target.closest('.spell-error') as HTMLElement | null)
        );
        if (spellEl) {
            const word = spellEl.dataset.spellWord || '';
            if (ignoredWordsRef.current.has(word)) return;
            const rawReplacements = spellEl.dataset.spellReplacements || '';
            const replacements = rawReplacements ? rawReplacements.split('||').filter(Boolean) : [];
            const message = spellEl.dataset.spellMessage || 'خطأ إملائي';
            const from = parseInt(spellEl.dataset.spellFrom || '0', 10);
            const to = parseInt(spellEl.dataset.spellTo || '0', 10);
            // position: fixed → viewport coordinates, do NOT add window.scrollY
            const rect = spellEl.getBoundingClientRect();
            const viewportH = window.innerHeight;
            const popupH = 280; // approximate popup height
            const popupTop = rect.bottom + 6 + popupH > viewportH
                ? rect.top - popupH - 4
                : rect.bottom + 6;
            const popupLeft = Math.min(
                Math.max(4, rect.left),
                window.innerWidth - 268
            );
            setSpellPopup({ word, message, replacements, from, to, position: { top: popupTop, left: popupLeft } });
            setImagePanelOpen(false);
        } else if (!(target.tagName === 'IMG')) {
            // Clicking elsewhere (but not image) closes spell popup
            setSpellPopup(null);
        }
    }, []);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;
        setUploadingImage(true);
        const storageRef = ref(storage, `general_images/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
            'state_changed',
            null,
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
        uploadTask.on(
            'state_changed',
            null,
            (error) => console.error('Upload error:', error),
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                editor.chain().focus().setLink({ href: downloadURL }).insertContent(file.name).run();
            }
        );
        e.target.value = '';
    };

    const handleApplyImageProps = (size: string, alt: string) => {
        if (!selectedImageNode) return;
        selectedImageNode.style.maxWidth = size;
        if (alt) selectedImageNode.alt = alt;
        setImagePanelOpen(false);
        if (editor) onChange(editor.getHTML());
    };

    const handleInsertContact = useCallback((type: 'call' | 'whatsapp') => {
        setContactPhone('');
        setContactLabel('');
        setContactDialogType(type);
    }, []);

    const handleConfirmContact = useCallback(() => {
        if (!editor || !contactPhone.trim() || !contactDialogType) return;
        const phone = contactPhone.replace(/\s+/g, '');
        const label = contactLabel.trim() || phone;

        editor.chain().focus().insertContent({
            type: 'contactButton',
            attrs: {
                type: contactDialogType,
                phone: phone,
                text: label,
            },
        }).run();

        onChange(editor.getHTML());
        setContactDialogType(null);
        setContactPhone('');
        setContactLabel('');
    }, [editor, contactPhone, contactLabel, contactDialogType, onChange]);

    const handleSpellReplace = (replacement: string) => {
        if (!editor || !spellPopup) return;
        const { from, to } = spellPopup;
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, replacement).run();
        setSpellPopup(null);
    };

    const handleSpellIgnore = () => {
        if (!spellPopup) return;
        ignoredWordsRef.current.add(spellPopup.word);
        // remove decorations for this word by re-triggering with the ignored set
        setSpellPopup(null);
    };

    const handleSpellIgnoreAll = () => {
        if (!spellPopup) return;
        ignoredWordsRef.current.add(spellPopup.word);
        setSpellPopup(null);
    };

    if (!editor) {
        return (
            <div className="w-full h-[350px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    return (
        <>
        {/* Contact Phone Dialog */}
        {contactDialogType && (
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)' }}
                onClick={(e) => { if (e.target === e.currentTarget) setContactDialogType(null); }}
            >
                <div
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-slate-200 dark:border-slate-700"
                    dir="rtl"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                                background: contactDialogType === 'whatsapp'
                                    ? 'linear-gradient(135deg, #25d366, #128c7e)'
                                    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                color: '#fff',
                            }}
                        >
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
                            <input
                                type="tel"
                                value={contactPhone}
                                onChange={e => setContactPhone(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmContact(); } }}
                                placeholder="أدخل رقم الهاتف..."
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                dir="ltr"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">نص الرابط (اختياري)</label>
                            <input
                                type="text"
                                value={contactLabel}
                                onChange={e => setContactLabel(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmContact(); } }}
                                placeholder="مثال: تواصل معنا، اضغط للاتصال..."
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-5">
                        <button
                            type="button"
                            onClick={handleConfirmContact}
                            disabled={!contactPhone.trim()}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
                            style={{
                                background: contactDialogType === 'whatsapp'
                                    ? 'linear-gradient(135deg, #25d366, #128c7e)'
                                    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            }}
                        >
                            <Check size={16} />
                            إدراج في المحتوى
                        </button>
                        <button
                            type="button"
                            onClick={() => setContactDialogType(null)}
                            className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div
            ref={wrapperRef}
            onClick={handleWrapperClick}
            className="relative tiptap-wrapper border border-slate-200 dark:border-slate-700 rounded-xl overflow-visible bg-white dark:bg-slate-900 shadow-sm"
            dir="rtl"
        >
            <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/*" />
            <input type="file" ref={generalFileInputRef} onChange={onGeneralFileChange} className="hidden" />

            {/* Toolbar */}
            <div className="sticky top-[80px] z-20">
                <MenuBar
                    editor={editor}
                    onImageUpload={handleImageUpload}
                    onFileUpload={handleFileUpload}
                    onInsertPhone={handleInsertContact}
                    imagePanelOpen={imagePanelOpen}
                    setImagePanelOpen={setImagePanelOpen}
                    colorPickerOpen={colorPickerOpen}
                    setColorPickerOpen={setColorPickerOpen}
                    fontSizeOpen={fontSizeOpen}
                    setFontSizeOpen={setFontSizeOpen}
                    isHtmlMode={isHtmlMode}
                    onToggleHtml={handleToggleHtml}
                />
            </div>

            {/* Image Properties Panel */}
            {imagePanelOpen && selectedImageNode && panelCoords && (
                <div 
                    className="absolute z-50"
                    style={{ 
                        top: `${panelCoords.top}px`, 
                        left: `${panelCoords.left}px` 
                    }}
                >
                    <ImagePanel
                        onClose={() => setImagePanelOpen(false)}
                        onApply={handleApplyImageProps}
                        currentAlt={selectedImageNode?.alt || ''}
                    />
                </div>
            )}

            {/* Upload indicator */}
            {uploadingImage && (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-slate-100 dark:border-slate-800 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري رفع الصورة...
                </div>
            )}

            {isHtmlMode ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full min-h-[320px] p-4 font-mono text-sm bg-[#0f172a] text-[#f8fafc] border-t border-slate-200 dark:border-slate-700 focus:outline-none rounded-b-xl resize-y"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                    placeholder="اكتب ونسق كود HTML هنا..."
                />
            ) : (
                <EditorContent editor={editor} />
            )}

            {/* Spell Check Popup */}
            {spellPopup && (
                <SpellCheckPopup
                    word={spellPopup.word}
                    message={spellPopup.message}
                    replacements={spellPopup.replacements}
                    position={spellPopup.position}
                    onReplace={handleSpellReplace}
                    onIgnore={handleSpellIgnore}
                    onIgnoreAll={handleSpellIgnoreAll}
                    onClose={() => setSpellPopup(null)}
                />
            )}

            {/* Floating Contact FAB removed to prevent overlap */}

            <style jsx global>{`
                .tiptap p.is-editor-empty:first-child::before {
                    color: #94a3b8;
                    content: attr(data-placeholder);
                    float: right;
                    height: 0;
                    pointer-events: none;
                }
                .dark .tiptap p.is-editor-empty:first-child::before {
                    color: #475569;
                }
                .tiptap img.editor-image {
                    max-width: 50%;
                    height: auto;
                    border-radius: 8px;
                    display: block;
                    margin: 1rem auto;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: border-color 0.2s;
                }
                .tiptap img.editor-image:hover {
                    border-color: hsl(var(--primary));
                }
                .tiptap img.editor-image.ProseMirror-selectednode {
                    border-color: hsl(var(--primary));
                    outline: 2px solid hsl(var(--primary) / 0.3);
                    outline-offset: 2px;
                }
                .prose {
                    font-size: 16px;
                    line-height: 1.7;
                }
                .prose h1 { font-size: 2em; margin-top: 1.5rem; margin-bottom: 0.75rem; font-weight: 700; }
                .prose h2 { font-size: 1.5em; margin-top: 1.25rem; margin-bottom: 0.5rem; font-weight: 700; }
                .prose h3 { font-size: 1.25em; margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600; }
                .prose ul, .prose ol {
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                    padding-right: 1.5rem;
                    padding-left: 0;
                }
                .prose li { margin: 0.25rem 0; }
                .prose blockquote {
                    border-right: 4px solid hsl(var(--primary));
                    padding-right: 1rem;
                    font-style: normal;
                    color: hsl(var(--muted-foreground));
                    margin: 1rem 0;
                }
                .prose mark {
                    background-color: #fef08a;
                    padding: 0.1em 0.2em;
                    border-radius: 3px;
                }
                .dark .prose mark { background-color: #854d0e; }
                .prose hr { border-color: hsl(var(--border)); margin: 1.5rem 0; }

                /* Spell check wavy underline */
                .spell-error {
                    text-decoration: underline wavy #ef4444;
                    text-decoration-skip-ink: none;
                    cursor: pointer;
                    border-radius: 1px;
                    transition: background-color 0.15s;
                }
                .spell-error:hover {
                    background-color: rgba(239, 68, 68, 0.08);
                }
            `}</style>
        </div>
        </>  
    );
}
