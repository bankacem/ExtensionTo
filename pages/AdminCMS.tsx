
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

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

  // وظيفة التوليد الآلي الشامل
  const performFullAutoMagic = async () => {
    if (!seoKeyword) return alert("أدخل موضوع المقال أولاً");
    
    setStatus({ loading: true, message: 'جاري تشغيل محركات الذكاء... 🚀' });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      // 1. توليد النص
      setStatus({ loading: true, message: 'جاري صياغة المحتوى باحترافية... ✍️' });
      const textRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a high-quality, long-form Arabic blog post about "${seoKeyword}". 
        Focus on SEO. Return JSON ONLY: { "title": "...", "content": "...", "excerpt": "...", "readTime": "...", "imgPrompt": "..." }. 
        Use <h2> for subheadings. Content must be engaging.`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(textRes.text || "{}");
      
      // 2. توليد الصورة
      setStatus({ loading: true, message: 'جاري تصميم الصورة الحصرية... 🎨' });
      const imgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.imgPrompt || `Professional technology illustration for ${data.title}. Style: Apple Minimalist.`,
      });

      let finalImg = '';
      for (const part of imgRes.candidates[0].content.parts) {
        if (part.inlineData) {
          finalImg = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImageBase64(finalImg);
        }
      }

      // تجهيز المقال للتعديل النهائي
      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        readTime: data.readTime,
        category: "ذكاء اصطناعي",
        image: '', 
        date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })
      });
      
      setStatus({ loading: false, message: '' });
      setView('edit'); // الانتقال فوراً للمحرر بعد التوليد
    } catch (e) {
      console.error(e);
      setStatus({ loading: false, message: 'حدث خطأ. تأكد من إعدادات API.' });
    }
  };

  const handleSave = () => {
    const idx = blogItems.findIndex(i => i.id === currentEditItem.id);
    idx !== -1 ? (blogItems[idx] = currentEditItem) : blogItems.unshift(currentEditItem);
    setBlogItems([...blogItems]);
    setView('list');
  };

  return (
    <div className="flex min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-blue-100">
      {/* Sidebar Sidebar */}
      <aside className="w-80 bg-gray-950 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-10 border-b border-gray-900 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-blue-600/20">ET</div>
          <h2 className="font-black text-xl tracking-tighter">ExtensionTo</h2>
        </div>
        
        <nav className="flex-grow p-8 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600' : 'text-gray-400 hover:bg-white/5'}`}>📊 نظرة عامة</button>
          <div className="h-px bg-white/5 my-6"></div>
          <button onClick={() => setView('auto-gen')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'auto-gen' ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-400 hover:bg-purple-600/10'}`}>
             <span>🪄 صناعة مقال بالذكاء</span>
             <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-full uppercase">New</span>
          </button>
          <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-600' : 'text-gray-400 hover:bg-white/5'}`}>📄 المقالات</button>
          <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-600' : 'text-gray-400 hover:bg-white/5'}`}>🧩 الإضافات</button>
          <div className="pt-20">
            <button onClick={() => setView('json')} className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-[10px] font-black text-gray-500 border border-white/10 hover:bg-white/5 transition-all uppercase tracking-widest">🚀 JSON Export</button>
          </div>
        </nav>
      </aside>

      {/* Main Main */}
      <main className="flex-grow ml-80 p-16 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-5xl space-y-12 animate-in fade-in duration-500 text-right" dir="rtl">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-3">أهلاً بك في الإدارة السريعة</h1>
                <p className="text-gray-400 text-lg font-medium">كل ما تحتاجه لإدارة محتواك بذكاء في مكان واحد.</p>
              </div>
              <button onClick={() => setView('auto-gen')} className="px-10 py-5 bg-purple-600 text-white font-black rounded-3xl shadow-2xl shadow-purple-100 hover:scale-[1.02] transition-transform">اصنع مقالاً الآن ✨</button>
            </header>
            
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: 'إجمالي المشاهدات', value: realStats.pageViews, color: 'text-gray-900' },
                { label: 'تحميلات الإضافات', value: realStats.installs, color: 'text-blue-600' },
                { label: 'نشط الآن', value: realStats.liveNow, color: 'text-red-500 animate-pulse' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">{stat.label}</p>
                  <span className={`text-5xl font-black ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700 text-right" dir="rtl">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-[32px] flex items-center justify-center text-4xl mx-auto shadow-inner">🪄</div>
              <h1 className="text-5xl font-black text-gray-900">صانع المقالات الآلي</h1>
              <p className="text-gray-500 font-medium text-lg">أدخل الكلمة المفتاحية، وسيقوم Gemini بكتابة المقال وتصميم الصورة وتجهيز كل شيء.</p>
            </div>

            <div className="bg-white p-12 rounded-[56px] border border-gray-50 shadow-2xl shadow-purple-100/50 space-y-10">
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest pr-4">ما هو موضوع المقال؟</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="مثال: كيف تحمي خصوصيتك على متصفح كروم في 2024" 
                    className="flex-grow px-10 py-7 bg-gray-50 border border-gray-100 rounded-[32px] text-xl font-bold outline-none focus:bg-white focus:ring-8 focus:ring-purple-50 transition-all"
                    value={seoKeyword} 
                    onChange={e => setSeoKeyword(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && performFullAutoMagic()}
                  />
                  <button 
                    onClick={performFullAutoMagic} 
                    disabled={status.loading}
                    className="px-14 py-7 bg-purple-600 text-white font-black rounded-[32px] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:bg-gray-200"
                  >
                    {status.loading ? 'جاري السحر...' : 'أطلق السحر!'}
                  </button>
                </div>
              </div>

              {status.loading && (
                <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-purple-600 animate-pulse">{status.message}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 opacity-50">
               <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex items-center gap-6">
                  <div className="text-3xl">✍️</div>
                  <p className="text-xs font-bold text-gray-500">كتابة محتوى طويل وحصري متوافق مع معايير SEO.</p>
               </div>
               <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex items-center gap-6">
                  <div className="text-3xl">🎨</div>
                  <p className="text-xs font-bold text-gray-500">تصميم صورة فريدة 1024x1024 لكل مقال.</p>
               </div>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="max-w-6xl animate-in fade-in duration-500 text-right" dir="rtl">
            <header className="flex justify-between items-center mb-16">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">{activeTab === 'blog' ? 'أرشيف المقالات' : 'كتالوج الإضافات'}</h1>
              <div className="flex gap-4">
                <button onClick={() => setView('auto-gen')} className="bg-purple-600 text-white px-8 py-5 rounded-[24px] font-black text-sm shadow-xl hover:bg-purple-700 transition-all">🪄 توليد آلي</button>
                <button onClick={() => {
                  const id = `${activeTab === 'blog' ? 'post' : 'ext'}-${Date.now()}`;
                  setCurrentEditItem(activeTab === 'blog' ? { id, title: '', content: '', category: 'تكنولوجيا', excerpt: '', date: 'اليوم', readTime: '5 min', image: '' } : { id, name: '', shortDescription: '', category: 'Utility', rating: 5, users: '0', icon: '✨', features: [], version: '1.0', lastUpdated: 'الآن', size: '1MB', storeUrl: '' });
                  setView('edit');
                }} className="bg-gray-900 text-white px-8 py-5 rounded-[24px] font-black text-sm shadow-xl hover:bg-black transition-all">+ إضافة يدوي</button>
              </div>
            </header>

            <div className="bg-white rounded-[48px] border border-gray-50 shadow-sm overflow-hidden apple-shadow">
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  {(activeTab === 'blog' ? blogItems : extensionItems).map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-12 py-8 flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.icon || '📄'}
                        </div>
                        <div>
                          <span className="font-black text-2xl text-gray-900 block mb-1">{item.title || item.name}</span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.category} • {item.date}</span>
                        </div>
                      </td>
                      <td className="px-12 py-8 text-left">
                        <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="text-blue-600 font-black text-sm hover:underline">تحرير</button>
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
                  <h1 className="text-4xl font-black text-gray-900 mb-2">تجهيز المقال للنشر</h1>
                  <p className="text-gray-400 font-medium">راجع المحتوى، ارفع الصورة لبلوجر، ثم اضغط حفظ.</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setView('list')} className="px-8 py-4 bg-white border border-gray-100 font-black text-sm rounded-2xl hover:bg-gray-50">إلغاء</button>
                  <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700">حفظ ونشر</button>
               </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-3 space-y-10">
                <div className="bg-white p-12 rounded-[56px] border border-gray-50 shadow-sm apple-shadow space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-2">العنوان النهائي</label>
                    <input className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[32px] font-black text-3xl outline-none focus:border-blue-500" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-2">محتوى المقال (HTML)</label>
                    <textarea className="w-full p-10 bg-gray-50 border border-gray-100 rounded-[40px] h-[700px] font-mono text-sm leading-relaxed outline-none focus:border-blue-500" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8">
                 {/* قسم بلوجر المطور */}
                 <div className="bg-white p-8 rounded-[48px] border-2 border-purple-100 shadow-2xl shadow-purple-50 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                       <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest">مساعد بلوجر</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="aspect-square bg-gray-50 rounded-[40px] border-2 border-dashed border-purple-200 flex flex-col items-center justify-center overflow-hidden relative group">
                        {currentEditItem.image ? (
                          <img src={currentEditItem.image} className="w-full h-full object-cover rounded-[38px]" />
                        ) : generatedImageBase64 ? (
                          <div className="text-center p-6 space-y-4">
                            <img src={generatedImageBase64} className="w-full h-40 object-cover rounded-2xl shadow-xl" />
                            <p className="text-[10px] text-purple-700 font-black leading-tight">هذه الصورة حصرية لك!</p>
                            <a href={generatedImageBase64} download="blog-image.png" className="inline-block px-4 py-2 bg-purple-600 text-white text-[10px] font-bold rounded-full">تحميل الصورة</a>
                          </div>
                        ) : (
                          <span className="text-6xl grayscale opacity-20">🖼️</span>
                        )}
                      </div>
                      
                      <div className="p-6 bg-purple-50 rounded-3xl space-y-2 border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-800 leading-relaxed"><strong>الخطوة الأخيرة:</strong> ارفع الصورة التي في الأعلى إلى حسابك في "بلوجر"، ثم الصق رابط الصورة الناتج هنا:</p>
                        <input 
                          className="w-full p-4 bg-white border border-purple-200 rounded-2xl font-mono text-[9px] text-blue-600 placeholder:text-gray-300" 
                          placeholder="https://1.bp.blogspot.com/..." 
                          value={currentEditItem.image} 
                          onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} 
                        />
                      </div>
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[48px] border border-gray-50 shadow-sm space-y-6">
                    <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">معلومات النشر</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 block mb-1 mr-2">التصنيف</label>
                        <input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 block mb-1 mr-2">وقت القراءة</label>
                        <input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" value={currentEditItem.readTime} onChange={e => setCurrentEditItem({...currentEditItem, readTime: e.target.value})} />
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
