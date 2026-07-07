'use client';

import { useEffect, useState } from 'react';
import { 
  getAllBlogs, 
  updateBlogPost, 
  deleteBlogPost, 
  generateSlug,
  getAuthorSettings,
  updateAuthorSettings,
  BlogPost,
  AuthorSettings
} from '@/lib/blog-service';
import { uploadFileAndReturnInfo } from '@/lib/firebase-storage-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { 
  Loader2, 
  NotebookPen, 
  Trash2, 
  Edit, 
  Save, 
  ArrowRight, 
  Eye, 
  Search, 
  Image as ImageIcon,
  Calendar,
  User,
  Tags,
  Settings,
  UserCircle,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import RichTextEditor from './RichTextEditor';
import CreateTopicView from './CreateTopicView';

interface TopicManagerProps {
  initialView?: 'list' | 'create';
}

export default function TopicManager({ initialView = 'list' }: TopicManagerProps) {
  const [topics, setTopics] = useState<BlogPost[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View states: 'list' | 'edit' | 'author' | 'create'
  const [view, setView] = useState<'list' | 'edit' | 'author' | 'create'>(initialView);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);
  
  // Edit form states
  const [selectedTopic, setSelectedTopic] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  // Author settings states
  const [authorSettings, setAuthorSettings] = useState<AuthorSettings>({ name: '', avatar: '', bio: '' });
  const [authorAvatarFile, setAuthorAvatarFile] = useState<File | null>(null);
  const [authorAvatarPreview, setAuthorAvatarPreview] = useState<string | null>(null);
  const [authorSettingsLoading, setAuthorSettingsLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchTopics();
    loadAuthorSettings();
  }, []);

  const loadAuthorSettings = async () => {
    const settings = await getAuthorSettings();
    if (settings) {
      setAuthorSettings(settings);
      setAuthorAvatarPreview(settings.avatar || null);
    }
  };

  const handleSaveAuthorSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthorSettingsLoading(true);
    try {
      let avatarUrl = authorSettings.avatar;
      if (authorAvatarFile) {
        const uploadResult = await uploadFileAndReturnInfo(authorAvatarFile, 'author-avatars');
        avatarUrl = uploadResult.url;
      }
      const updated = { ...authorSettings, avatar: avatarUrl };
      await updateAuthorSettings(updated);
      setAuthorSettings(updated);
      toast({ title: 'تم حفظ إعدادات المؤلف بنجاح' });
    } catch {
      toast({ title: 'فشل الحفظ', variant: 'destructive' });
    } finally {
      setAuthorSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTopics(topics);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTopics(
        topics.filter(
          t => 
            t.title.toLowerCase().includes(query) || 
            t.author.toLowerCase().includes(query) ||
            t.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, topics]);

  const fetchTopics = async () => {
    setLoading(true);
    const data = await getAllBlogs();
    setTopics(data);
    setFilteredTopics(data);
    setLoading(false);
  };

  const handleOpenEdit = (topic: BlogPost) => {
    setSelectedTopic(topic);
    setTitle(topic.title);
    setSlug(topic.slug);
    setContent(topic.content);
    setAuthor(topic.author);
    setTagsStr(topic.tags?.join(', ') || '');
    setCoverImage(null);
    setCoverImagePreview(topic.imageUrl || null);
    setView('edit');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim()) {
      toast({
        title: 'خطأ في المدخلات',
        description: 'العنوان والكاتب والمحتوى حقول مطلوبة.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      let imageUrl = selectedTopic?.imageUrl || '';
      
      // Upload new cover image if updated
      if (coverImage) {
        const uploadResult = await uploadFileAndReturnInfo(coverImage, 'blog-covers');
        imageUrl = uploadResult.url;
      }

      const updatedSlug = generateSlug(title) || selectedTopic?.slug || Date.now().toString();
      const tagsArray = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      if (selectedTopic?.id) {
        await updateBlogPost(selectedTopic.id, {
          title,
          slug: updatedSlug,
          content,
          author,
          imageUrl,
          tags: tagsArray,
        });

        toast({
          title: 'تم تحديث الموضوع',
          description: 'تم حفظ التعديلات بنجاح.',
        });
      }

      setView('list');
      fetchTopics();
    } catch (error) {
      console.error(error);
      toast({
        title: 'فشلت العملية',
        description: 'حدث خطأ غير متوقع أثناء تحديث الموضوع.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الموضوع نهائياً؟')) return;

    setActionLoading(true);
    try {
      await deleteBlogPost(id);
      toast({
        title: 'تم حذف الموضوع',
        description: 'تمت إزالة الموضوع بنجاح.',
      });
      fetchTopics();
    } catch (error) {
      console.error(error);
      toast({
        title: 'فشل الحذف',
        description: 'حدث خطأ أثناء محاولة حذف الموضوع.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">جاري تحميل الموضوعات...</p>
      </div>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/50">
        <div className="text-right">
          <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold font-headline">
            <NotebookPen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            إدارة الموضوعات
          </CardTitle>
          <CardDescription>عرض وتعديل وحذف الموضوعات والمقالات المنشورة في الموقع.</CardDescription>
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {view !== 'list' && (
            <Button variant="outline" onClick={() => setView('list')} className="w-full sm:w-auto flex items-center justify-center gap-2">
              <ArrowRight className="h-4 w-4" />
              العودة للقائمة
            </Button>
          )}
          {view === 'list' && (
            <>
              <Button 
                onClick={() => setView('create')} 
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                إنشاء موضوع جديد
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setView('author')} 
                className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                <UserCircle className="h-4 w-4" />
                إعدادات المؤلف
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {view === 'author' ? (
          // ===================== Author Settings View =====================
          <form onSubmit={handleSaveAuthorSettings} className="space-y-6 max-w-lg text-right" dir="rtl">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                <UserCircle className="h-5 w-5 text-primary" />
                إعدادات المؤلف الافتراضي
              </h3>
              <p className="text-sm text-muted-foreground">ستظهر هذه المعلومات في بطاقة المؤلف أسفل كل موضوع.</p>
            </div>

            {/* Avatar Upload */}
            <div className="space-y-3">
              <label className="text-foreground font-medium block">صورة المؤلف</label>
              <div className="flex items-center gap-4">
                <div 
                  className="relative w-20 h-20 rounded-full border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-primary transition-colors bg-muted flex items-center justify-center flex-shrink-0"
                  onClick={() => document.getElementById('author-avatar-upload')?.click()}
                >
                  {authorAvatarPreview ? (
                    <Image src={authorAvatarPreview} alt="Author Avatar" fill className="object-cover" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('author-avatar-upload')?.click()}
                    className="mb-1"
                  >
                    رفع صورة
                  </Button>
                  <p className="text-xs">JPG أو PNG - بحجم لا يتجاوز 2MB</p>
                </div>
                <input
                  id="author-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAuthorAvatarFile(file);
                      setAuthorAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>

            {/* Author Name */}
            <div className="space-y-2">
              <Label htmlFor="author-name" className="text-foreground font-medium">اسم المؤلف</Label>
              <Input
                id="author-name"
                value={authorSettings.name}
                onChange={(e) => setAuthorSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المؤلف أو المحرر..."
                className="bg-background border-border text-right"
                dir="rtl"
              />
            </div>

            {/* Author Bio */}
            <div className="space-y-2">
              <Label htmlFor="author-bio" className="text-foreground font-medium">نبذة عن المؤلف</Label>
              <textarea
                id="author-bio"
                value={authorSettings.bio}
                onChange={(e) => setAuthorSettings(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="نبذة مختصرة تظهر في بطاقة المؤلف..."
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-border bg-background text-foreground text-right resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                dir="rtl"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setView('list')}>إلغاء</Button>
              <Button type="submit" disabled={authorSettingsLoading} className="flex items-center gap-2">
                {authorSettingsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ الإعدادات
              </Button>
            </div>
          </form>
        ) : view === 'create' ? (
          <CreateTopicView onSuccess={() => { setView('list'); fetchTopics(); }} />
        ) : view === 'list' ? (
          <div className="space-y-6">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="البحث عن موضوع، كاتب، أو كلمة دلالية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 bg-background border-border text-right text-foreground"
                dir="rtl"
              />
            </div>

            {filteredTopics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                <NotebookPen className="h-12 w-12 mx-auto mb-3 opacity-30 text-primary" />
                <p className="text-lg font-medium">لا توجد موضوعات مطابقة للبحث</p>
                <p className="text-sm mt-1">تأكد من كتابة الكلمات بشكل صحيح أو قم بنشر موضوع جديد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTopics.map((topic) => (
                  <div key={topic.id} className="flex flex-col sm:flex-row border border-border/60 hover:border-primary/50 rounded-2xl overflow-hidden bg-muted/20 hover:shadow-md transition-all duration-300">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-40 h-40 bg-muted flex-shrink-0">
                      {topic.imageUrl ? (
                        <Image 
                          src={topic.imageUrl} 
                          alt={topic.title} 
                          fill 
                          className="object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary/50">
                          <ImageIcon className="h-8 w-8 opacity-40 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 flex flex-col justify-between flex-grow text-right" dir="rtl">
                      <div className="space-y-2">
                        <div className="flex gap-2 flex-wrap">
                          {topic.tags?.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="font-bold text-lg text-foreground line-clamp-2">{topic.title}</h3>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-primary" />
                            {topic.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {topic.createdAt?.seconds 
                              ? format(new Date(topic.createdAt.seconds * 1000), 'yyyy/MM/dd', { locale: ar })
                              : "حديثاً"}
                          </span>
                        </div>

                        <div className="flex justify-end gap-2 mt-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            asChild 
                            title="عرض الموضوع"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border/50"
                          >
                            <a href={`/blog/${topic.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenEdit(topic)}
                            className="text-primary hover:bg-primary hover:text-primary-foreground border-primary/30 flex items-center gap-1.5"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            تعديل
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => topic.id && handleDelete(topic.id)}
                            title="حذف الموضوع"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive border border-border/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 text-right" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="topic-title" className="text-foreground font-medium">عنوان الموضوع <span className="text-destructive">*</span></Label>
                <Input 
                  id="topic-title"
                  type="text" 
                  value={title} 
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSlug(generateSlug(e.target.value));
                  }} 
                  placeholder="أدخل عنوان المقالة الجذاب..."
                  className="bg-background border-border text-foreground text-right"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic-author" className="text-foreground font-medium">اسم الكاتب <span className="text-destructive">*</span></Label>
                <Input 
                  id="topic-author"
                  type="text" 
                  value={author} 
                  onChange={(e) => setAuthor(e.target.value)} 
                  placeholder="اسم كاتب الموضوع..."
                  className="bg-background border-border text-foreground text-right"
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="topic-tags" className="text-foreground font-medium">الكلمات الدلالية (Tags)</Label>
                <Input 
                  id="topic-tags"
                  type="text" 
                  value={tagsStr} 
                  onChange={(e) => setTagsStr(e.target.value)} 
                  placeholder="مثال: هواتف، صيانة، أخبار (افصل بينها بفاصلة)"
                  className="bg-background border-border text-foreground text-right"
                />
              </div>

              <div className="space-y-2 text-right">
                <Label className="text-foreground font-medium block">الصورة البارزة (Cover Image)</Label>
                <div className="flex flex-row-reverse items-center gap-4 w-full">
                  <div 
                    className="relative w-28 h-20 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => document.getElementById('cover-edit-upload')?.click()}
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
                      onClick={() => document.getElementById('cover-edit-upload')?.click()}
                      className="border-border/60 hover:bg-muted text-xs"
                    >
                      تغيير الصورة
                    </Button>
                    <p className="text-[10px] mt-1">يُفضل أن تكون بصيغة JPG أو PNG</p>
                  </div>
                  <input 
                    id="cover-edit-upload" 
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
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setView('list')} disabled={actionLoading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-primary text-primary-foreground flex items-center gap-2">
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
