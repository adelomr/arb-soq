

'use client';
import Footer from "@/components/Footer";
import UserDashboard from "@/components/UserDashboard";
import { useState, useEffect } from 'react';
import Ads from '@/components/Ads';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-12 md:py-16">
        <div className="container mx-auto px-4">
            <UserDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
