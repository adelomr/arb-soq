'use client';

import { useState, useEffect } from 'react';
import { 
  getNewsletterSubscribers, 
  unsubscribeFromNewsletter, 
  getEmailSettings, 
  saveEmailSettings, 
  Subscriber, 
  EmailSettings 
} from '@/lib/newsletter-service';
import { 
  Mail, 
  Users, 
  Settings, 
  Trash2, 
  Send, 
  Download, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Play,
  RotateCcw,
  TestTube,
  Info
} from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function NewsletterManager() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'send' | 'settings'>('subscribers');
  
  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState<EmailSettings>({
    serviceId: '',
    templateId: '',
    newsletterTemplateId: '',
    publicKey: '',
    adminEmail: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [testingSettings, setTestingSettings] = useState(false);

  // Newsletter Composer state
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [recipientMode, setRecipientMode] = useState<'all' | 'test'>('all');
  const [testEmail, setTestEmail] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    failed: 0
  });
  const [sendLogs, setSendLogs] = useState<string[]>([]);
  const [sendError, setSendError] = useState('');

  // Initial loads
  useEffect(() => {
    loadSubscribersData();
    loadSettingsData();
  }, []);

  const loadSubscribersData = async () => {
    setLoadingSubscribers(true);
    const data = await getNewsletterSubscribers();
    setSubscribers(data);
    setLoadingSubscribers(false);
  };

  const loadSettingsData = async () => {
    const data = await getEmailSettings();
    if (data) {
      setSettings({
        ...data,
        newsletterTemplateId: data.newsletterTemplateId ?? '',
      });
      if (data.adminEmail) {
        setTestEmail(data.adminEmail);
      }
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء اشتراك البريد: ${email}؟`)) return;
    
    try {
      await unsubscribeFromNewsletter(email);
      setSubscribers(prev => prev.filter(s => s.email !== email));
    } catch (error) {
      alert('حدث خطأ أثناء إلغاء الاشتراك.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsStatus('idle');
    try {
      await saveEmailSettings(settings);
      setSettingsStatus('success');
      setSettingsMessage('تم حفظ إعدادات البريد الإلكتروني بنجاح.');
    } catch (error) {
      setSettingsStatus('error');
      setSettingsMessage('فشل حفظ الإعدادات، يرجى التحقق من الصلاحيات.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    
    // CSV headers
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Arabic compatibility
    csvContent += 'البريد الإلكتروني,الاسم الكامل,معرف العضو,تاريخ الاشتراك\n';
    
    subscribers.forEach(sub => {
      const dateStr = sub.subscribedAt?.seconds 
        ? new Date(sub.subscribedAt.seconds * 1000).toLocaleString('ar-EG') 
        : '';
      const name = sub.displayName || 'زائر غير مسجل';
      const uid = sub.userId || 'بلا حساب';
      csvContent += `"${sub.email}","${name}","${uid}","${dateStr}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subscribers_list_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send Newsletter
  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Resolve credentials with env fallbacks
    const serviceId = settings.serviceId?.trim() || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const publicKey = settings.publicKey?.trim() || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    const activeTemplateId = settings.newsletterTemplateId?.trim() || settings.templateId?.trim() || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !publicKey || !activeTemplateId) {
      setSendError('⚠️ إعدادات EmailJS غير مكتملة. يرجى التحقق من متغيرات البيئة (environment variables).');
      return;
    }

    if (recipientMode === 'test' && !testEmail.trim()) {
      setSendError('يرجى كتابة البريد الإلكتروني التجريبي.');
      return;
    }

    const recipients = recipientMode === 'test' 
      ? [{ email: testEmail.trim(), displayName: 'مستلم تجريبي' } as Subscriber]
      : subscribers;

    if (recipients.length === 0) {
      setSendError('لا يوجد مشتركين لإرسال النشرة البريدية إليهم.');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من بدء إرسال النشرة البريدية لـ ${recipients.length} مستلم؟`)) return;

    setSendingNewsletter(true);
    setSendError('');
    setSendLogs([]);
    setSendingProgress({
      current: 0,
      total: recipients.length,
      success: 0,
      failed: 0
    });

    const isCustomTemplate = activeTemplateId !== process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    setSendLogs([`🚀 بدء الإرسال - معرف القالب: ${activeTemplateId} (${isCustomTemplate ? 'قالب مخصص' : 'قالب الافتراضي للموقع'})`]);

    // Send emails sequentially to avoid spam filters and rate limit errors
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const name = recipient.displayName || 'مشترك سوق العرب';
      
      const logPrefix = `[${i + 1}/${recipients.length}] ${recipient.email} : `;
      
      try {
        const templateParams = {
          to_email: recipient.email,
          to_name: name,
          subject: subject,
          message: messageContent,
          site_title: 'سوق العرب',
          // fallback variables matching contact form
          name: name,
          email: recipient.email,
        };

        // Initialize and send with EmailJS in browser
        await emailjs.send(
          serviceId,
          activeTemplateId,
          templateParams,
          publicKey
        );

        setSendingProgress(prev => ({
          ...prev,
          current: i + 1,
          success: prev.success + 1
        }));
        setSendLogs(prev => [...prev, `${logPrefix}تم الإرسال بنجاح ✅`]);

      } catch (err: any) {
        const errMsg = err?.text || err?.message || JSON.stringify(err) || 'خطأ غير معروف';
        console.error('EmailJS send error:', err);
        setSendingProgress(prev => ({
          ...prev,
          current: i + 1,
          failed: prev.failed + 1
        }));
        setSendLogs(prev => [...prev, `${logPrefix}فشل الإرسال ❌ — ${errMsg}`]);
      }

      // Small delay between sends (e.g. 300ms) to ensure smooth browser loops
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setSendingNewsletter(false);
  };

  // Filtered subscribers list
  const filteredSubscribers = subscribers.filter(s => 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.displayName && s.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">إدارة القائمة البريدية</h2>
            <p className="text-xs text-muted-foreground">أرسل تحديثات دورية ونشرات بريدية للمشتركين</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border bg-muted/30">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'subscribers' 
              ? 'border-primary text-primary bg-background' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          المشتركون ({subscribers.length})
        </button>
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'send' 
              ? 'border-primary text-primary bg-background' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Send className="w-4 h-4" />
          إرسال نشرة بريدية
        </button>
      </div>

      {/* Content Panels */}
      <div className="p-6">
        
        {/* Tab 1: Subscribers list */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              {/* Search */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* CSV Export */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportCSV}
                  disabled={subscribers.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border px-4 py-2.5 rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  تصدير القائمة (CSV)
                </button>
                <button
                  onClick={loadSubscribersData}
                  className="p-2.5 rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors"
                  title="تحديث البيانات"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subscribers Table */}
            {loadingSubscribers ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <h4 className="text-sm font-bold text-muted-foreground">لا يوجد مشتركين مطابِقين</h4>
                <p className="text-xs text-muted-foreground mt-1">تأكد من كتابة البريد بشكل صحيح أو انتظر تسجيلات جديدة.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-2xl">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-xs font-bold text-muted-foreground">
                      <th className="p-4">الاسم / المشترك</th>
                      <th className="p-4">البريد الإلكتروني</th>
                      <th className="p-4">حالة الحساب</th>
                      <th className="p-4">تاريخ الاشتراك</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredSubscribers.map((sub, idx) => {
                      const signupDate = sub.subscribedAt?.seconds 
                        ? new Date(sub.subscribedAt.seconds * 1000).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'حديثاً';

                      return (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            {sub.avatarUrl ? (
                              <img 
                                src={sub.avatarUrl} 
                                alt={sub.displayName || ''} 
                                className="w-8 h-8 rounded-full object-cover border border-border" 
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {sub.displayName ? sub.displayName.charAt(0).toUpperCase() : sub.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-foreground">
                              {sub.displayName || 'زائر غير مسجل'}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground font-medium">{sub.email}</td>
                          <td className="p-4">
                            {sub.userId ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30">
                                عضو مسجل
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                                زائر
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground text-xs">{signupDate}</td>
                          <td className="p-4 text-left">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.email)}
                              className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                              title="حذف المشترك"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Send Newsletter */}
        {activeTab === 'send' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {sendError && (
              <div className="p-4 rounded-2xl bg-destructive/5 text-destructive border border-destructive/10 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{sendError}</span>
              </div>
            )}

            <form onSubmit={handleSendNewsletter} className="space-y-4">
              {/* Recipient Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-foreground">المستلمون</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="recipients"
                      checked={recipientMode === 'all'}
                      onChange={() => setRecipientMode('all')}
                      disabled={sendingNewsletter}
                      className="text-primary focus:ring-primary/20"
                    />
                    جميع المشتركين في الموقع ({subscribers.length})
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="recipients"
                      checked={recipientMode === 'test'}
                      onChange={() => setRecipientMode('test')}
                      disabled={sendingNewsletter}
                      className="text-primary focus:ring-primary/20"
                    />
                    بريد إلكتروني تجريبي (للاختبار)
                  </label>
                </div>
              </div>

              {/* Test Email Input */}
              {recipientMode === 'test' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-muted-foreground">البريد الإلكتروني للتجربة</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="example@domain.com"
                    disabled={sendingNewsletter}
                    className="w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    required
                  />
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">عنوان الرسالة (Subject)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: نشرة أخبار سوق العرب - تحديثات شهر يونيو 📢"
                  disabled={sendingNewsletter}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold"
                  required
                />
              </div>

              {/* Message Content */}
              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">محتوى الرسالة (HTML/نص عادي)</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="اكتب محتوى النشرة البريدية أو نص الإعلان هنا بالتفصيل..."
                  disabled={sendingNewsletter}
                  rows={10}
                  className="w-full p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed"
                  required
                />
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                disabled={sendingNewsletter}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {sendingNewsletter ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الإرسال حالياً...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    إرسال النشرة البريدية
                  </>
                )}
              </button>
            </form>

            {/* Sending progress status */}
            {(sendingNewsletter || sendLogs.length > 0) && (
              <div className="border border-border rounded-2xl p-4 bg-muted/10 space-y-4">
                <h4 className="font-bold text-sm text-foreground flex items-center justify-between">
                  <span>حالة عملية الإرسال</span>
                  <span className="text-xs text-muted-foreground">
                    {sendingProgress.current} من أصل {sendingProgress.total}
                  </span>
                </h4>

                {/* Progress bar */}
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(sendingProgress.current / sendingProgress.total) * 100}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs font-bold">
                  <span className="text-green-600">نجاح: {sendingProgress.success}</span>
                  <span className="text-red-500">فشل: {sendingProgress.failed}</span>
                </div>

                {/* Real-time sending logs */}
                <div className="border border-border/80 rounded-xl p-3 bg-slate-950 text-slate-300 font-mono text-3xs h-40 overflow-y-auto space-y-1">
                  {sendLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                  {sendingNewsletter && <div className="animate-pulse">جاري إرسال البريد التالي...</div>}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

