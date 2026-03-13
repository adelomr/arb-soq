"use client";

import React, { useState, useEffect } from 'react';
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { createBlogPost, generateSlug } from "@/lib/blog-service";
import { uploadFileAndReturnInfo } from "@/lib/firebase-storage-helpers";
import { Loader2, Image as ImageIcon, Save, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import 'react-quill/dist/quill.snow.css';

// React-Quill uses document object, which is not available during SSR
// We'll use a manual loading pattern in the component instead of next/dynamic for better reliability with refs
// const ReactQuill = dynamic(() => import("react-quill"), { ssr: false }); <--- Removed for reliability

// Simple shim for findDOMNode which is missing in some React 18 environments but used by react-quill
if (typeof window !== 'undefined') {
  const ReactDOM = require('react-dom');
  if (ReactDOM && !ReactDOM.findDOMNode) {
    ReactDOM.findDOMNode = (inst: any) => inst;
  }
}

export default function CreateBlogPost() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("مدير الموقع");
  const [tags, setTags] = useState("");
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [Editor, setEditor] = useState<any>(null);

  // Set author name automatically from user profile
  useEffect(() => {
    if (userProfile?.name) {
      setAuthor(userProfile.name);
    } else if (user?.displayName) {
      setAuthor(user.displayName);
    }
  }, [userProfile, user]);

  // Load ReactQuill manually to avoid SSR and ref issues
  useEffect(() => {
    const loadEditor = async () => {
      try {
        const mod = await import('react-quill');
        setEditor(() => mod.default);
      } catch (err) {
        console.error("Failed to load ReactQuill:", err);
      }
    };
    loadEditor();
  }, []);

  const quillRef = React.useRef<any>(null);

  // Custom Image Handler for ReactQuill
  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        try {
          setLoading(true);
          const uploadResult = await uploadFileAndReturnInfo(file, "blog-content");
          
          // Get Quill instance from ref
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", uploadResult.url);
            quill.setSelection(range.index + 1);
          }
        } catch (err) {
          console.error("Error uploading image to blog content:", err);
          setError("خطأ في رفع الصورة. يرجى المحاولة مرة أخرى.");
        } finally {
          setLoading(false);
        }
      }
    };
  };

  const modules = React.useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), []);

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
    "list",
    "bullet",
    "link",
    "image",
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError("الرجاء إدخال العنوان والمحتوى");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = "";
      // Upload cover image if exists
      if (coverImage) {
        const uploadResult = await uploadFileAndReturnInfo(coverImage, "blog-covers");
        imageUrl = uploadResult.url;
      }

      // Generate slug and construct tags array
      const slug = generateSlug(title) || Date.now().toString();
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);

      // Save to Firestore
      await createBlogPost({
        title,
        slug,
        content,
        author,
        imageUrl,
        tags: tagsArray,
      });

      // Redirect to the blog index or the new post
      router.push(`/blog/${slug}`);
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء نشر المقالة. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <main className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-foreground">كتابة مقالة جديدة</h1>
            <p className="text-muted-foreground mt-2">إضافة تدوينة جديدة إلى مدونة سوق العرب.</p>
          </div>
          <Link href="/blog" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            العودة للمدونة
            <ArrowRight className="w-4 h-4 mr-2" />
          </Link>
        </div>

        <form onSubmit={handlePublish} className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border space-y-8 text-right">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-200 dark:border-red-900/50 text-right">
              {error}
            </div>
          )}

          {/* Cover Image Upload */}
          <div className="flex flex-col items-end">
            <label className="block text-sm font-medium text-foreground mb-3 text-right w-full">الصورة البارزة للمقالة (اختياري)</label>
            <div className="flex flex-row-reverse items-center gap-4 w-full">
              <div 
                className="relative w-40 h-28 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('cover-upload')?.click()}
              >
                {coverImagePreview ? (
                  <Image src={coverImagePreview} alt="Cover Preview" fill className="object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="text-sm text-muted-foreground text-right">
                <p>اضغط لاختيار صورة</p>
                <p className="text-xs mt-1">يُفضل أن تكون بصيغة JPG أو PNG</p>
              </div>
              <input 
                id="cover-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-right">
              <label className="text-sm font-medium text-foreground">عنوان المقالة <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أدخل عنوان المقالة الجذاب..."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
                dir="rtl"
                required
              />
            </div>
            
            <div className="space-y-2 text-right">
              <label className="text-sm font-medium text-foreground">اسم الكاتب</label>
              <input 
                type="text" 
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-sm font-medium text-foreground">الكلمات الدلالية (Tags)</label>
            <input 
              type="text" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="مثال: تقنية, أندرويد, صيانة، هواتف (افصل بينها بفاصلة)"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
              dir="rtl"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2 text-right">
             <label className="text-sm font-medium text-foreground">محتوى المقالة <span className="text-red-500">*</span></label>
             <div className="bg-background rounded-xl overflow-hidden [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:rounded-b-xl [&_.ql-container]:min-h-[400px]" dir="ltr">
                {Editor ? (
                   <Editor 
                     ref={quillRef}
                     theme="snow" 
                     value={content} 
                     onChange={setContent} 
                     modules={modules}
                     formats={formats}
                     placeholder="اكتب محتوى تدوينتك هنا... يمكنك إضافة صور، روابط، وتنسيق النص بالألوان."
                   />
                ) : (
                   <div className="h-[400px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center">
                     <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                   </div>
                )}
             </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-start">
             <button 
               type="submit" 
               disabled={loading}
               className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium flex items-center transition-colors disabled:opacity-70"
             >
               {loading ? (
                 <>
                   <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                   جاري النشر...
                 </>
               ) : (
                 <>
                   <Save className="w-5 h-5 ml-2" />
                   نشر المقالة
                 </>
               )}
             </button>
          </div>

        </form>
      </main>
    </div>
  );
}
