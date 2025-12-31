
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import { GoogleGenAI } from "@google/genai";

type ContentType = 'blog' | 'extension';
type AdminView = 'dashboard' | 'list' | 'edit' | 'auto-gen' | 'json';

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

  const realStats = useMemo(() => {
    const now = new Date();
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const pageViews = analyticsData.filter(e => e.type === 'view').length;
    const installs = analyticsData.filter(e => e.type === 'install').length;
    const liveNow = analyticsData.filter(e => (e.type === 'view' || e.type === 'click') && new Date(e.timestamp) > fiveMinsAgo).length;
    return { pageViews, installs, liveNow };
  }, [analyticsData]);

  const performFullAutoMagic = async () => {
    if (!seoKeyword) return alert("من فضلك أدخل موضوع المقال أولاً");
    
    setStatus({ loading: true, message: 'جاري تشغيل محركات الذكاء... 🚀' });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      setStatus({ loading: true, message: 'جاري صياغة المحتوى باحترافية... ✍️' });
      const textRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a high-quality, long-form Arabic blog post about "${seoKeyword}". 
        Focus on SEO and high CTR. Return JSON ONLY: { "title": "...", "content": "...", "excerpt": "...", "readTime": "...", "imgPrompt": "..." }. 
        Use <h2> for subheadings. Content must be engaging and professional.`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(textRes.text || "{}");
      
      setStatus({ loading: true, message: 'جاري تصميم الصورة الحصرية... 🎨' });
      const imgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.imgPrompt || `Professional minimalist technology illustration for ${data.title}. High definition, clean white background style.`,
      });

      let finalImg = '';
      const parts = imgRes.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            finalImg = `data:image/png;base64,${part.inlineData.data}`;
            setGeneratedImageBase64(finalImg);
          }
        }
      }

      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title || "عنوان جديد",
        content: data.content || "محتوى المقال هنا...",
        excerpt: data.excerpt || "مقتطف المقال...",
        readTime: data.readTime || "5 min read",
        category: "تكنولوجيا",
        image: '', 
        date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })
      });
      
      setStatus({ loading: false, message: '' });
      setView('edit'); 
    } catch (e) {
      console.error(e);
      setStatus({ loading: false, message: 'حدث خطأ. تأكد من إعدادات API Key والاتصال.' });
    }
  };

  const handleSave = () => {
    const idx = blogItems.findIndex(i => i.id === currentEditItem.id);
    if (idx !== -1) {
      const updated = [...blogItems];
      updated[idx] = currentEditItem;
      setBlogItems(updated);
    } else {
      setBlogItems([currentEditItem, ...blogItems]);
    }
    setView('list');
  };

  return (
    <div className="flex min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-blue-100">
      <aside className="w-80 bg-gray-950 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-10 border-b border-gray-900 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-blue-600/20">ET</div>
          <h2 className="font-black text-xl tracking-tighter">ExtensionTo</h2>
        </div>
        
        <nav className="flex-grow p-8 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>📊 نظرة عامة</button>
          <div className="h-px bg-white/5 my-6"></div>
          
          <div className="px-4 mb-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">أدوات الذكاء</p>
            <button onClick={() => setView('auto-gen')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'auto-gen' ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-400 hover:bg-purple-600/10'}`}>
               <span>🪄 التوليد السحري</span>
               <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-full uppercase">PRO</span>
            </button>
          </div>

          <div className="px-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">المحتوى</p>
            <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>📄 المقالات</button>
            <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>🧩 الإضافات</button>
          </div>

          <div className="mt-auto pt-10">
            <button onClick={() => setView('json')} className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-[10px] font-black text-gray-500 border border-white/10 hover:bg-white/5 transition-all uppercase tracking-widest">🚀 تصدير البيانات</button>
          </div>
        </nav>
      </aside>

      <main className="flex-grow ml-80 p-16 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-12 animate-in fade-in duration-500 text-right" dir="rtl">
            <header className="flex justify-between items-end bg-white p-12 rounded-[56px] border border-gray-100 apple-shadow">
              <div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4">لوحة التحكم الذكية</h1>
                <p className="text-gray-400 text-lg font-medium">مرحباً بك مجدداً. جرب ميزة التوليد التلقائي لزيادة إنتاجيتك.</p>
              </div>
              <button onClick={() => setView('auto-gen')} className="px-10 py-5 bg-purple-600 text-white font-black rounded-[28px] shadow-2xl shadow-purple-200 hover:scale-[1.05] transition-all">🪄 ابدأ مقالاً جديداً</button>
            </header>
            
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">إجمالي المشاهدات</p>
                <span className="text-5xl font-black text-gray-900">{realStats.pageViews}</span>
              </div>
              <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">التحميلات</p>
                <span className="text-5xl font-black text-blue-600">{realStats.installs}</span>
              </div>
              <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">نشط الآن</p>
                <span className="text-5xl font-black text-red-500 animate-pulse">{realStats.liveNow}</span>
              </div>
            </div>

            <div className="p-12 bg-purple-50 rounded-[56px] border border-purple-100 flex items-center justify-between">
               <div className="space-y-4">
                  <h3 className="text-3xl font-black text-purple-900">هل تفتقر للأفكار؟</h3>
                  <p className="text-purple-700 font-medium">دع Gemini يكتب لك مقالاً احترافياً ويصمم صورة مميزة في أقل من 30 ثانية.</p>
               </div>
               <button onClick={() => setView('auto-gen')} className="px-10 py-5 bg-white text-purple-600 font-black rounded-3xl shadow-xl hover:bg-purple-100 transition-colors">استخدم المساعد الذكي</button>
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700 text-right" dir="rtl">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-[38px] flex items-center justify-center text-5xl mx-auto shadow-inner">🪄</div>
              <h1 className="text-6xl font-black text-gray-900 tracking-tighter">التوليد السحري</h1>
              <p className="text-gray-500 font-medium text-xl">أدخل الموضوع فقط، والباقي علينا.</p>
            </div>

            <div className="bg-white p-14 rounded-[64px] border border-gray-50 shadow-2xl shadow-purple-100/50 space-y-10">
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest pr-4">موضوع المقال أو الكلمة المفتاحية</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="مثال: دليلك الشامل لمتصفح Brave في 2024" 
                    className="flex-grow px-10 py-8 bg-gray-50 border border-gray-100 rounded-[32px] text-2xl font-bold outline-none focus:bg-white focus:ring-[12px] focus:ring-purple-50 transition-all placeholder:text-gray-300"
                    value={seoKeyword} 
                    onChange={e => setSeoKeyword(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && performFullAutoMagic()}
                  />
                  <button 
                    onClick={performFullAutoMagic} 
                    disabled={status.loading}
                    className="px-14 py-8 bg-purple-600 text-white font-black rounded-[32px] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:bg-gray-200"
                  >
                    {status.loading ? 'جاري العمل...' : 'أطلق السحر!'}
                  </button>
                </div>
              </div>

              {status.loading && (
                <div className="flex flex-col items-center gap-6 py-10 animate-in fade-in">
                  <div className="w-16 h-16 border-[6px] border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-2xl text-purple-600 animate-pulse">{status.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="max-w-6xl animate-in fade-in duration-500 text-right" dir="rtl">
            <header className="flex justify-between items-center mb-16">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">{activeTab === 'blog' ? 'أرشيف المقالات' : 'إدارة الإضافات'}</h1>
              <div className="flex gap-4">
                <button onClick={() => setView('auto-gen')} className="bg-purple-600 text-white px-8 py-5 rounded-[24px] font-black text-sm shadow-xl hover:bg-purple-700 transition-all">🪄 توليد ذكي</button>
                <button onClick={() => {
                  const id = `${activeTab === 'blog' ? 'post' : 'ext'}-${Date.now()}`;
                  setCurrentEditItem(activeTab === 'blog' ? { id, title: '', content: '', category: 'تكنولوجيا', excerpt: '', date: 'اليوم', readTime: '5 min', image: '' } : { id, name: '', shortDescription: '', category: 'Utility', rating: 5, users: '0', icon: '✨', features: [], version: '1.0', lastUpdated: 'الآن', size: '1MB', storeUrl: '' });
                  setView('edit');
                }} className="bg-gray-900 text-white px-8 py-5 rounded-[24px] font-black text-sm shadow-xl hover:bg-black transition-all">+ إضافة يدوية</button>
              </div>
            </header>

            <div className="bg-white rounded-[48px] border border-gray-50 shadow-sm overflow-hidden apple-shadow">
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  {(activeTab === 'blog' ? blogItems : extensionItems).map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-12 py-10 flex items-center gap-8">
                        <div className="w-20 h-20 bg-gray-100 rounded-[28px] flex items-center justify-center text-4xl shrink-0 overflow-hidden shadow-inner border border-gray-200/50">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.icon || '📄'}
                        </div>
                        <div>
                          <span className="font-black text-2xl text-gray-900 block mb-2">{item.title || item.name}</span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.category} • {item.date || item.lastUpdated}</span>
                        </div>
                      </td>
                      <td className="px-12 py-10 text-left">
                        <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="px-6 py-3 bg-gray-50 text-gray-900 font-black text-xs rounded-xl hover:bg-gray-100 transition-colors">تعديل</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 text-right" dir="rtl">
            <header className="flex justify-between items-center mb-12">
               <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2">المحرر والناشر</h1>
                  <p className="text-gray-400 font-medium text-lg">راجع محتواك، ارفع الصورة لبلوجر، ثم انشر.</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setView('list')} className="px-8 py-5 bg-white border border-gray-200 font-black text-sm rounded-2xl hover:bg-gray-50">إلغاء</button>
                  <button onClick={handleSave} className="px-12 py-5 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-2xl shadow-blue-100 hover:bg-blue-700">حفظ ونشر المحتوى</button>
               </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-3 space-y-10">
                <div className="bg-white p-14 rounded-[64px] border border-gray-50 shadow-sm apple-shadow space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-4">العنوان</label>
                    <input className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[32px] font-black text-4xl outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-4">المحتوى</label>
                    <textarea className="w-full p-12 bg-gray-50 border border-gray-100 rounded-[48px] h-[800px] font-mono text-sm leading-relaxed outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8">
                 <div className="bg-white p-10 rounded-[48px] border-2 border-purple-100 shadow-2xl shadow-purple-50 space-y-8">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
                       <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest">الصورة المصممة</h3>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="aspect-square bg-gray-100 rounded-[40px] border-2 border-dashed border-purple-200 flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
                        {currentEditItem.image ? (
                          <img src={currentEditItem.image} className="w-full h-full object-cover" />
                        ) : generatedImageBase64 ? (
                          <div className="text-center p-6 space-y-6">
                            <img src={generatedImageBase64} className="w-full h-44 object-cover rounded-3xl shadow-2xl" />
                            <a href={generatedImageBase64} download="post-image.png" className="inline-block px-6 py-3 bg-purple-600 text-white text-[11px] font-black rounded-full hover:bg-purple-700 shadow-lg">تحميل الصورة</a>
                          </div>
                        ) : (
                          <span className="text-7xl grayscale opacity-10">🖼️</span>
                        )}
                      </div>
                      
                      <div className="p-8 bg-purple-50 rounded-[32px] space-y-4 border border-purple-100">
                        <p className="text-[11px] font-bold text-purple-900 leading-relaxed text-center">ارفع الصورة لبلوجر والصق الرابط هنا:</p>
                        <input 
                          className="w-full p-4 bg-white border border-purple-200 rounded-2xl font-mono text-[10px] text-blue-600 placeholder:text-gray-300 text-center" 
                          placeholder="رابط الصورة من بلوجر..." 
                          value={currentEditItem.image} 
                          onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} 
                        />
                      </div>
                    </div>
                 </div>

                 <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">الإعدادات</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 block mb-2 mr-2">التصنيف</label>
                        <input className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 block mb-2 mr-2">وقت القراءة</label>
                        <input className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" value={currentEditItem.readTime} onChange={e => setCurrentEditItem({...currentEditItem, readTime: e.target.value})} />
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
