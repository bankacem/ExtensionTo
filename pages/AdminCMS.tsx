
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import { GoogleGenAI } from "@google/genai";

type ContentType = 'blog' | 'extension';
type AdminView = 'dashboard' | 'list' | 'edit' | 'auto-gen';

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
    if (!seoKeyword) return alert("Please enter a topic first");
    
    setStatus({ loading: true, message: 'Waking up the AI... 🚀' });
    try {
      const apiKey = process.env.API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      
      setStatus({ loading: true, message: 'Crafting content... ✍️' });
      const textRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a high-quality, long-form English blog post about "${seoKeyword}". Focus on SEO. Return JSON ONLY: { "title": "...", "content": "...", "excerpt": "...", "readTime": "...", "imgPrompt": "..." }.`,
        config: { responseMimeType: "application/json" }
      });
      
      const rawText = textRes.text;
      if (!rawText) throw new Error("No response from text AI");
      const data = JSON.parse(rawText);
      
      setStatus({ loading: true, message: 'Designing hero image... 🎨' });
      // Use the name 'imgResponse' to match the user's error log if they are editing manually
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.imgPrompt || `Technology illustration for ${data.title}. clean white background.`,
      });

      // EXTREMELY STRICT NULL CHECKS FOR TYPESCRIPT SAFETY
      const candidates = imgResponse?.candidates;
      if (candidates && candidates.length > 0) {
        const firstCandidate = candidates[0];
        if (firstCandidate?.content?.parts) {
          const parts = firstCandidate.content.parts;
          for (const part of parts) {
            if (part?.inlineData?.data) {
              const base64Data = part.inlineData.data;
              const finalImg = `data:image/png;base64,${base64Data}`;
              setGeneratedImageBase64(finalImg);
            }
          }
        }
      }

      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title || "Untitled",
        content: data.content || "",
        excerpt: data.excerpt || "",
        readTime: data.readTime || "5 min read",
        category: "Insights",
        image: '', 
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      });
      
      setStatus({ loading: false, message: '' });
      setView('edit'); 
    } catch (e) {
      console.error(e);
      setStatus({ loading: false, message: 'Error! Please check your API configuration.' });
    }
  };

  const handleSave = () => {
    if (!currentEditItem) return;
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
    <div className="flex min-h-screen bg-white text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-10 border-b border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-600/20">ET</div>
          <h2 className="font-black text-xl tracking-tighter">ExtensionTo</h2>
        </div>
        
        <nav className="flex-grow p-8 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600' : 'text-slate-400 hover:bg-white/5'}`}>📊 Dashboard</button>
          <div className="h-px bg-white/5 my-6"></div>
          
          <div className="px-4 mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Magic Tools</p>
            <button onClick={() => setView('auto-gen')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'auto-gen' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-purple-400 hover:bg-purple-600/10'}`}>
               <span>🪄 AI Author</span>
               <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-full font-black uppercase">Auto</span>
            </button>
          </div>

          <div className="px-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Content Manager</p>
            <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-600' : 'text-slate-400 hover:bg-white/5'}`}>📄 Blog Posts</button>
            <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-600' : 'text-slate-400 hover:bg-white/5'}`}>🧩 Extensions</button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-80 p-16 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-12 animate-in fade-in duration-500">
            <header className="flex justify-between items-end bg-slate-50 p-12 rounded-[48px] border border-slate-100 shadow-sm">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Directory Control</h1>
                <p className="text-slate-400 text-lg font-medium">Monitoring growth and performance metrics in real-time.</p>
              </div>
              <button onClick={() => setView('auto-gen')} className="px-10 py-5 bg-purple-600 text-white font-black rounded-[24px] shadow-xl hover:scale-[1.05] transition-all">🪄 Create AI Post</button>
            </header>
            
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Site Traffic</p>
                <span className="text-6xl font-black text-slate-900 tracking-tighter">{realStats.pageViews}</span>
              </div>
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Install Events</p>
                <span className="text-6xl font-black text-blue-600 tracking-tighter">{realStats.installs}</span>
              </div>
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Current Active</p>
                <span className="text-6xl font-black text-red-500 tracking-tighter animate-pulse">{realStats.liveNow}</span>
              </div>
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-purple-200">🪄</div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter">AI Magic Author</h1>
              <p className="text-slate-500 font-medium text-xl max-w-lg mx-auto leading-relaxed">Let Gemini write high-performance SEO articles while you focus on scaling.</p>
            </div>

            <div className="bg-white p-14 rounded-[64px] border border-slate-100 shadow-2xl space-y-10">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">Target Topic / Keyword</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="e.g., Best Ad-Blockers for Chrome in 2025" 
                    className="flex-grow px-10 py-8 bg-slate-50 border border-slate-100 rounded-[32px] text-2xl font-bold outline-none focus:bg-white focus:ring-[12px] focus:ring-purple-50 transition-all"
                    value={seoKeyword} 
                    onChange={e => setSeoKeyword(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && performFullAutoMagic()}
                  />
                  <button 
                    onClick={performFullAutoMagic} 
                    disabled={status.loading}
                    className="px-14 py-8 bg-purple-600 text-white font-black rounded-[32px] shadow-2xl shadow-purple-100 hover:scale-105 active:scale-95 transition-all disabled:bg-slate-200"
                  >
                    {status.loading ? 'Writing...' : 'Generate Magic'}
                  </button>
                </div>
              </div>

              {status.loading && (
                <div className="flex flex-col items-center gap-6 py-6 animate-in fade-in">
                  <div className="w-14 h-14 border-[6px] border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-2xl text-purple-600 animate-pulse">{status.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="max-w-6xl animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-16">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">{activeTab === 'blog' ? 'Blog Post Library' : 'Extension Database'}</h1>
              <div className="flex gap-4">
                <button onClick={() => setView('auto-gen')} className="bg-purple-600 text-white px-8 py-5 rounded-[24px] font-black text-sm shadow-xl hover:bg-purple-700 transition-all">🪄 AI Generation</button>
                <button onClick={() => {
                  const id = `${activeTab === 'blog' ? 'post' : 'ext'}-${Date.now()}`;
                  setCurrentEditItem(activeTab === 'blog' ? { id, title: '', content: '', category: 'Tech', excerpt: '', date: 'Today', readTime: '5 min', image: '' } : { id, name: '', shortDescription: '', category: 'Utility', rating: 5, users: '0', icon: '✨', features: [], version: '1.0', lastUpdated: 'Now', size: '1MB', storeUrl: '' });
                  setView('edit');
                }} className="bg-slate-900 text-white px-8 py-5 rounded-[24px] font-black text-sm shadow-xl hover:bg-black transition-all">+ Manual Entry</button>
              </div>
            </header>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <tbody className="divide-y divide-slate-50">
                  {(activeTab === 'blog' ? blogItems : extensionItems).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-12 py-10 flex items-center gap-8">
                        <div className="w-20 h-20 bg-slate-100 rounded-[28px] flex items-center justify-center text-4xl shrink-0 overflow-hidden shadow-inner border border-slate-200">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.icon || '📄'}
                        </div>
                        <div>
                          <span className="font-black text-2xl text-slate-900 block mb-2">{item.title || item.name}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.category} • {item.date || item.lastUpdated}</span>
                        </div>
                      </td>
                      <td className="px-12 py-10 text-right">
                        <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="px-8 py-4 bg-slate-50 text-slate-900 font-black text-xs rounded-2xl hover:bg-slate-100 transition-colors">Modify</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center mb-12">
               <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Content Editor</h1>
                  <p className="text-slate-400 font-medium text-lg">Finalize the article and push it to production.</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setView('list')} className="px-8 py-5 bg-white border border-slate-200 font-black text-sm rounded-2xl hover:bg-slate-50 transition-all">Discard</button>
                  <button onClick={handleSave} className="px-12 py-5 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all">Save & Publish</button>
               </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-3 space-y-10">
                <div className="bg-white p-14 rounded-[64px] border border-slate-50 shadow-sm space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-4">Article Title</label>
                    <input className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] font-black text-4xl outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-4">HTML Body Content</label>
                    <textarea className="w-full p-12 bg-slate-50 border border-slate-100 rounded-[48px] h-[700px] font-mono text-sm leading-relaxed outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8">
                 <div className="bg-white p-10 rounded-[48px] border-2 border-purple-50 shadow-2xl shadow-purple-50/50 space-y-8">
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest text-center">Thumbnail</h3>
                    <div className="aspect-square bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
                        {currentEditItem.image ? (
                          <img src={currentEditItem.image} className="w-full h-full object-cover" />
                        ) : generatedImageBase64 ? (
                          <div className="text-center p-6 space-y-4">
                            <img src={generatedImageBase64} className="w-full h-40 object-cover rounded-3xl shadow-xl" />
                            <a href={generatedImageBase64} download="cover.png" className="inline-block px-5 py-2.5 bg-purple-600 text-white text-[10px] font-black rounded-full hover:bg-purple-700 shadow-lg">Download File</a>
                          </div>
                        ) : (
                          <span className="text-7xl grayscale opacity-10">🖼️</span>
                        )}
                    </div>
                    <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100 space-y-4">
                      <p className="text-[10px] font-bold text-purple-900 text-center">Paste the Blogger image URL below:</p>
                      <input 
                        className="w-full p-4 bg-white border border-purple-200 rounded-2xl font-mono text-[10px] text-blue-600 placeholder:text-slate-300 text-center" 
                        placeholder="https://blogger.com/..." 
                        value={currentEditItem.image} 
                        onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} 
                      />
                    </div>
                 </div>

                 <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-6">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Metadata</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 block mb-2 pl-2">Category</label>
                        <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 block mb-2 pl-2">Read Estimate</label>
                        <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={currentEditItem.readTime} onChange={e => setCurrentEditItem({...currentEditItem, readTime: e.target.value})} />
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
