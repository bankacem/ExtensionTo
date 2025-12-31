
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

type ContentType = 'blog' | 'extension';
type AdminView = 'list' | 'edit' | 'preview' | 'json' | 'analytics';

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

  const [view, setView] = useState<AdminView>('analytics');
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [status, setStatus] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' });
  const [seoKeyword, setSeoKeyword] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);

  // تحديث البيانات تلقائياً
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

  // العملية الآلية بالكامل (مقال + صورة)
  const performFullAutoMagic = async () => {
    if (!seoKeyword) return alert("من فضلك أدخل موضوع المقال أو الكلمة المفتاحية");
    
    setStatus({ loading: true, message: 'جاري استدعاء العقول الاصطناعية... 🧠' });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      // الخطوة 1: توليد المحتوى
      setStatus({ loading: true, message: 'جاري كتابة المقال وتجهيز السيو... ✍️' });
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a high-quality Arabic blog post about "${seoKeyword}".
        Return JSON: { "title": "...", "content": "...", "excerpt": "...", "readTime": "...", "imgPrompt": "Detailed visual prompt for AI image generation about this topic" }.
        Include <h2> tags. Content must be professional and catchy.`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(textResponse.text || "{}");
      
      // الخطوة 2: توليد الصورة بناءً على وصف المقال
      setStatus({ loading: true, message: 'جاري تصميم صورة حصرية لمقالك... 🎨' });
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.imgPrompt || `Professional technology illustration for ${data.title}`,
      });

      let finalImg = '📄';
      for (const part of imgResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          finalImg = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImageBase64(finalImg);
        }
      }

      // دمج كل شيء في المحرر
      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        readTime: data.readTime,
        category: "تكنولوجيا",
        image: '', // نتركها فارغة ليضع المستخدم رابط بلوجر
        date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })
      });
      
      setStatus({ loading: false, message: 'اكتملت العملية بنجاح! 🎉' });
    } catch (e) {
      console.error(e);
      setStatus({ loading: false, message: 'حدث خطأ أثناء التوليد آلياً.' });
    }
  };

  const handleSave = () => {
    if (!currentEditItem.image) {
      if (!confirm("لم تضع رابط صورة بلوجر بعد. هل تريد الحفظ بدونه؟")) return;
    }
    const idx = blogItems.findIndex(i => i.id === currentEditItem.id);
    idx !== -1 ? (blogItems[idx] = currentEditItem) : blogItems.unshift(currentEditItem);
    setBlogItems([...blogItems]);
    setView('list');
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-blue-100">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 z-30 shadow-sm">
        <div className="p-10 border-b border-gray-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-blue-100 italic text-xl">ET</div>
          <div>
            <h2 className="font-black text-lg tracking-tight">ExtensionTo</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Control</p>
          </div>
        </div>
        
        <nav className="flex-grow p-8 space-y-3">
          <button onClick={() => setView('analytics')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'analytics' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>📊 لوحة الإحصائيات</button>
          <div className="h-px bg-gray-50 my-6"></div>
          <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}>📄 إدارة المقالات</button>
          <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}>🧩 إدارة الإضافات</button>
          <div className="pt-20">
            <button onClick={() => setView('json')} className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-xs font-black text-gray-400 border border-gray-100 hover:bg-gray-50 transition-all uppercase tracking-widest">🚀 تصدير البيانات</button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-80 p-16 overflow-y-auto bg-[#F8F9FA]">
        {view === 'analytics' && (
          <div className="max-w-5xl space-y-12 animate-in fade-in duration-700">
            <header>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-2">مرحباً بك، أيها المدير</h1>
              <p className="text-gray-500 font-medium text-lg">إليك ملخص أداء موقعك في آخر 24 ساعة.</p>
            </header>
            
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: 'المشاهدات', value: realStats.pageViews, color: 'text-gray-900' },
                { label: 'التحميلات', value: realStats.installs, color: 'text-blue-600' },
                { label: 'نشط حالياً', value: realStats.liveNow, color: 'text-red-500 animate-pulse' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm apple-shadow">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">{stat.label}</p>
                  <span className={`text-5xl font-black ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="max-w-6xl animate-in fade-in duration-500 text-right" dir="rtl">
            <header className="flex justify-between items-center mb-16">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">{activeTab === 'blog' ? 'المقالات المنشورة' : 'كتالوج الإضافات'}</h1>
              <button onClick={() => {
                const id = `${activeTab === 'blog' ? 'post' : 'ext'}-${Date.now()}`;
                setCurrentEditItem(activeTab === 'blog' ? { id, title: '', content: '', category: 'تكنولوجيا', excerpt: '', date: 'اليوم', readTime: '5 min', image: '' } : { id, name: '', shortDescription: '', category: 'Utility', rating: 5, users: '0', icon: '✨', features: [], version: '1.0', lastUpdated: 'الآن', size: '1MB', storeUrl: '' });
                setView('edit');
              }} className="bg-gray-900 text-white px-10 py-5 rounded-[24px] font-black text-sm shadow-2xl hover:bg-black transition-all">+ إضافة جديد</button>
            </header>

            <div className="bg-white rounded-[48px] border border-gray-50 shadow-sm overflow-hidden apple-shadow">
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  {(activeTab === 'blog' ? blogItems : extensionItems).map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-12 py-8 flex items-center gap-6">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">{item.icon || (item.image ? <img src={item.image} className="w-full h-full object-cover rounded-2xl" /> : '📄')}</div>
                        <div>
                          <span className="font-black text-xl text-gray-900 block mb-1">{item.title || item.name}</span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-12 py-8 text-left">
                        <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="text-blue-600 font-black text-sm hover:underline">تعديل المحتوى</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500 text-right" dir="rtl">
            <header className="flex justify-between items-center mb-12">
               <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2">المحرر الذكي 2.0</h1>
                  <p className="text-gray-400 font-medium">نظام التوليد الآلي المدعوم بـ Gemini</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setView('list')} className="px-8 py-4 bg-white border border-gray-100 font-black text-sm rounded-2xl hover:bg-gray-50">إلغاء</button>
                  <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700">حفظ ونشر المقال</button>
               </div>
            </header>

            {/* نظام التوليد الآلي بضغطة زر */}
            {activeTab === 'blog' && (
              <div className="mb-12 p-12 bg-white rounded-[48px] border border-gray-50 shadow-sm apple-shadow space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">توليد مقال كامل بضغطة واحدة 🪄</h2>
                  {status.loading && (
                    <div className="flex items-center gap-3 text-blue-600 font-bold animate-pulse">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      {status.message}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="ماذا تريد أن تكتب اليوم؟ (مثال: أمان كلمات المرور في 2024)" 
                    className="flex-grow px-8 py-5 bg-gray-50 border border-gray-100 rounded-[24px] text-lg font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                    value={seoKeyword} 
                    onChange={e => setSeoKeyword(e.target.value)} 
                  />
                  <button 
                    onClick={performFullAutoMagic} 
                    disabled={status.loading}
                    className="px-12 py-5 bg-blue-600 text-white font-black rounded-[24px] shadow-2xl shadow-blue-100 hover:scale-[1.02] transition-transform active:scale-95 disabled:bg-gray-200"
                  >
                    أطلق السحر! ✨
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-3 space-y-10">
                <div className="bg-white p-12 rounded-[48px] border border-gray-50 shadow-sm apple-shadow space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-2">عنوان المقال</label>
                    <input className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[32px] font-black text-3xl outline-none focus:border-blue-500" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pr-2">المحتوى الذكي (HTML)</label>
                    <textarea className="w-full p-10 bg-gray-50 border border-gray-100 rounded-[40px] h-[600px] font-mono text-sm leading-relaxed outline-none focus:border-blue-500" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8">
                 {/* قسم الربط مع بلوجر */}
                 <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm apple-shadow space-y-6">
                    <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">رابط بلوجر (Host)</h3>
                    
                    <div className="space-y-4">
                      <div className="aspect-square bg-gray-50 rounded-[32px] border border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden p-2">
                        {currentEditItem.image ? (
                          <img src={currentEditItem.image} className="w-full h-full object-cover rounded-[28px]" />
                        ) : generatedImageBase64 ? (
                          <div className="text-center p-4">
                            <img src={generatedImageBase64} className="w-full h-32 object-cover rounded-xl mb-3 shadow-md" />
                            <p className="text-[10px] text-blue-600 font-bold leading-tight">صورة حصرية جاهزة! ارفعها لبلوجر وضع الرابط أدناه.</p>
                          </div>
                        ) : (
                          <span className="text-6xl grayscale opacity-20">🖼️</span>
                        )}
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-gray-400 block mb-2 mr-2">رابط الصورة من بلوجر:</label>
                        <input 
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-[9px] text-blue-600" 
                          placeholder="https://1.bp.blogspot.com/..." 
                          value={currentEditItem.image} 
                          onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} 
                        />
                      </div>
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm apple-shadow space-y-6">
                    <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">الإعدادات</h3>
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

        {view === 'json' && (
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-[56px] p-16 text-white animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-9xl">JSON</div>
            <h2 className="text-3xl font-black mb-10 flex items-center gap-4">تصدير المحتوى <span className="text-xs bg-green-500 px-3 py-1 rounded-full">جاهز للإنتاج</span></h2>
            <pre className="bg-black/50 p-10 rounded-[32px] h-[500px] overflow-auto font-mono text-[11px] text-blue-400 border border-white/5 scrollbar-hide">{JSON.stringify({ blogItems, extensionItems }, null, 2)}</pre>
            <button onClick={() => setView('analytics')} className="mt-10 text-gray-500 font-black hover:text-white transition-colors">← العودة للوحة الإحصائيات</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
