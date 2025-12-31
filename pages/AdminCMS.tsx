
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
  const [view, setView] = useState<AdminView>('analytics'); // جعلنا التحليلات هي الصفحة الافتراضية للبدء
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchUrl, setFetchUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Unsaved'>('Saved');
  const [seoKeyword, setSeoKeyword] = useState('');

  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
      localStorage.setItem('cms_extensions', JSON.stringify(extensionItems));
      setSaveStatus('Saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [blogItems, extensionItems]);

  const filteredItems = useMemo(() => {
    const items = activeTab === 'blog' ? blogItems : extensionItems;
    return items.filter((item: any) => 
      (item.title || item.name).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, blogItems, extensionItems, searchQuery]);

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

  const autoFetchExtension = async () => {
    if (!fetchUrl.includes('chromewebstore.google.com')) return alert('Invalid URL');
    setIsFetching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const prompt = `Find details for: ${fetchUrl}. Return JSON: name, shortDescription, longDescription, rating, users, category, version.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || "{}");
      setCurrentEditItem({ ...currentEditItem, ...data, storeUrl: fetchUrl });
      setFetchUrl('');
    } catch (e) { alert("Fetch failed"); } finally { setIsFetching(false); }
  };

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

  // --- مكونات لوحة التحليلات الجديدة ---
  const renderAnalytics = () => {
    const stats = [
      { label: 'Total Page Views', value: '42.8k', change: '+12%', color: 'blue' },
      { label: 'Extension Installs', value: '8.1k', change: '+5.4%', color: 'green' },
      { label: 'Average Session', value: '4m 12s', change: '-2%', color: 'purple' },
      { label: 'Live Now', value: '124', change: 'Pulse', color: 'red' },
    ];

    const trafficData = [65, 78, 45, 90, 110, 85, 130]; // بيانات وهمية للرسم البياني

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
            <p className="text-gray-500 font-medium mt-1">Real-time performance tracking for ExtensionTo.</p>
          </div>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold shadow-sm">Last 7 Days</button>
             <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-sm">Export Report</button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm apple-shadow relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">{stat.label}</p>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-gray-900">{stat.value}</span>
                <span className={`text-[10px] font-black pb-1 ${stat.change.includes('+') ? 'text-green-500' : stat.change === 'Pulse' ? 'text-red-500' : 'text-gray-400'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Card */}
          <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
             <div className="flex justify-between items-center mb-10">
               <h3 className="font-black text-lg text-gray-900">Traffic Trend</h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase">Organic</span>
                  </div>
               </div>
             </div>
             {/* Simple SVG Chart */}
             <div className="h-64 w-full flex items-end gap-2 group">
                {trafficData.map((val, i) => (
                  <div key={i} className="flex-grow flex flex-col items-center gap-2 group/bar">
                    <div 
                      className="w-full bg-blue-500/10 rounded-t-xl group-hover/bar:bg-blue-600 transition-all duration-500 relative"
                      style={{ height: `${val}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                        {val}k views
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400">Day {i+1}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Right Sidebar Stats */}
          <div className="space-y-6">
            <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-2xl">
              <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-6">Top Extension</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-4xl italic font-black">uB</div>
                <div>
                  <h4 className="font-bold text-lg">uBlock Origin</h4>
                  <p className="text-gray-400 text-xs">2.4k clicks this week</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex justify-between text-xs font-bold mb-2">
                   <span>Conversion Rate</span>
                   <span className="text-blue-400">18.4%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500" style={{ width: '18.4%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-6">Device Usage</h3>
              <div className="space-y-4">
                 {[
                   { label: 'Chrome Desktop', val: 72, color: 'blue' },
                   { label: 'Edge Desktop', val: 18, color: 'gray' },
                   { label: 'Brave/Other', val: 10, color: 'purple' },
                 ].map((d, i) => (
                   <div key={i} className="space-y-1">
                     <div className="flex justify-between text-[10px] font-black">
                       <span>{d.label}</span>
                       <span>{d.val}%</span>
                     </div>
                     <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                       <div className={`h-full bg-${d.color}-500`} style={{ width: `${d.val}%` }}></div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      <aside className="w-72 bg-gray-900 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-8 border-b border-gray-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black italic shadow-lg shadow-blue-500/20">ET</div>
          <div>
            <h2 className="font-black tracking-tight text-lg">ExtensionTo</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global CMS</p>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2">
          <button 
            onClick={() => setView('analytics')} 
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${view === 'analytics' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <span className="text-lg">📊</span> Analytics
          </button>
          <div className="py-2"></div>
          <button 
            onClick={() => {setActiveTab('blog'); setView('list');}} 
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <span className="text-lg">📄</span> Articles
          </button>
          <button 
            onClick={() => {setActiveTab('extension'); setView('list');}} 
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <span className="text-lg">🧩</span> Extensions
          </button>
          <div className="pt-10 opacity-20 border-t border-gray-700 my-4"></div>
          <button onClick={() => setView('json')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold ${view === 'json' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
            🚀 Export Data
          </button>
        </nav>

        <div className="p-6">
          <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-800 flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase text-gray-400">Live Syncing...</span>
          </div>
        </div>
      </aside>

      <main className="flex-grow ml-72 p-12 overflow-y-auto">
        {view === 'analytics' && renderAnalytics()}

        {view === 'list' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="flex justify-between items-center mb-12">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Content Library</h1>
                <p className="text-gray-500 font-medium mt-1">Manage everything on extensionto.com</p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 px-3 py-1 rounded-full">{saveStatus}</span>
                 <button onClick={() => {
                   const newItem = activeTab === 'blog' ? { id: `post-${Date.now()}`, title: 'New Article', content: '', category: 'Guides', excerpt: '', date: 'Today', readTime: '5 min', image: '📄' } : { id: `ext-${Date.now()}`, name: '', shortDescription: '', category: 'Utility', rating: 5, users: '0', icon: '✨', features: [], version: '1.0', lastUpdated: 'Now', size: '1MB', storeUrl: '' };
                   setCurrentEditItem(newItem);
                   setView('edit');
                 }} className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200">+ Add New</button>
              </div>
            </header>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                  <input type="text" placeholder="Search by title..." className="w-full max-w-md px-6 py-3 rounded-xl border border-gray-200 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
               <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                    <tr><th className="px-8 py-5">Item</th><th className="px-8 py-5">Category</th><th className="px-8 py-5 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6 flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">{item.icon || '📄'}</div>
                          <span className="font-bold text-gray-900">{item.title || item.name}</span>
                        </td>
                        <td className="px-8 py-6"><span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase">{item.category}</span></td>
                        <td className="px-8 py-6 text-right"><button onClick={() => handleEdit(item)} className="text-blue-600 font-bold text-sm hover:underline">Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
             <header className="flex justify-between items-center mb-10">
               <div>
                  <button onClick={() => setView('list')} className="text-gray-400 font-bold text-xs hover:text-gray-900 mb-2 flex items-center gap-1">← Library</button>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">Modify Content</h1>
               </div>
               <div className="flex gap-4">
                  <button onClick={generateAIContent} disabled={isGenerating} className="px-6 py-3 bg-purple-50 text-purple-600 rounded-xl font-bold border border-purple-100">
                    {isGenerating ? 'Gemini AI is writing...' : '✨ AI Smart Write'}
                  </button>
                  <button onClick={handleSaveToLocal} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Commit Changes</button>
               </div>
             </header>

             {activeTab === 'extension' && (
               <div className="mb-10 p-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-6">
                 <div className="flex-grow">
                   <h3 className="text-xl font-black tracking-tight mb-1">Auto-Magic Fetcher</h3>
                   <p className="text-blue-100 text-sm font-medium">Populate all fields using Gemini AI via Chrome Store URL.</p>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                   <input type="text" placeholder="https://chromewebstore.google.com/..." className="flex-grow md:w-80 px-6 py-3.5 bg-white/10 border border-white/20 rounded-2xl outline-none" value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} />
                   <button onClick={autoFetchExtension} className="px-8 py-3.5 bg-white text-blue-600 font-black rounded-2xl">Fetch Data</button>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-3 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                   <input className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xl outline-none" value={activeTab === 'blog' ? currentEditItem.title : currentEditItem.name} onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, title: e.target.value}) : setCurrentEditItem({...currentEditItem, name: e.target.value})} />
                   <textarea className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[32px] h-[500px] font-mono text-sm leading-relaxed" value={activeTab === 'blog' ? currentEditItem.content : currentEditItem.shortDescription} onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, content: e.target.value}) : setCurrentEditItem({...currentEditItem, shortDescription: e.target.value})} />
                </div>
                <div className="lg:col-span-1 space-y-8">
                   {activeTab === 'blog' && seoAnalysis && (
                     <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center"><h3 className="font-black text-xs uppercase text-gray-400">SEO Score</h3><div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black">{seoAnalysis.score}/100</div></div>
                        <div className="space-y-4">
                          <input placeholder="Target Keyword" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" value={seoKeyword} onChange={(e) => setSeoKeyword(e.target.value)} />
                          {seoAnalysis.checks.map(c => <div key={c.id} className="flex items-center gap-3 text-xs font-bold text-gray-500"><div className={`w-3 h-3 rounded-full ${c.pass ? 'bg-green-500' : 'bg-gray-200'}`}></div>{c.label}</div>)}
                        </div>
                     </div>
                   )}
                   <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                      <h3 className="font-black text-xs uppercase text-gray-400">Settings</h3>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Category</label><input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} /></div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'json' && (
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-[48px] p-12 text-white animate-in zoom-in-95 duration-500">
            <h2 className="text-2xl font-black mb-6">Production JSON Export</h2>
            <pre className="bg-black/40 p-8 rounded-3xl h-[450px] overflow-auto font-mono text-[11px] text-blue-400">{JSON.stringify(activeTab === 'blog' ? blogItems : extensionItems, null, 2)}</pre>
            <button onClick={() => setView('analytics')} className="mt-8 text-gray-500 font-bold hover:text-white">Return to Dashboard</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
