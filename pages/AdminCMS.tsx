
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BlogPost, Extension, BatchItem } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

type AdminView = 'dashboard' | 'articles' | 'extensions' | 'asset-studio' | 'edit' | 'auto-gen';

const AdminCMS: React.FC = () => {
  const [view, setView] = useState<AdminView>('dashboard');
  const [blogItems, setBlogItems] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('cms_blog_posts');
    return saved ? JSON.parse(saved) : STATIC_POSTS;
  });
  
  const [currentEditItem, setCurrentEditItem] = useState<Partial<BlogPost> | null>(null);
  const [status, setStatus] = useState({ loading: false, message: '' });
  const [seoKeyword, setSeoKeyword] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);

  // Asset Studio State
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [globalLogo, setGlobalLogo] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = () => {
      const data = JSON.parse(localStorage.getItem('et_analytics') || '[]');
      setAnalyticsData(data);
    };
    fetchStats();
    const inv = setInterval(fetchStats, 5000);
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
  }, [blogItems]);

  const stats = useMemo(() => {
    const views = analyticsData.filter(e => e.type === 'view').length;
    const installs = analyticsData.filter(e => e.type === 'install').length;
    return { views, installs, posts: blogItems.length };
  }, [analyticsData, blogItems]);

  const chartData = useMemo(() => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      name: day,
      views: Math.floor(Math.random() * 500) + 100,
    }));
  }, []);

  const handleSaveArticle = () => {
    if (!currentEditItem?.title) return;
    
    const newItem: BlogPost = {
      id: currentEditItem.id || `post-${Date.now()}`,
      title: currentEditItem.title || '',
      excerpt: currentEditItem.excerpt || '',
      content: currentEditItem.content || '',
      category: currentEditItem.category || 'Guides',
      date: currentEditItem.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
      publishDate: currentEditItem.publishDate || new Date().toISOString(),
      readTime: currentEditItem.readTime || '5 min read',
      image: currentEditItem.image || '📄'
    };

    const items = [...blogItems];
    const idx = items.findIndex(i => i.id === newItem.id);
    if (idx !== -1) items[idx] = newItem;
    else items.unshift(newItem);
    
    setBlogItems(items);
    setView('articles');
    setCurrentEditItem(null);
  };

  const generateWithAI = async () => {
    if (!seoKeyword) return;
    setStatus({ loading: true, message: 'Gemini is drafting your article...' });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a senior tech blogger. Write a high-quality, SEO-optimized blog post for a Chrome Extension hub about: "${seoKeyword}". 
        Include: A catchy title, a 2-sentence excerpt, and a detailed article body in HTML format (using <h2>, <p>, <a> tags).
        Return as JSON only: { "title": "", "excerpt": "", "content": "", "category": "", "readTime": "" }`,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.7 
        }
      });

      const data = JSON.parse(response.text || '{}');
      setCurrentEditItem({
        id: `ai-${Date.now()}`,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category || 'AI Generated',
        readTime: data.readTime || '6 min read',
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
        publishDate: new Date().toISOString(),
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
      });
      setView('edit');
      setStatus({ loading: false, message: '' });
    } catch (e) {
      console.error(e);
      setStatus({ loading: false, message: 'AI Error. Please check API key.' });
    }
  };

  const deletePost = (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setBlogItems(blogItems.filter(p => p.id !== id));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900" dir="ltr">
      {/* SaaS Sidebar */}
      <aside className="w-72 bg-slate-950 text-white flex flex-col fixed h-full shadow-2xl z-50">
        <div className="p-10 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-500/20">ET</div>
            <h2 className="font-bold text-lg tracking-tight">Console</h2>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-1.5 mt-4 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Overview</p>
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>📊</span> Dashboard
          </button>
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 mt-8 px-4">Editorial</p>
          <button onClick={() => setView('articles')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${view === 'articles' || view === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>📄</span> Posts
          </button>
          <button onClick={() => setView('auto-gen')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${view === 'auto-gen' ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>🪄</span> AI Assistant
          </button>

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 mt-8 px-4">Assets</p>
          <button onClick={() => setView('asset-studio')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${view === 'asset-studio' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>🎨</span> Asset Studio
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={() => window.location.hash = '#home'} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-all py-3 border border-white/10 rounded-xl">
             <span>←</span> Exit Terminal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-72 flex-grow p-12 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-10 animate-in fade-in duration-500">
            <header>
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Command Center</h1>
              <p className="text-slate-400 font-medium">Monitoring directory performance.</p>
            </header>

            <div className="grid grid-cols-3 gap-8">
              {[
                { label: 'Total Views', val: stats.views, color: 'text-slate-900', icon: '👀' },
                { label: 'Install Clicks', val: stats.installs, color: 'text-blue-600', icon: '🚀' },
                { label: 'Published Posts', val: stats.posts, color: 'text-emerald-600', icon: '📝' }
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{s.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-black ${s.color}`}>{s.val}</span>
                    <span className="text-[10px] font-bold text-slate-400">Live</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
              <h3 className="font-black text-lg mb-8">Traffic Overview</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} />
                    <Area type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={4} fillOpacity={0.1} fill="#2563EB" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {view === 'articles' && (
          <div className="max-w-6xl animate-in fade-in duration-500">
             <header className="flex justify-between items-center mb-12">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 mb-2">Managed Posts</h1>
                   <p className="text-slate-400 font-medium">Create and publish content to your journal.</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => { setCurrentEditItem({ title: '', content: '', excerpt: '', category: 'Guides', image: '📄' }); setView('edit'); }} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs">NEW MANUALLY</button>
                   <button onClick={() => setView('auto-gen')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-500/20">AI WIZARD</button>
                </div>
             </header>

             <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="px-10 py-5">Post Detail</th>
                         <th className="px-10 py-5">Category</th>
                         <th className="px-10 py-5">Read Time</th>
                         <th className="px-10 py-5 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {blogItems.map(post => (
                        <tr key={post.id} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl">
                                    {post.image.startsWith('http') ? <img src={post.image} className="w-full h-full object-cover" /> : post.image}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-900">{post.title}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">{post.date}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">{post.category}</span>
                           </td>
                           <td className="px-10 py-6 text-xs font-bold text-slate-400 uppercase">{post.readTime}</td>
                           <td className="px-10 py-6 text-right space-x-4">
                              <button onClick={() => { setCurrentEditItem(post); setView('edit'); }} className="text-[10px] font-black text-blue-600 uppercase">Edit</button>
                              <button onClick={() => deletePost(post.id)} className="text-[10px] font-black text-red-500 uppercase">Delete</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-6 duration-700">
            <header className="flex justify-between items-center mb-12">
               <button onClick={() => setView('articles')} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">← Back to Posts</button>
               <button onClick={handleSaveArticle} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">PUBLISH CHANGES</button>
            </header>
            
            <div className="grid grid-cols-12 gap-8">
               <div className="col-span-8 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Article Title</label>
                    <input className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-3xl font-black outline-none focus:bg-white focus:ring-4 ring-blue-50 transition-all" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Body Content (HTML Editor)</label>
                    <textarea 
                      className="w-full p-8 bg-slate-50 border border-slate-100 rounded-3xl min-h-[600px] font-mono text-sm leading-relaxed outline-none focus:bg-white focus:ring-4 ring-blue-50 transition-all" 
                      value={currentEditItem.content} 
                      onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})}
                      placeholder="Write your HTML content here..."
                    />
                  </div>
               </div>
               
               <div className="col-span-4 space-y-6">
                  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata</h3>
                     <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-700 block">Category</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-700 block">Featured Image</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" value={currentEditItem.image} onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-700 block">Excerpt</label>
                        <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium text-xs h-32" value={currentEditItem.excerpt} onChange={e => setCurrentEditItem({...currentEditItem, excerpt: e.target.value})} />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-2xl mx-auto py-24 text-center animate-in slide-in-from-bottom-12 duration-700">
            <div className="w-24 h-24 bg-violet-600 text-white rounded-[32px] flex items-center justify-center text-5xl shadow-2xl mx-auto mb-12 shadow-violet-500/40">🪄</div>
            <h1 className="text-5xl font-black mb-6 tracking-tight text-slate-900">AI Writer Wizard</h1>
            <p className="text-slate-500 text-lg mb-12 leading-relaxed">Turn any keyword or idea into a professional blog post instantly using Gemini's advanced reasoning.</p>
            
            <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-2xl space-y-8">
              <input 
                className="w-full p-8 bg-slate-50 rounded-3xl text-2xl font-bold border border-slate-100 outline-none focus:ring-8 ring-violet-50 focus:bg-white transition-all text-center" 
                placeholder="What should I write about today?" 
                value={seoKeyword} 
                onChange={e => setSeoKeyword(e.target.value)} 
              />
              <button 
                onClick={generateWithAI}
                disabled={status.loading}
                className="w-full py-6 bg-violet-600 text-white rounded-3xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {status.loading ? '🧙‍♂️ WEAVING MAGIC...' : 'GENERATE FULL POST'}
              </button>
              {status.loading && (
                <div className="flex flex-col items-center gap-4 pt-4">
                   <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-xs font-black text-violet-600 uppercase tracking-widest">{status.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'asset-studio' && (
          <div className="max-w-6xl animate-in fade-in duration-500">
             <header className="mb-12 flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Asset Studio</h1>
                  <p className="text-slate-400 font-medium">Create promotional graphics for your items.</p>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all">UPLOAD SOURCE</button>
             </header>
             
             <div className="grid grid-cols-12 gap-10">
                <div className="col-span-8 bg-white p-4 rounded-[40px] border border-slate-100 shadow-sm relative aspect-video flex items-center justify-center overflow-hidden">
                   {batch.length > 0 ? (
                     <img src={batch[0].originalImage} className="w-full h-full object-contain" />
                   ) : (
                     <div className="text-center text-slate-300 font-black uppercase tracking-widest text-sm flex flex-col gap-4">
                        <span className="text-6xl">📥</span>
                        Drop your screenshot here
                     </div>
                   )}
                </div>
                
                <div className="col-span-4 space-y-6">
                   <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</h3>
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-700 block">Headline Text</label>
                        <input type="text" className="w-full p-4 bg-slate-50 rounded-xl font-bold" placeholder="Top Extensions..." />
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-700 block">Brand Logo</label>
                        <button className="w-full py-6 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">SELECT BRANDING</button>
                      </div>
                      <button className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-500/20">EXPORT RENDER</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => {
         const f = e.target.files?.[0];
         if (f) {
           const reader = new FileReader();
           reader.onload = (ev) => {
             const base64 = ev.target?.result as string;
             setBatch([{ id: '1', originalImage: base64, aiAnalysis: null, manualFocalPoint: null, status: 'ready' }]);
           };
           reader.readAsDataURL(f);
         }
      }} />
    </div>
  );
};

export default AdminCMS;
