
'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Wrench, Handshake, List } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const t = {
    searchPlaceholder: "ابحث عن خدمة...",
    all: "الكل",
    offers: "خدمات معروضة",
    requests: "خدمات مطلوبة",
};

type ServiceSearchProps = {
    onSearch: (query: string) => void;
    onFilterChange: (filter: 'all' | 'sell-service' | 'request-service') => void;
    currentFilter: 'all' | 'sell-service' | 'request-service';
}

export default function ServiceSearch({ onSearch, onFilterChange, currentFilter }: ServiceSearchProps) {
    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={t.searchPlaceholder}
                    className="h-12 text-base pr-12 rounded-full"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
            <Tabs defaultValue="all" value={currentFilter} onValueChange={(value) => onFilterChange(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="gap-2">
                        <List className="h-4 w-4" />{t.all}
                    </TabsTrigger>
                    <TabsTrigger value="sell-service" className="gap-2">
                        <Wrench className="h-4 w-4" />{t.offers}
                    </TabsTrigger>
                    <TabsTrigger value="request-service" className="gap-2">
                        <Handshake className="h-4 w-4" />{t.requests}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    )
}
