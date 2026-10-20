'use client';

import React, { useState, useEffect } from 'react';
import { getAllBlogCategories, saveBlogCategory } from '@/lib/blog-service';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Plus, Check, Loader2, Sparkles, FolderPlus } from 'lucide-react';

interface BlogCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function BlogCategorySelect({
  value,
  onChange,
  className = '',
  disabled = false,
}: BlogCategorySelectProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingNew, setSavingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const cats = await getAllBlogCategories();
        if (active) {
          setCategories(cats);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__CREATE_NEW__') {
      setIsCreatingNew(true);
      setError(null);
    } else {
      setIsCreatingNew(false);
      onChange(selected);
    }
  };

  const handleAddNewCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setError('يرجى كتابة اسم التسمية أو القسم أولاً');
      return;
    }

    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      // Already exists, just select it
      onChange(trimmed);
      setIsCreatingNew(false);
      setNewCategoryName('');
      return;
    }

    setSavingNew(true);
    setError(null);
    try {
      await saveBlogCategory(trimmed);
      setCategories(prev => [...prev, trimmed]);
      onChange(trimmed);
      setIsCreatingNew(false);
      setNewCategoryName('');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ التسمية الجديدة');
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <div className={`space-y-2 text-right ${className}`} dir="rtl">
      <div className="flex items-center justify-between">
        <Label htmlFor="blog-category-select" className="text-foreground font-medium flex items-center gap-1.5 text-sm">
          <Tag className="w-4 h-4 text-primary" />
          <span>التسمية / القسم</span>
          <span className="text-xs text-muted-foreground font-normal">(ينتمي إليها الموضوع)</span>
        </Label>

        {!isCreatingNew && (
          <button
            type="button"
            onClick={() => {
              setIsCreatingNew(true);
              setError(null);
            }}
            disabled={disabled}
            className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إنشاء تسمية جديدة</span>
          </button>
        )}
      </div>

      {/* Main Select Box */}
      <div className="relative">
        <select
          id="blog-category-select"
          value={isCreatingNew ? '__CREATE_NEW__' : value || ''}
          onChange={handleSelectChange}
          disabled={disabled || loading}
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-right appearance-none"
        >
          <option value="">-- اختر تسمية أو قسماً للموضوع --</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
          <option value="__CREATE_NEW__" className="font-bold text-primary">
            ➕ + إضافة تسمية جديدة للموضوع...
          </option>
        </select>

        {loading && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Inline Create New Label Form */}
      {isCreatingNew && (
        <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <FolderPlus className="w-4 h-4" />
            <span>إنشاء تسمية جديدة وتطبيقها على الموضوع</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={e => {
                setNewCategoryName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewCategory();
                }
              }}
              placeholder="مثال: قسم الفلاشات، قسم ملفات القنوات..."
              className="bg-background border-border text-foreground text-sm text-right flex-1 h-9"
              autoFocus
            />

            <Button
              type="button"
              size="sm"
              onClick={handleAddNewCategory}
              disabled={savingNew || !newCategoryName.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-3.5 flex items-center gap-1.5 shrink-0"
            >
              {savingNew ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  حفظ...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  إضافة واختيار
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreatingNew(false);
                setNewCategoryName('');
                setError(null);
              }}
              className="text-xs h-9 px-3 shrink-0"
            >
              إلغاء
            </Button>
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>
      )}

      {/* Quick Select Chips */}
      {categories.length > 0 && (
        <div className="pt-1">
          <div className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary/70" />
            <span>اختيار سريع من التسميات المتاحة:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat, idx) => {
              const isSelected = value === cat && !isCreatingNew;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    onChange(cat);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
