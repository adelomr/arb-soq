
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl } from '@/components/ui/form';
import { Profession } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import React from 'react';

const translations = {
  ar: {
    professionPlaceholder: "اختر مهنة",
  },
};

interface ProfessionSelectProps {
    value?: string;
    onChange: (value: string) => void;
    professions: Profession[];
}

export default function ProfessionSelect({ value, onChange, professions }: ProfessionSelectProps) {
    const t = translations.ar;

    const selectedProfession = professions.find(p => p.id === value);
    const displayValue = selectedProfession ? selectedProfession.name.ar : '';

    return (
        <Select
            dir="rtl"
            onValueChange={onChange}
            value={value || ""} 
        >
            <FormControl>
                <SelectTrigger>
                    <SelectValue placeholder={t.professionPlaceholder}>
                        {displayValue || t.professionPlaceholder}
                    </SelectValue>
                </SelectTrigger>
            </FormControl>
            <SelectContent>
                <ScrollArea className="h-60">
                    {professions.map(prof => (
                        <SelectItem key={prof.id} value={prof.id}>
                            {prof.name.ar}
                        </SelectItem>
                    ))}
                </ScrollArea>
            </SelectContent>
        </Select>
    );
}
