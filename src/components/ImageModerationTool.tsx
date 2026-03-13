
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { handleImageModeration } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, ThumbsDown, ThumbsUp, X, FileUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type ModerationResult = {
  isAppropriate: boolean;
  reasons: string[];
} | null;

const translations = {
    ar: {
        noImageSelected: 'لم يتم اختيار صورة',
        selectImageToAnalyze: 'الرجاء اختيار ملف صورة لتحليله.',
        analysisFailed: 'فشل التحليل',
        analysisFailedDesc: 'فشل تحليل الصورة.',
        unknownError: 'حدث خطأ غير معروف.',
        uploadTitle: 'تحميل صورة للتحليل',
        uploadDescription: 'اختر ملف صورة من جهازك للتحقق من انتهاكات سياسة المحتوى.',
        clickToUpload: 'انقر للتحميل',
        dragAndDrop: 'أو السحب والإفلات',
        imageFormats: 'PNG, JPG, or GIF up to 10MB',
        analyzing: 'جارٍ التحليل...',
        analyzeImage: 'تحليل الصورة',
        moderationResult: 'نتيجة الإشراف',
        appropriate: 'ملائم',
        inappropriate: 'غير ملائم',
        reasons: 'الأسباب:',
    }
}

export default function ImageModerationTool() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ModerationResult>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { language, direction } = useLanguage();
  const t = translations.ar;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!imagePreview) {
      toast({
        title: t.noImageSelected,
        description: t.selectImageToAnalyze,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await handleImageModeration(imagePreview);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        throw new Error(response.error || t.analysisFailedDesc);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.unknownError;
      toast({
        title: t.analysisFailed,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearImage = () => {
    setImagePreview(null);
    setResult(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{t.uploadTitle}</CardTitle>
        <CardDescription>{t.uploadDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {imagePreview ? (
          <div className="w-full aspect-video relative rounded-lg overflow-hidden border">
            <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="contain" />
            <Button variant="destructive" size="icon" className={`absolute top-2 z-10 ${direction === 'rtl' ? 'left-2' : 'right-2'}`} onClick={clearImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full">
            <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">{t.clickToUpload}</span> {t.dragAndDrop}</p>
                    <p className="text-xs text-muted-foreground">{t.imageFormats}</p>
                </div>
                <Input id="image-upload" type="file" accept="image/png, image/jpeg, image/gif" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        )}
        
        <Button onClick={analyzeImage} disabled={!imagePreview || isLoading} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className={`h-4 w-4 animate-spin ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              {t.analyzing}
            </>
          ) : (
            t.analyzeImage
          )}
        </Button>
        
        {result && (
          <Card className={result.isAppropriate ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.isAppropriate ? <ThumbsUp className="h-6 w-6 text-green-600" /> : <ThumbsDown className="h-6 w-6 text-red-600" />}
                <span>{t.moderationResult}</span>
              </CardTitle>
              <Badge variant={result.isAppropriate ? 'default' : 'destructive'} className={result.isAppropriate ? 'bg-green-600' : 'bg-red-600'}>
                {result.isAppropriate ? t.appropriate : t.inappropriate}
              </Badge>
            </CardHeader>
            {!result.isAppropriate && (
                <CardContent>
                    <h4 className="font-semibold mb-2">{t.reasons}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {result.reasons.map((reason, index) => (
                        <li key={index} className="flex items-start">
                            <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 text-red-500 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                            <span>{reason}</span>
                        </li>
                        ))}
                    </ul>
                </CardContent>
            )}
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
