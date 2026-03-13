'use client';

import Footer from "@/components/Footer";
import { Shield, FileText } from "lucide-react";
import { AdPlaceholder } from '@/components/Adsense';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: 24 يوليو 2024",
    introduction: "مقدمة",
    introductionText: "خصوصيتك مهمة بالنسبة لنا في سوق العرب. تشرح سياسة الخصوصية هذه كيفية جمع معلوماتك الشخصية واستخدامها ومشاركتها وحمايتها عند زيارتك لمنصتنا أو استخدام خدماتنا.",
    informationWeCollect: "المعلومات التي نجمعها",
    informationWeCollectText: "قد نقوم بجمع معلومات شخصية منك مثل اسمك وعنوان بريدك الإلكتروني ورقم هاتفك وعنوانك عند التسجيل في حساب أو نشر إعلان أو التواصل معنا. نقوم أيضًا بجمع بيانات غير شخصية مثل عنوان IP ونوع المتصفح وبيانات الاستخدام.",
    howWeUseInformation: "كيف نستخدم معلوماتك",
    howWeUseInformationText: "نحن نستخدم المعلومات التي نجمعها لتوفير خدماتنا وتحسينها، وتخصيص تجربتك، والتواصل معك، ومنع الاحتيال، والامتثال للالتزامات القانونية.",
    sharingInformation: "مشاركة معلوماتك",
    sharingInformationText: "قد نشارك معلوماتك مع مزودي الخدمة من الأطراف الثالثة الذين يساعدوننا في تشغيل منصتنا، أو مع السلطات القانونية إذا اقتضى القانون ذلك. نحن لا نبيع معلوماتك الشخصية لأطراف ثالثة.",
    yourRights: "حقوقك",
    yourRightsText: "لديك الحق في الوصول إلى معلوماتك الشخصية وتصحيحها وحذفها. يمكنك أيضًا إلغاء الاشتراك في الاتصالات التسويقية في أي وقت.",
    contactUs: "اتصل بنا",
    contactEmail: "adelomr1878@gmail.com",
};

export default function PrivacyPolicyPage() {
    const sections = [
        { title: t.introduction, text: t.introductionText },
        { title: t.informationWeCollect, text: t.informationWeCollectText },
        { title: t.howWeUseInformation, text: t.howWeUseInformationText },
        { title: t.sharingInformation, text: t.sharingInformationText },
        { title: t.yourRights, text: t.yourRightsText },
    ];
    
    const contactUsText = "إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، فيرجى الاتصال بنا على ";

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-12">
                        <Shield className="mx-auto h-16 w-16 text-primary mb-4" />
                        <h1 className="text-4xl md:text-5xl font-bold font-headline">{t.title}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">{t.lastUpdated}</p>
                    </div>

                    <div className="prose dark:prose-invert max-w-none space-y-8">
                        {sections.map((section, index) => (
                             <div key={index} className="p-6 bg-card rounded-lg shadow-sm">
                                <h2 className="text-2xl font-semibold font-headline flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-primary"/>
                                    {section.title}
                                </h2>
                                <p className="text-muted-foreground mt-4 leading-relaxed">{section.text}</p>
                            </div>
                        ))}
                         <div className="p-6 bg-card rounded-lg shadow-sm">
                            <h2 className="text-2xl font-semibold font-headline flex items-center gap-3">
                                <FileText className="h-6 w-6 text-primary"/>
                                {t.contactUs}
                            </h2>
                            <p className="text-muted-foreground mt-4 leading-relaxed">
                                {contactUsText}
                                <a href={`mailto:${t.contactEmail}`} className="text-primary font-semibold hover:underline">
                                    {t.contactEmail}
                                </a>.
                            </p>
                        </div>
                    </div>
                     <section className="pt-16">
                        <AdPlaceholder />
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
