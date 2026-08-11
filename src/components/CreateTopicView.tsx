'use client';

import React, { useEffect, useState } from 'react';
import { createBlogPost, generateSlug } from '@/lib/blog-service';
import { uploadFileAndReturnInfo } from '@/lib/firebase-storage-helpers';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  PenTool, 
  Save, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import RichTextEditor from './RichTextEditor';

interface CreateTopicViewProps {
  onSuccess?: () => void;
}

export default function CreateTopicView({ onSuccess }: CreateTopicViewProps) {
  const { user, userProfile } = useAuth();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('مدير الموقع');
  const [tagsStr, setTagsStr] = useState('');
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { toast } = useToast();

  // Prefill author from AuthContext
  useEffect(() => {
    if (userProfile?.name) {
      setAuthor(userProfile.name);
    } else if (user?.displayName) {
      setAuthor(user.displayName);
    }
  }, [userProfile, user]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(generateSlug(val));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'مدخلات غير كاملة',
        description: 'يرجى إدخال عنوان المقال ومحتواه.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      let imageUrl = '';
      
      // Upload cover image if exists
      if (coverImage) {
        const uploadResult = await uploadFileAndReturnInfo(coverImage, 'blog-covers');
        imageUrl = uploadResult.url;
      }

      // Generate slug and tags
      const blogSlug = slug.trim() || generateSlug(title) || Date.now().toString();
      const tagsArray = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      // Create blog post in Firestore
      await createBlogPost({
        title,
        slug: blogSlug,
        content,
        author,
        imageUrl,
        tags: tagsArray,
      });

      toast({
        title: 'تم نشر الموضوع بنجاح!',
        description: 'الموضوع متاح الآن للزوار في المدونة والصفحة الرئيسية.',
      });

      setIsSuccess(true);
      
      // Clear inputs
      setTitle('');
      setSlug('');
      setContent('');
      setTagsStr('');
      setCoverImage(null);
      setCoverImagePreview(null);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'فشل النشر',
        description: 'حدث خطأ غير متوقع أثناء نشر المقال.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border border-border bg-card text-center py-12 px-6">
        <CardContent className="flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">تم النشر بنجاح!</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            تمت إضافة المقال بنجاح وسيظهر للجميع الآن. جاري الانتقال للوحة التحكم...
          </p>
          <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-4">
            إضافة مقالة أخرى
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/50 pb-6 text-right">
        <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold font-headline">
          <PenTool className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          كتابة موضوع جديد
        </CardTitle>
        <CardDescription>إنشاء ونشر موضوع أو مقال جديد ليظهر للزوار في المدونة والصفحة الرئيسية.</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handlePublish} className="space-y-6 text-right" dir="rtl">
          {/* Floating Sticky Save Bar */}
          <div className="sticky top-20 z-30 bg-card/95 backdrop-blur-md border border-border/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-2 overflow-hidden">
              <PenTool className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-bold text-sm md:text-base text-foreground truncate">
                {title ? `نشر: ${title}` : 'كتابة موضوع جديد'}
              </span>
            </div>
            <Button type="submit" disabled={actionLoading} className="bg-primary text-primary-foreground flex items-center gap-2 px-5 py-2 shadow-sm hover:opacity-90 flex-shrink-0">
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري النشر...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  نشر الموضوع
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="create-topic-title" className="text-foreground font-medium">عنوان الموضوع <span className="text-destructive">*</span></Label>
              <Input 
                id="create-topic-title"
                type="text" 
                value={title} 
                onChange={handleTitleChange} 
                placeholder="أدخل عنوان المقالة الجذاب..."
                className="bg-background border-border text-foreground text-right"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-topic-author" className="text-foreground font-medium">اسم الكاتب <span className="text-destructive">*</span></Label>
              <Input 
                id="create-topic-author"
                type="text" 
                value={author} 
                onChange={(e) => setAuthor(e.target.value)} 
                placeholder="اسم الكاتب..."
                className="bg-background border-border text-foreground text-right"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="create-topic-tags" className="text-foreground font-medium">الكلمات الدلالية (Tags)</Label>
              <Input 
                id="create-topic-tags"
                type="text" 
                value={tagsStr} 
                onChange={(e) => setTagsStr(e.target.value)} 
                placeholder="مثال: أندرويد، صيانة، سيارات (افصل بينها بفاصلة)"
                className="bg-background border-border text-foreground text-right"
              />
            </div>

            <div className="space-y-2 text-right">
              <Label className="text-foreground font-medium block">الصورة البارزة للمقالة (Cover Image)</Label>
              <div className="flex flex-row-reverse items-center gap-4 w-full">
                <div 
                  className="relative w-28 h-20 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => document.getElementById('cover-create-upload')?.click()}
                >
                  {coverImagePreview ? (
                    <Image src={coverImagePreview} alt="Cover Preview" fill className="object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground text-right">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('cover-create-upload')?.click()}
                    className="border-border/60 hover:bg-muted text-xs"
                  >
                    اختر صورة
                  </Button>
                  <p className="text-[10px] mt-1">يُفضل أن تكون بصيغة JPG أو PNG</p>
                </div>
                <input 
                  id="cover-create-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">محتوى الموضوع <span className="text-destructive">*</span></Label>
            <RichTextEditor 
              value={content} 
              onChange={setContent} 
              placeholder="اكتب تفاصيل مقالتك أو موضوعك هنا..." 
              stickyTopOffset="top-[144px]"
            />
          </div>

          <div className="pt-4 flex justify-end border-t border-border/50">
            <Button type="submit" disabled={actionLoading} className="bg-primary text-primary-foreground flex items-center gap-2 px-6">
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري النشر الآن...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  نشر الموضوع
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
