
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
    if (!seoKeyword) return alert("Please enter a topic first");
    
    setStatus({ loading: true, message: 'Waking up the AI... 🚀' });
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key is missing");
      
      const ai = new GoogleGenAI({ apiKey });
      
      setStatus({ loading: true, message: 'Crafting content... ✍️' });
      const textRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a high-quality, long-form English blog post about "${seoKeyword}". 
        Focus on SEO and professionalism. Return JSON ONLY: { "title": "...", "content": "...", "excerpt": "...", "readTime": "...", "imgPrompt": "..." }. 
        Use <h2> for subheadings. Content must be engaging.`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(textRes.text || "{}");
      
      setStatus({ loading: true, message: 'Designing hero image... 🎨' });
      const imgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.imgPrompt || `Professional minimalist technology illustration for ${data.title}. clean white background style.`,
      });

      // Strict check for candidates to satisfy TypeScript
      if (imgRes.candidates && imgRes.candidates.length > 0) {
        const candidate = imgRes.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              const base64Data = part.inlineData.data;
              const finalImg = `data:image/png;base64,${base64Data}`;
              setGeneratedImageBase64(finalImg);
            }
          }
        }
      }

      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title || "Untitled Article",
        content: data.content || "Content goes here...",
        excerpt: data.excerpt || "Brief excerpt...",
        readTime: data.readTime || "5 min read",
        category: "Tech Insights",
        image: '', 
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      });
      
      setStatus({ loading: false, message: '' });
      setView('edit'); 
    } catch (e) {
      console.error(e);
      setStatus({ loading: false, message: 'Error! Please check your connection and try again.' });
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
    <div className="flex min-h-screen bg-[#FDFDFD] text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-gray-950 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-10 border-b border-gray-900 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl">ET</div>
          <h2 className="font-black text-xl tracking-tighter">ExtensionTo</h2>
        </div>
        
        <nav className="flex-grow p-8 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600' : 'text-gray-400 hover:bg-white/5'}`}>📊 Dashboard</button>
          <div className="h-px bg-white/5 my-6"></div>
          
          <div className="px-4 mb-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">AI Features</p>
            <button onClick={() => setView('auto-gen')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'auto-gen' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-600/10'}`}>
               <span>🪄 Magic Write</span>
               <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-full">PRO</span>
            </button>
          </div>

          <div className="px-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Manage</p>
            <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-600' : 'text-gray-400 hover:bg-white/5'}`}>📄 Blog Posts</button>
            <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-600' : 'text-gray-400 hover:bg-white/5'}`}>🧩 Extensions</button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-80 p-16">
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-12">
            <header className="flex justify-between items-end bg-white p-12 rounded-[48px] border border-gray-100 apple-shadow">
              <div>
                <h1 className="text-5xl font-black text-gray-900 mb-4">Console Overview</h1>
                <p className="text-gray-400 text-lg font-medium">Monitoring directory performance and content growth.</p>
              </div>
              <button onClick={() => setView('auto-gen')} className="px-10 py-5 bg-purple-600 text-white font-black rounded-3xl shadow-xl hover:scale-[1.05] transition-all">🪄 Create AI Post</button>
            </header>
            
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[32px] border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-3">Total Visits</p>
                <span className="text-5xl font-black text-gray-900">{realStats.pageViews}</span>
              </div>
              <div className="bg-white p-10 rounded-[32px] border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-3">Installs</p>
                <span className="text-5xl font-black text-blue-600">{realStats.installs}</span>
              </div>
              <div className="bg-white p-10 rounded-[32px] border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-3">Live Now</p>
                <span className="text-5xl font-black text-red-500">{realStats.liveNow}</span>
              </div>
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-black text-gray-900">Magic Write</h1>
              <p className="text-gray-500 text-xl font-medium">Generate high-quality SEO content in seconds.</p>
            </div>

            <div className="bg-white p-14 rounded-[56px] border border-gray-50 shadow-2xl space-y-10">
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase ml-4">What should we write about?</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="e.g., Best Productivity Tools for Chrome in 2025" 
                    className="flex-grow px-8 py-6 bg-gray-50 border border-gray-100 rounded-[24px] text-xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all"
                    value={seoKeyword} 
                    onChange={e => setSeoKeyword(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && performFullAutoMagic()}
                  />
                  <button 
                    onClick={performFullAutoMagic} 
                    disabled={status.loading}
                    className="px-10 py-6 bg-purple-600 text-white font-black rounded-[24px] shadow-lg disabled:bg-gray-200"
                  >
                    {status.loading ? 'Working...' : 'Generate'}
                  </button>
                </div>
              </div>
              {status.loading && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-purple-600">{status.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="max-w-6xl">
            <header className="flex justify-between items-center mb-16">
              <h1 className="text-5xl font-black text-gray-900">{activeTab === 'blog' ? 'Blog Posts' : 'Extensions'}</h1>
              <button onClick={() => setView('auto-gen')} className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg">🪄 AI Generate</button>
            </header>

            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  {(activeTab === 'blog' ? blogItems : extensionItems).map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-10 py-8 flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.icon || '📄'}
                        </div>
                        <div>
                          <span className="font-black text-xl text-gray-900 block">{item.title || item.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="px-6 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-12">
               <h1 className="text-4xl font-black text-gray-900">Content Editor</h1>
               <div className="flex gap-4">
                  <button onClick={() => setView('list')} className="px-8 py-4 bg-white border border-gray-200 font-bold rounded-xl">Cancel</button>
                  <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white font-black rounded-xl">Save & Publish</button>
               </div>
            </header>

            <div className="grid grid-cols-4 gap-12">
              <div className="col-span-3 space-y-8">
                <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Title</label>
                    <input className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl font-black text-3xl outline-none focus:bg-white" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Content (HTML)</label>
                    <textarea className="w-full p-8 bg-gray-50 border border-gray-100 rounded-3xl h-[600px] font-mono text-sm leading-relaxed outline-none focus:bg-white" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="col-span-1 space-y-8">
                 <div className="bg-white p-8 rounded-[32px] border-2 border-purple-50 shadow-sm space-y-6">
                    <h3 className="font-black text-sm text-gray-900 uppercase">Post Image</h3>
                    <div className="aspect-square bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden">
                        {currentEditItem.image ? (
                          <img src={currentEditItem.image} className="w-full h-full object-cover" />
                        ) : generatedImageBase64 ? (
                          <div className="text-center p-4">
                            <img src={generatedImageBase64} className="w-full h-32 object-cover rounded-xl mb-4" />
                            <a href={generatedImageBase64} download="image.png" className="text-[10px] bg-purple-600 text-white px-4 py-2 rounded-full font-bold">Download</a>
                          </div>
                        ) : (
                          <span className="text-4xl opacity-20">🖼️</span>
                        )}
                    </div>
                    <input 
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono" 
                      placeholder="Paste final Blogger URL here..." 
                      value={currentEditItem.image} 
                      onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} 
                    />
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
