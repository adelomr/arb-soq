

'use client';

import { useState } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Image as ImageIcon, ZoomIn, X } from 'lucide-react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import ZoomableImage from './ZoomableImage';

const translations = {
  ar: {
    noImages: "لا توجد صور في معرض الأعمال حتى الآن.",
    addImage: "إضافة صورة",
    uploadImage: "تحميل صورة",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    uploading: "جارٍ التحميل...",
    imageRequired: "الرجاء اختيار صورة أولاً.",
    success: "تمت إضافة الصورة بنجاح!",
    deleteSuccess: "تم حذف الصورة بنجاح.",
    error: "خطأ",
    errorDesc: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    deleteConfirmTitle: "هل أنت متأكد؟",
    deleteConfirmDesc: "سيتم حذف هذه الصورة نهائياً.",
    cancel: "إلغاء",
    delete: "حذف",
    imageExists: "الصورة موجودة بالفعل",
    imageExistsDesc: "هذه الصورة موجودة بالفعل في معرض أعمالك.",
    uploadingImage: "جارٍ رفع الصورة...",
    updatingProfile: "جارٍ تحديث الملف الشخصي...",
    imageUploadFailed: "فشل رفع الصورة"
  },
  en: {
    noImages: "No images in the portfolio yet.",
    addImage: "Add Image",
    uploadImage: "Upload Image",
    save: "Save",
    saving: "Saving...",
    uploading: "Uploading...",
    imageRequired: "Please select an image first.",
    success: "Image added successfully!",
    deleteSuccess: "Image deleted successfully.",
    error: "Error",
    errorDesc: "Something went wrong. Please try again.",
    deleteConfirmTitle: "Are you sure?",
    deleteConfirmDesc: "This will permanently delete the image.",
    cancel: "Cancel",
    delete: "Delete",
    imageExists: "Image Already Exists",
    imageExistsDesc: "This image is already in your portfolio.",
    uploadingImage: "Uploading image...",
    updatingProfile: "Updating profile...",
    imageUploadFailed: "Image Upload Failed"
  }
};

interface PortfolioManagerProps {
  worker: UserProfile;
  isOwner: boolean;
  onUpdate: () => void;
}

export default function PortfolioManager({ worker, isOwner, onUpdate }: PortfolioManagerProps) {
  const { language } = useLanguage();
  const t = translations.ar;
  const { uploadProfileImage, addPortfolioImage, deletePortfolioImage } = useAuth();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveImage = async () => {
    if (!imageFile) {
      toast({ title: t.error, description: t.imageRequired, variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      toast({ title: t.uploadingImage });
      const imageUrl = await uploadProfileImage(worker.id, imageFile, `portfolio/${worker.id}/${imageFile.name}`);
      
      toast({ title: "اكتمل الرفع", description: "جارٍ تحديث ملفك الشخصي..." });
      
      const newImage = {
        id: uuidv4(),
        url: imageUrl,
      };

      await addPortfolioImage(worker.id, newImage);
      
      toast({ title: t.success });
      onUpdate();
      resetForm();
    } catch (err: any) {
      console.error("Portfolio upload error:", err);
      toast({ title: t.imageUploadFailed, description: err.message || t.errorDesc, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteImage = async (imageId: string) => {
    setIsDeleting(imageId);
    try {
      await deletePortfolioImage(worker.id, imageId);
      toast({ title: t.deleteSuccess });
      onUpdate();
    } catch (err) {
        console.error(err);
        toast({ title: t.error, description: t.errorDesc, variant: 'destructive' });
    } finally {
        setIsDeleting(null);
    }
  }

  const resetForm = () => {
    setIsAddDialogOpen(false);
    setImageFile(null);
    setImagePreview(null);
  };
  
  return (
    <div className="space-y-4">
      {isOwner && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t.addImage}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addImage}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="portfolio-upload" className="block text-sm font-medium text-gray-700 mb-1">{t.uploadImage}</label>
                <Input id="portfolio-upload" type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              {imagePreview && <Image src={imagePreview} alt="Preview" width={400} height={225} className="rounded-md object-cover w-full aspect-video" />}
              <Button onClick={handleSaveImage} disabled={isLoading} className="w-full">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.saving}</> : t.save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {(worker.portfolioImages && worker.portfolioImages.length > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {worker.portfolioImages.map((image) => (
                <Dialog key={image.id}>
                    <div className="relative group aspect-square">
                        <DialogTrigger asChild>
                            <Image
                                src={image.url}
                                alt={'Portfolio image'}
                                layout="fill"
                                className="rounded-lg object-cover cursor-pointer"
                            />
                        </DialogTrigger>
                    
                    {isOwner && (
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={isDeleting === image.id}
                        >
                            {isDeleting === image.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    )}
                    </div>
                    <DialogContent className="max-w-5xl h-[90vh] p-0 border-0">
                         <DialogHeader className="sr-only">
                           <DialogTitle>Portfolio Image</DialogTitle>
                           <DialogDescription>{'Zoomable portfolio image'}</DialogDescription>
                         </DialogHeader>
                        <ZoomableImage src={image.url} alt={'Portfolio image'} />
                    </DialogContent>
                </Dialog>
            ))}
            </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">{t.noImages}</p>
      )}
    </div>
  );
}
