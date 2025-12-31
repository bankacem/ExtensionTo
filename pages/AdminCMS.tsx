
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

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<AdminView>('analytics');
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchUrl, setFetchUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Unsaved'>('Saved');
  const [seoKeyword, setSeoKeyword] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);

  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
      localStorage.setItem('cms_extensions', JSON.stringify(extensionItems));
      setSaveStatus('Saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [blogItems, extensionItems]);

  // تحديث البيانات الحقيقية دورياً
  useEffect(() => {
    const fetchRealStats = () => {
      const stats = JSON.parse(localStorage.getItem('et_analytics') || '[]');
      setAnalyticsData(stats);
    };
    fetchRealStats();
    const interval = setInterval(fetchRealStats, 2000); // تحديث كل ثانيتين
    return () => clearInterval(interval);
  }, []);

  const realStats = useMemo(() => {
    const now = new Date();
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const pageViews = analyticsData.filter(e => e.type === 'view').length;
    const installs = analyticsData.filter(e => e.type === 'install').length;
    const liveNow = analyticsData.filter(e => e.type === 'view' && new Date(e.timestamp) > fiveMinsAgo).length;

    // حساب البيانات للأيام السبعة الماضية للرسم البياني
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const count = analyticsData.filter(e => e.type === 'view' && new Date(e.timestamp).toDateString() === d.toDateString()).length;
      return count;
    });

    // أفضل الإضافات أداءً بناءً على التحميلات الحقيقية
    const installCounts: Record<string, number> = {};
    analyticsData.filter(e => e.type === 'install').forEach(e => {
      installCounts[e.itemId] = (installCounts[e.itemId] || 0) + 1;
    });

    const topExtensions = Object.entries(installCounts)
      .map(([id, count]) => {
        const ext = STATIC_EXTENSIONS.find(x => x.id === id);
        return { name: ext?.name || id, count, icon: ext?.icon || '🧩' };
      })
      .sort((a, b) => b.count - a.count);

    return { pageViews, installs, liveNow, chartData, topExtensions };
  }, [analyticsData]);

  const seoAnalysis = useMemo(() => {
    if (activeTab !== 'blog' || !currentEditItem) return null;
    const text = currentEditItem.content || '';
    const title = currentEditItem.title || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    let score = 0;
    const checks = [
      { id: 'title-length', label: 'Title length (40-70 chars)', pass: title.length >= 40 && title.length <= 70, pts: 15 },
      { id: 'word-count', label: 'Content length (> 300 words)', pass: wordCount >= 300, pts: 25 },
      { id: 'h2-presence', label: 'Has subheadings (H2)', pass: text.includes('<h2'), pts: 15 },
      { id: 'img-presence', label: 'Has images', pass: text.includes('<img'), pts: 15 },
      { id: 'keyword-title', label: 'Keyword in title', pass: seoKeyword && title.toLowerCase().includes(seoKeyword.toLowerCase()), pts: 15 },
      { id: 'keyword-body', label: 'Keyword in content', pass: seoKeyword && text.toLowerCase().includes(seoKeyword.toLowerCase()), pts: 15 },
    ];
    score = checks.reduce((acc, check) => acc + (check.pass ? check.pts : 0), 0);
    return { score, checks, wordCount };
  }, [currentEditItem, activeTab, seoKeyword]);

  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const prompt = activeTab === 'blog' 
        ? `Write an SEO article for "${currentEditItem.title}" with keyword "${seoKeyword}". HTML format.`
        : `Write a marketing blurb for "${currentEditItem.name}".`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      const text = response.text || "";
      if (activeTab === 'blog') setCurrentEditItem({ ...currentEditItem, content: text });
      else setCurrentEditItem({ ...currentEditItem, shortDescription: text });
    } catch (e) { alert("AI failed"); } finally { setIsGenerating(false); }
  };

  const handleEdit = (item: any) => { setCurrentEditItem({ ...item }); setView('edit'); };

  const handleSaveToLocal = () => {
    if (activeTab === 'blog') {
      const idx = blogItems.findIndex(i => i.id === currentEditItem.id);
      if (idx !== -1) { const u = [...blogItems]; u[idx] = currentEditItem; setBlogItems(u); }
      else setBlogItems([currentEditItem, ...blogItems]);
    } else {
      const idx = extensionItems.findIndex(i => i.id === currentEditItem.id);
      if (idx !== -1) { const u = [...extensionItems]; u[idx] = currentEditItem; setExtensionItems(u); }
      else setExtensionItems([currentEditItem, ...extensionItems]);
    }
    setView('list');
  };

  const filteredItems = useMemo(() => {
    const items = activeTab === 'blog' ? blogItems : extensionItems;
    return items.filter((item: any) => 
      (item.title || item.name).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, blogItems, extensionItems, searchQuery]);

  const renderAnalytics = () => {
    const kpis = [
      { label: 'Total Views', value: realStats.pageViews.toLocaleString(), color: 'blue' },
      { label: 'Real Installs', value: realStats.installs.toLocaleString(), color: 'green' },
      { label: 'Live Now', value: realStats.liveNow.toString(), color: 'red', pulse: true },
      { label: 'Conversion', value: realStats.pageViews > 0 ? ((realStats.installs / realStats.pageViews) * 100).toFixed(1) + '%' : '0%', color: 'purple' },
    ];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
        <header>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Live Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time data captured from your current browser session.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm relative overflow-hidden">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">{kpi.label}</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-gray-900">{kpi.value}</span>
                {kpi.pulse && <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
             <h3 className="font-black text-lg text-gray-900 mb-10">Weekly Page Views</h3>
             <div className="h-64 w-full flex items-end gap-3 group">
                {realStats.chartData.map((val, i) => (
                  <div key={i} className="flex-grow flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-blue-600 rounded-t-xl transition-all duration-500"
                      style={{ height: `${Math.max(val * 10, 5)}%` }} // ضربنا في 10 للتوضيح البصري إذا كانت الأرقام صغيرة
                    ></div>
                    <span className="text-[10px] font-black text-gray-400">Day {i+1}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-2xl">
             <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-8">Popular Extensions</h3>
             <div className="space-y-6">
                {realStats.topExtensions.slice(0, 5).map((ext, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{ext.icon}</span>
                      <span className="font-bold text-sm truncate max-w-[120px]">{ext.name}</span>
                    </div>
                    <span className="text-blue-400 font-black text-xs">{ext.count} Installs</span>
                  </div>
                ))}
                {realStats.topExtensions.length === 0 && <p className="text-gray-500 text-xs italic">No installs tracked yet.</p>}
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-72 bg-gray-900 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-8 border-b border-gray-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black italic">ET</div>
          <h2 className="font-black tracking-tight text-lg">ExtensionTo</h2>
        </div>
        <nav className="flex-grow p-6 space-y-2">
          <button onClick={() => setView('analytics')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm ${view === 'analytics' ? 'bg-blue-600' : 'text-gray-400 hover:bg-gray-800'}`}>📊 Analytics</button>
          <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-600' : 'text-gray-400 hover:bg-gray-800'}`}>📄 Articles</button>
          <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-600' : 'text-gray-400 hover:bg-gray-800'}`}>🧩 Extensions</button>
          <button onClick={() => setView('json')} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm text-gray-400 hover:bg-gray-800 mt-10">🚀 Export JSON</button>
        </nav>
      </aside>

      <main className="flex-grow ml-72 p-12 overflow-y-auto">
        {view === 'analytics' && renderAnalytics()}
        {view === 'list' && (
          <div>
            <header className="flex justify-between items-center mb-10">
              <h1 className="text-4xl font-black">{activeTab === 'blog' ? 'Articles' : 'Extensions'}</h1>
              <span className="text-xs font-black uppercase bg-green-100 text-green-700 px-3 py-1 rounded-full">{saveStatus}</span>
            </header>
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr><th className="px-8 py-5">Title</th><th className="px-8 py-5 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 font-bold">{item.title || item.name}</td>
                        <td className="px-8 py-6 text-right"><button onClick={() => handleEdit(item)} className="text-blue-600 font-bold text-sm">Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-10">
               <button onClick={() => setView('list')} className="text-gray-400 font-bold text-xs">← Back</button>
               <div className="flex gap-4">
                  <button onClick={generateAIContent} disabled={isGenerating} className="px-6 py-3 bg-purple-50 text-purple-600 rounded-xl font-bold">✨ AI Smart Write</button>
                  <button onClick={handleSaveToLocal} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold">Commit Changes</button>
               </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
               <div className="lg:col-span-3 space-y-6">
                  <input className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-xl" value={activeTab === 'blog' ? currentEditItem.title : currentEditItem.name} onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, title: e.target.value}) : setCurrentEditItem({...currentEditItem, name: e.target.value})} />
                  <textarea className="w-full p-6 bg-white border border-gray-100 rounded-[32px] h-[500px] font-mono text-sm" value={activeTab === 'blog' ? currentEditItem.content : currentEditItem.shortDescription} onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, content: e.target.value}) : setCurrentEditItem({...currentEditItem, shortDescription: e.target.value})} />
               </div>
               <div className="lg:col-span-1">
                  {activeTab === 'blog' && seoAnalysis && (
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                       <h3 className="font-black text-xs text-gray-400">SEO Score: {seoAnalysis.score}</h3>
                       <input placeholder="Keyword" className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold" value={seoKeyword} onChange={e => setSeoKeyword(e.target.value)} />
                       {seoAnalysis.checks.map(c => <div key={c.id} className="text-[10px] font-bold text-gray-500 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${c.pass ? 'bg-green-500' : 'bg-gray-200'}`}></div>{c.label}</div>)}
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {view === 'json' && (
          <div className="bg-gray-900 rounded-[40px] p-12 text-white">
            <h2 className="text-2xl font-black mb-6">Production JSON Export</h2>
            <pre className="bg-black/40 p-8 rounded-3xl h-[400px] overflow-auto font-mono text-[10px] text-blue-400">{JSON.stringify({ blogItems, extensionItems }, null, 2)}</pre>
            <button onClick={() => setView('analytics')} className="mt-8 text-gray-500 font-bold">Return</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
