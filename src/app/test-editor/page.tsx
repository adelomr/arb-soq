'use client';

import React, { useState } from 'react';
import ContentWrapper from '@/components/ContentWrapper';
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار تحميل المحرر...</div> });

export default function TestEditorPage() {
    const [content, setContent] = useState('<h2>تجربة محرر الموضوعات الجديد</h2><p>اضغط على الصورة أدناه أو قم بإضافة زر تحميل جديد للتجربة.</p><p><img class="editor-image" src="https://picsum.photos/id/1018/600/400" alt="صورة تجريبية" style="max-width: 50%; height: auto; display: block; margin: 1rem auto; border-radius: 8px; cursor: pointer;" /></p>');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8" dir="rtl">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">صفحة تجربة محرر الموضوعات</h1>
                    <p className="text-sm text-muted-foreground mt-1">تسمح هذه الصفحة باختبار نافذة خصائص الصور وزر التحميل الاحترافي.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">محرر النصوص:</label>
                    <RichTextEditor
                        value={content}
                        onChange={setContent}
                        placeholder="اكتب المحتوى هنا..."
                    />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h3 className="text-lg font-bold text-foreground">مخرجات الـ HTML الناتجة:</h3>
                    <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-xs font-mono overflow-auto max-h-60 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap text-left" dir="ltr">
                        {content}
                    </pre>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h3 className="text-lg font-bold text-foreground">معاينة مباشرة للمخرجات (المقالة المنشورة):</h3>
                    <ContentWrapper html={content} className="prose prose-slate dark:prose-invert max-w-none p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
