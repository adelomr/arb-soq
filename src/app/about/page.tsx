'use client';

import Footer from "@/components/Footer";
import { Users, Target, Eye } from "lucide-react";
import { AdPlaceholder } from '@/components/Adsense';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    title: "من نحن",
    subtitle: "مهمتنا هي ربط المشترين والبائعين في جميع أنحاء العالم العربي.",
    ourStoryTitle: "قصتنا",
    ourStory: "تأسس سوق العرب بهدف إنشاء منصة بسيطة وموثوقة وسهلة الاستخدام للإعلانات المبوبة. لقد رأينا حاجة إلى سوق يركز على المجتمع ويكون مصممًا خصيصًا لتلبية احتياجات المستخدمين في منطقة الشرق الأوسط وشمال إفريقيا. منذ بدايتنا، نمونا لنصبح وجهة مفضلة لملايين المستخدمين لشراء وبيع السلع والخدمات.",
    ourMissionTitle: "مهمتنا",
    ourMission: "مهمتنا هي تمكين الأفراد والشركات من خلال توفير منصة تداول فعالة. نحن نسعى جاهدين لتعزيز مجتمع آمن وموثوق حيث يمكن للمستخدمين العثور على صفقات رائعة والوصول إلى جمهور واسع لإعلاناتهم.",
    ourVisionTitle: "رؤيتنا",
    ourVision: "رؤيتنا هي أن نكون المنصة الرائدة للإعلانات المبوبة في العالم العربي، معروفة بابتكارنا ونهجنا الذي يركز على المستخدم والتزامنا القوي تجاه مجتمعنا.",
};

export default function AboutPage() {
    const cards = [
        {
            icon: <Users className="h-10 w-10 text-primary" />,
            title: t.ourStoryTitle,
            description: t.ourStory,
        },
        {
            icon: <Target className="h-10 w-10 text-primary" />,
            title: t.ourMissionTitle,
            description: t.ourMission,
        },
        {
            icon: <Eye className="h-10 w-10 text-primary" />,
            title: t.ourVisionTitle,
            description: t.ourVision,
        },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background">
                <section className="bg-secondary/50 py-16 md:py-24 text-center">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">{t.title}</h1>
                        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">{t.subtitle}</p>
                    </div>
                </section>

                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {cards.map((card, index) => (
                                <div key={index} className="bg-card p-8 rounded-lg shadow-lg text-center flex flex-col items-center">
                                    <div className="mb-6">{card.icon}</div>
                                    <h2 className="text-2xl font-bold font-headline mb-4">{card.title}</h2>
                                    <p className="text-muted-foreground leading-relaxed">{card.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="pb-16 md:pb-24">
                    <div className="container mx-auto px-4">
                        <AdPlaceholder />
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
