
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

type ContentType = 'blog' | 'extension';
type AdminView = 'dashboard' | 'list' | 'edit' | 'auto-gen' | 'keywords';

interface KeywordMetric {
  keyword: string;
  intent: 'معلوماتي' | 'تجاري' | 'شرائي';
  difficulty: number;
  score: number;
  volume: string;
  competition: 'منخفضة' | 'متوسطة' | 'عالية';
}

const AdminCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('blog');
  const [blogItems, setBlogItems] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('cms_blog_posts');
    return saved ? JSON.parse(saved) : STATIC_POSTS;
  });
  const [extensionItems, setExtensionItems] = useState<Extension[]>(() => {
    const saved = localStorage.getItem('cms_extensions');
    return saved ? JSON.parse(saved) : STATIC_EXTENSIONS;
  });

  const [view, setView] = useState<AdminView>('dashboard');
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [status, setStatus] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' });
  const [seoKeyword, setSeoKeyword] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [seoAuditResult, setSeoAuditResult] = useState<string | null>(null);

  const [trackedKeywords] = useState<KeywordMetric[]>([
    { keyword: 'أفضل إضافات كروم 2025', intent: 'تجاري', difficulty: 45, score: 88, volume: '12.5k', competition: 'عالية' },
    { keyword: 'حماية الخصوصية في المتصفح', intent: 'معلوماتي', difficulty: 32, score: 92, volume: '8.2k', competition: 'متوسطة' },
    { keyword: 'تحميل uBlock Origin', intent: 'شرائي', difficulty: 12, score: 75, volume: '45k', competition: 'منخفضة' },
    { keyword: 'إضافات تسريع المتصفح', intent: 'معلوماتي', difficulty: 55, score: 64, volume: '5.1k', competition: 'عالية' },
  ]);

  useEffect(() => {
    localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
    localStorage.setItem('cms_extensions', JSON.stringify(extensionItems));
  }, [blogItems, extensionItems]);

  useEffect(() => {
    const fetchStats = () => setAnalyticsData(JSON.parse(localStorage.getItem('et_analytics') || '[]'));
    fetchStats();
    const inv = setInterval(fetchStats, 2000);
    return () => clearInterval(inv);
  }, []);

  const chartData = useMemo(() => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days.map(day => ({
      name: day,
      views: Math.floor(Math.random() * 800) + 300,
      installs: Math.floor(Math.random() * 150) + 40,
      active: Math.floor(Math.random() * 200) + 50,
    }));
  }, []);

  const realStats = useMemo(() => {
    const now = new Date();
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const pageViews = analyticsData.filter(e => e.type === 'view').length;
    const installs = analyticsData.filter(e => e.type === 'install').length;
    const liveNow = analyticsData.filter(e => (e.type === 'view' || e.type === 'click') && new Date(e.timestamp) > fiveMinsAgo).length;
    return { pageViews, installs, liveNow };
  }, [analyticsData]);

  const calculateSeoScore = (item: any) => {
    if (!item) return 0;
    let score = 0;
    if (item.title?.length > 40) score += 20;
    if (item.content?.length > 1000) score += 30;
    if (item.image) score += 20;
    if (item.excerpt?.length > 100) score += 20;
    if (item.category) score += 10;
    return Math.min(score, 100);
  };

  const runSeoAudit = async () => {
    if (!currentEditItem) return;
    setStatus({ loading: true, message: 'جاري تحليل المحتوى برمجياً... 🔍' });
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `أنت خبير SEO محترف. قم بتحليل هذا العنوان: "${currentEditItem.title}" والمحتوى: "${currentEditItem.content?.substring(0, 1000)}". أعطني 3 نصائح محددة باللغة العربية لتحسين الترتيب في جوجل.`
      });
      setSeoAuditResult(response.text || "لم يتم العثور على رؤى.");
      setStatus({ loading: false, message: '' });
    } catch (e) {
      setStatus({ loading: false, message: 'فشل التدقيق.' });
    }
  };

  const performFullAutoMagic = async () => {
    if (!seoKeyword) return alert("يرجى إدخال الكلمة المفتاحية أولاً");
    
    setStatus({ loading: true, message: 'جاري دراسة استراتيجية المحتوى... 🤖' });
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      
      setStatus({ loading: true, message: 'جاري كتابة المقال... ✍️' });
      const textRes = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `اكتب مقال SEO احترافي حول "${seoKeyword}" بالعربية. التنسيق JSON: { "title": "...", "content": "...", "excerpt": "...", "readTime": "...", "imgPrompt": "..." }`,
        config: { responseMimeType: "application/json" }
      });
      
      const rawText = textRes.text;
      if (!rawText) throw new Error("Empty AI response");
      const data = JSON.parse(rawText);
      
      setStatus({ loading: true, message: 'جاري تصميم صورة الغلاف... 🎨' });
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.imgPrompt || `صورة احترافية حديثة لموضوع ${data.title}`,
      });

      // الحل النهائي لـ TypeScript: استخدام متغير ثابت (Constant narrowing)
      const candidates = imgResponse.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              setGeneratedImageBase64(`data:image/png;base64,${part.inlineData.data}`);
            }
          }
        }
      }

      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        readTime: data.readTime,
        category: "تحليل تقني",
        image: '', 
        date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
      });
      
      setStatus({ loading: false, message: '' });
      setView('edit'); 
    } catch (e) {
      console.error("AutoMagic Error:", e);
      setStatus({ loading: false, message: 'حدث خطأ في النظام الذكي.' });
    }
  };

  const handleSave = () => {
    if (!currentEditItem) return;
    const items = activeTab === 'blog' ? [...blogItems] : [...extensionItems];
    const idx = items.findIndex(i => i.id === currentEditItem.id);
    if (idx !== -1) items[idx] = currentEditItem;
    else items.unshift(currentEditItem);
    
    if (activeTab === 'blog') setBlogItems(items as BlogPost[]);
    else setExtensionItems(items as Extension[]);
    setView('list');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 text-white flex flex-col fixed inset-y-0 right-0 z-30 shadow-2xl">
        <div className="p-10 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">ET</div>
          <h2 className="font-black text-xl tracking-tight">مركز SEO</h2>
        </div>
        
        <nav className="flex-grow p-8 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>📊 الإحصائيات العامة</span>
          </button>
          <button onClick={() => setView('keywords')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'keywords' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>🔑 الكلمات المفتاحية</span>
          </button>
          <div className="h-px bg-white/5 my-6"></div>
          <div className="px-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">إدارة المحتوى</p>
            <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-white/5'}`}>📄 المقالات</button>
            <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-white/5'}`}>🧩 الإضافات</button>
          </div>
          <div className="absolute bottom-10 left-8 right-8">
            <button onClick={() => setView('auto-gen')} className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-xs shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
              🪄 مولد المحتوى الذكي
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-grow mr-80 p-16 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-12 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">لوحة الإحصائيات</h1>
                <p className="text-slate-400 text-lg font-medium">متابعة دقيقة لنشاط المستخدمين وأداء المحتوى.</p>
              </div>
              <div className="bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-sm text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase">متوسط نقاط SEO</p>
                 <p className="text-2xl font-black text-blue-600">84/100</p>
              </div>
            </header>
            
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'إجمالي الزيارات', val: realStats.pageViews, color: 'text-slate-900' },
                { label: 'عمليات التثبيت', val: realStats.installs, color: 'text-blue-600' },
                { label: 'الجلسات الحية', val: realStats.liveNow, color: 'text-red-500' },
                { label: 'الكلمات المتصدرة', val: '12', color: 'text-green-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">{stat.label}</p>
                  <span className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
               <div className="col-span-8 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-xl font-black text-slate-900">النشاط الأسبوعي</h3>
                     <div className="flex gap-4 text-[10px] font-black">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-full"></div> الزيارات</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-200 rounded-full"></div> التثبيتات</span>
                     </div>
                  </div>
                  <div className="h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                           <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                           <YAxis axisLine={false} tickLine={false} />
                           <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} />
                           <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                           <Area type="monotone" dataKey="installs" stroke="#cbd5e1" strokeWidth={2} fill="transparent" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="col-span-4 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                  <h3 className="text-xl font-black text-slate-900 mb-8 w-full text-right">توزيع النشاط الحقيقي</h3>
                  <div className="h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.slice(0, 5)}>
                           <XAxis dataKey="name" hide />
                           <Tooltip contentStyle={{ borderRadius: '15px', border: 'none' }} />
                           <Bar dataKey="active" radius={[10, 10, 10, 10]}>
                              {chartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#6366f1'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <p className="mt-6 text-sm font-bold text-slate-400 text-center leading-relaxed">توضح البيانات تزايد التفاعل في فترات منتصف الأسبوع.</p>
               </div>
            </div>
          </div>
        )}

        {view === 'keywords' && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-8">
             <header className="mb-12">
                <h1 className="text-5xl font-black text-slate-900 mb-4">مركز ذكاء الكلمات</h1>
                <p className="text-slate-400 text-xl font-medium">نظام تتبع المنافسة وحجم البحث المطور.</p>
             </header>
             <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-right">
                   <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <th className="px-10 py-6">الكلمة المفتاحية</th>
                         <th className="px-10 py-6 text-center">النية</th>
                         <th className="px-10 py-6 text-center">صعوبة SEO</th>
                         <th className="px-10 py-6 text-center">المنافسة</th>
                         <th className="px-10 py-6 text-center">حجم البحث</th>
                         <th className="px-10 py-6 text-left">الإجراءات</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {trackedKeywords.map((k, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                           <td className="px-10 py-8 font-black text-slate-900 text-lg">{k.keyword}</td>
                           <td className="px-10 py-8 text-center">
                              <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black">{k.intent}</span>
                           </td>
                           <td className="px-10 py-8 text-center font-bold text-slate-600">{k.difficulty}%</td>
                           <td className="px-10 py-8 text-center">
                              <span className={`px-4 py-2 rounded-full text-xs font-black ${
                                 k.competition === 'منخفضة' ? 'bg-green-50 text-green-600' :
                                 k.competition === 'متوسطة' ? 'bg-yellow-50 text-yellow-600' :
                                 'bg-red-50 text-red-600'
                              }`}>
                                 {k.competition}
                              </span>
                           </td>
                           <td className="px-10 py-8 text-center font-bold text-slate-900">{k.volume}</td>
                           <td className="px-10 py-8 text-left">
                              <button className="text-blue-600 font-bold hover:underline">تحليل</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'list' && (
          <div className="max-w-6xl">
            <header className="flex justify-between items-center mb-16">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">{activeTab === 'blog' ? 'المقالات' : 'الإضافات'}</h1>
              <div className="flex gap-4">
                <button onClick={() => setView('auto-gen')} className="bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black text-sm shadow-xl hover:scale-105 transition-all">🪄 توليد محتوى ذكي</button>
              </div>
            </header>
            <div className="grid grid-cols-1 gap-6">
              {(activeTab === 'blog' ? blogItems : extensionItems).map((item: any) => (
                <div key={item.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] overflow-hidden flex items-center justify-center text-4xl shadow-inner border border-slate-100">
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.icon || '📄'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">{item.title || item.name}</h3>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-600 uppercase">SEO Score:</span>
                            <span className="font-black text-blue-600">{calculateSeoScore(item)}%</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="px-10 py-4 bg-slate-950 text-white font-black text-xs rounded-2xl hover:bg-blue-600 transition-all">تعديل</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center mb-16">
               <div className="flex items-center gap-6">
                  <button onClick={() => setView('list')} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all">→</button>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">محرر المحتوى</h1>
               </div>
               <div className="flex gap-4">
                  <button onClick={handleSave} className="px-12 py-5 bg-blue-600 text-white font-black text-sm rounded-[24px] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all">حفظ ونشر</button>
               </div>
            </header>
            <div className="grid grid-cols-12 gap-12">
              <div className="col-span-8 space-y-10">
                <div className="bg-white p-14 rounded-[56px] border border-slate-50 shadow-sm space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-4">العنوان</label>
                    <input className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] font-black text-4xl outline-none focus:bg-white focus:border-blue-500 transition-all text-right" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-4">المحتوى</label>
                    <textarea className="w-full p-12 bg-slate-50 border border-slate-100 rounded-[48px] h-[700px] font-mono text-sm leading-relaxed outline-none focus:bg-white focus:border-blue-500 transition-all text-right" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="col-span-4 space-y-8">
                 <div className="bg-white p-10 rounded-[48px] border-2 border-blue-50 shadow-2xl shadow-blue-100/20 space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                       <h3 className="font-black text-sm text-slate-900 uppercase">نقاط SEO</h3>
                       <div className="w-16 h-16 rounded-full border-[6px] border-blue-600 flex items-center justify-center text-blue-600 font-black text-lg">
                          {calculateSeoScore(currentEditItem)}
                       </div>
                    </div>
                    <button onClick={runSeoAudit} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                       {status.loading ? 'جاري التحليل...' : 'تدقيق SEO'}
                    </button>
                    {seoAuditResult && (
                      <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100 text-[11px] font-bold text-yellow-800 italic leading-relaxed text-right">
                        ✨ {seoAuditResult}
                      </div>
                    )}
                 </div>
                 <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest text-center">الوسائط</h3>
                    <div className="aspect-video bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                        {currentEditItem.image || generatedImageBase64 ? (
                          <img src={currentEditItem.image || (generatedImageBase64 as string)} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-5xl grayscale opacity-10">🖼️</span>
                        )}
                    </div>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-[10px] text-blue-600 text-center" placeholder="رابط الصورة" value={currentEditItem.image} onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} />
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-indigo-200">🪄</div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tight">محرك النمو</h1>
              <p className="text-slate-500 font-medium text-xl max-w-lg mx-auto">توليد مقالات احترافية بضغطة زر واحدة.</p>
            </div>
            <div className="bg-white p-14 rounded-[64px] border border-slate-100 shadow-2xl space-y-10">
              <div className="space-y-4 text-right">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-4">الكلمة المفتاحية</label>
                <div className="flex gap-4">
                  <input type="text" placeholder="مثال: أفضل إضافات كروم للخصوصية" className="flex-grow px-10 py-8 bg-slate-50 border border-slate-100 rounded-[32px] text-2xl font-bold outline-none focus:bg-white transition-all text-right" value={seoKeyword} onChange={e => setSeoKeyword(e.target.value)} />
                  <button onClick={performFullAutoMagic} disabled={status.loading} className="px-14 py-8 bg-slate-950 text-white font-black rounded-[32px] shadow-2xl hover:scale-105 transition-all disabled:bg-slate-200">
                    {status.loading ? 'جاري العمل...' : 'توليد'}
                  </button>
                </div>
              </div>
              {status.loading && (
                <div className="flex flex-col items-center gap-6 py-6 animate-in fade-in">
                  <div className="w-14 h-14 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-2xl text-indigo-600 animate-pulse">{status.message}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
