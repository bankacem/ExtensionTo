
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
  Bar
} from 'recharts';
import BatchStudio from './BatchStudio';

type AdminTab = 'overview' | 'store' | 'blog' | 'editor-blog' | 'editor-store' | 'studio' | 'settings';

const AdminCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // Data State
  const [blogItems, setBlogItems] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('cms_blog_posts');
    return saved ? JSON.parse(saved) : STATIC_POSTS;
  });

  const [extensions, setExtensions] = useState<Extension[]>(() => {
    const saved = localStorage.getItem('cms_extensions');
    return saved ? JSON.parse(saved) : STATIC_EXTENSIONS;
  });
  
  const [currentEditPost, setCurrentEditPost] = useState<Partial<BlogPost> | null>(null);
  const [currentEditStore, setCurrentEditStore] = useState<Partial<Extension> | null>(null);
  
  const [aiStatus, setAiStatus] = useState({ loading: false, message: '' });
  const [analytics, setAnalytics] = useState<any[]>([]);
  
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('et_site_settings');
    return saved ? JSON.parse(saved) : {
      siteName: 'ExtensionTo',
      description: 'The ultimate directory for browser extensions.',
      contactEmail: 'contact@extensionto.com',
      gaId: 'G-XXXXXXXXXX'
    };
  });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('et_analytics') || '[]');
    setAnalytics(data);
    localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
    localStorage.setItem('cms_extensions', JSON.stringify(extensions));
    localStorage.setItem('et_site_settings', JSON.stringify(siteSettings));
  }, [blogItems, extensions, siteSettings]);

  const stats = useMemo(() => ({
    views: analytics.filter(e => e.type === 'view').length,
    installs: analytics.filter(e => e.type === 'install').length,
    postsCount: blogItems.length,
    extensionsCount: extensions.length,
    clicks: analytics.filter(e => e.type === 'click').length
  }), [analytics, blogItems, extensions]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => ({ 
      name: day, 
      views: Math.floor(Math.random() * 800) + 200, 
      installs: Math.floor(Math.random() * 100) 
    }));
  }, []);

  // Post Handlers
  const handleSavePost = () => {
    if (!currentEditPost?.title) return;
    const newItem: BlogPost = {
      id: currentEditPost.id || `post-${Date.now()}`,
      title: currentEditPost.title || '',
      excerpt: currentEditPost.excerpt || '',
      content: currentEditPost.content || '',
      category: currentEditPost.category || 'Guides',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
      publishDate: new Date().toISOString(),
      readTime: '5 min read',
      image: currentEditPost.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
    };
    const updated = [...blogItems];
    const index = updated.findIndex(p => p.id === newItem.id);
    if (index !== -1) updated[index] = newItem;
    else updated.unshift(newItem);
    setBlogItems(updated);
    setActiveTab('blog');
  };

  // Store Handlers
  const handleSaveExtension = () => {
    if (!currentEditStore?.name) return;
    const newItem: Extension = {
      id: currentEditStore.id || `ext-${Date.now()}`,
      name: currentEditStore.name || '',
      shortDescription: currentEditStore.shortDescription || '',
      longDescription: currentEditStore.longDescription || '',
      icon: currentEditStore.icon || '🛠️',
      rating: currentEditStore.rating || 5.0,
      users: currentEditStore.users || '0',
      category: currentEditStore.category || 'Utility',
      features: currentEditStore.features || [],
      version: currentEditStore.version || '1.0.0',
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      size: currentEditStore.size || '1.0MB',
      storeUrl: currentEditStore.storeUrl || '#'
    };
    const updated = [...extensions];
    const index = updated.findIndex(e => e.id === newItem.id);
    if (index !== -1) updated[index] = newItem;
    else updated.unshift(newItem);
    setExtensions(updated);
    setActiveTab('store');
  };

  const generatePostWithAI = async () => {
    if (!currentEditPost?.title) return;
    setAiStatus({ loading: true, message: 'Gemini is drafting your content...' });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a professional tech post about: "${currentEditPost.title}". Return valid JSON: { "excerpt": "summary", "content": "html", "category": "Security" }`,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      setCurrentEditPost(prev => ({ ...prev, ...result }));
      setAiStatus({ loading: false, message: 'AI Draft Generated!' });
    } catch (e) {
      setAiStatus({ loading: false, message: 'AI Error. Check connection.' });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30" dir="ltr">
      {/* Sidebar - The Backbone of the Admin */}
      <aside className="w-72 bg-[#0F172A] flex flex-col fixed h-full border-r border-white/5 z-50 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">ET</div>
          <div>
            <span className="font-black text-lg block leading-none">Command</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Center v2.0</span>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-1.5 mt-4 overflow-y-auto">
          <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Core Management</p>
          {[
            { id: 'overview', label: 'Dashboard', icon: '💎' },
            { id: 'store', label: 'Store Manager', icon: '🛍️' },
            { id: 'blog', label: 'Content Engine', icon: '📝' },
            { id: 'studio', label: 'Asset Studio', icon: '🎬' },
            { id: 'settings', label: 'Site Config', icon: '⚙️' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)} 
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-xl">{tab.icon}</span> {tab.label}
            </button>
          ))}

          <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
             <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Quick Actions</p>
             <button onClick={() => { setCurrentEditStore({ name: '', features: [] }); setActiveTab('editor-store'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-xs font-black uppercase tracking-wider">
                <span>+</span> Add Extension
             </button>
             <button onClick={() => { setCurrentEditPost({ title: '', content: '' }); setActiveTab('editor-blog'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all text-xs font-black uppercase tracking-wider">
                <span>+</span> New Journal Post
             </button>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button onClick={() => window.location.hash = '#home'} className="w-full text-[10px] font-black text-slate-500 hover:text-white transition-all py-4 border border-white/10 rounded-2xl flex items-center justify-center gap-3 tracking-[0.2em] group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> LIVE PREVIEW SITE
          </button>
        </div>
      </aside>

      {/* Workspace */}
      <main className="ml-72 flex-grow p-12 overflow-y-auto bg-gradient-to-b from-[#0F172A] to-[#020617]">
        {activeTab === 'overview' && (
          <div className="max-w-7xl space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-6xl font-black tracking-tighter mb-4 text-white">Platform Health</h1>
                <p className="text-slate-400 text-xl font-medium">Overview of your extension hub ecosystem.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center gap-4">
                   <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Database Connected</span>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-5 gap-6">
              {[
                { label: 'Total Visits', value: stats.views, icon: '👁️', color: 'from-blue-600 to-indigo-600' },
                { label: 'Extensions', value: stats.extensionsCount, icon: '📦', color: 'from-emerald-500 to-teal-600' },
                { label: 'Journal Posts', value: stats.postsCount, icon: '📄', color: 'from-amber-500 to-orange-600' },
                { label: 'Installs', value: stats.installs, icon: '🚀', color: 'from-purple-500 to-pink-600' },
                { label: 'Engagement', value: `${((stats.clicks / (stats.views || 1)) * 100).toFixed(1)}%`, icon: '🔥', color: 'from-rose-500 to-red-600' }
              ].map((s, i) => (
                <div key={i} className="bg-[#1E293B] p-8 rounded-[40px] border border-white/5 shadow-lg group hover:scale-[1.02] transition-all">
                  <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center text-xl mb-6 shadow-xl`}>{s.icon}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</div>
                  <div className="text-4xl font-black text-white tracking-tighter">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 bg-[#1E293B] p-10 rounded-[48px] border border-white/5 shadow-2xl">
                <h3 className="font-black text-xl mb-10 text-slate-300 flex items-center gap-3">
                  <span className="w-2 h-8 bg-indigo-500 rounded-full"></span> Traffic Velocity
                </h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFFFFF05" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px', fontWeight: 'bold', fill: '#64748B'}} />
                      <YAxis hide />
                      <Tooltip contentStyle={{background: '#0F172A', border: '1px solid #334155', borderRadius: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'}} />
                      <Area type="monotone" dataKey="views" stroke="#6366F1" strokeWidth={5} fill="url(#chartGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#1E293B] p-10 rounded-[48px] border border-white/5">
                <h3 className="font-black text-xl mb-10 text-slate-300">Conversions</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <Bar dataKey="installs" fill="#10B981" radius={[10, 10, 0, 0]} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 p-6 bg-black/20 rounded-[32px] border border-white/5">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Top Performer</p>
                   <p className="font-bold text-emerald-400">uBlock Origin (+12% installs)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="max-w-7xl animate-in slide-in-from-right-12 duration-500">
             <header className="flex justify-between items-center mb-16">
               <div>
                <h1 className="text-5xl font-black tracking-tight text-white mb-4">Store Inventory</h1>
                <p className="text-slate-400 text-lg font-medium">Manage all browser extensions listed on your platform.</p>
               </div>
               <button onClick={() => { setCurrentEditStore({ name: '', features: [], category: 'Utility', icon: '🛠️' }); setActiveTab('editor-store'); }} className="px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm shadow-2xl hover:bg-indigo-700 transition-all">
                  ADD NEW EXTENSION
               </button>
             </header>

             <div className="bg-[#1E293B] rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
               <table className="w-full text-left">
                 <thead className="bg-white/5">
                   <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em]">
                     <th className="px-12 py-8">Extension Info</th>
                     <th className="px-12 py-8">Metrics</th>
                     <th className="px-12 py-8">Category</th>
                     <th className="px-12 py-8 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {extensions.map(ext => (
                     <tr key={ext.id} className="group hover:bg-white/[0.02] transition-colors">
                       <td className="px-12 py-8">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-4xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
                              {ext.icon}
                            </div>
                            <div>
                               <div className="font-black text-white text-xl group-hover:text-indigo-400 transition-colors">{ext.name}</div>
                               <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tighter">v{ext.version} • {ext.size}</div>
                            </div>
                         </div>
                       </td>
                       <td className="px-12 py-8">
                          <div className="flex items-center gap-4">
                             <div>
                               <div className="text-[10px] font-black text-slate-600 uppercase">Rating</div>
                               <div className="font-bold text-slate-200">{ext.rating} ★</div>
                             </div>
                             <div className="w-px h-8 bg-white/5"></div>
                             <div>
                               <div className="text-[10px] font-black text-slate-600 uppercase">Users</div>
                               <div className="font-bold text-slate-200">{ext.users}</div>
                             </div>
                          </div>
                       </td>
                       <td className="px-12 py-8">
                          <span className="px-5 py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-full border border-indigo-500/20">{ext.category}</span>
                       </td>
                       <td className="px-12 py-8 text-right space-x-6">
                         <button onClick={() => { setCurrentEditStore(ext); setActiveTab('editor-store'); }} className="text-xs font-black text-indigo-400 uppercase hover:text-white transition-colors">Modify</button>
                         <button onClick={() => setExtensions(extensions.filter(e => e.id !== ext.id))} className="text-xs font-black text-rose-500 uppercase hover:text-white transition-colors">Archive</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="max-w-7xl animate-in slide-in-from-right-12 duration-500">
             <header className="flex justify-between items-center mb-16">
               <div>
                <h1 className="text-5xl font-black tracking-tight text-white mb-4">Content Library</h1>
                <p className="text-slate-400 text-lg font-medium">Manage your journal articles and SEO guides.</p>
               </div>
               <button onClick={() => { setCurrentEditPost({ title: '', content: '' }); setActiveTab('editor-blog'); }} className="px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-2xl hover:bg-blue-700 transition-all">
                  WRITE NEW POST
               </button>
             </header>

             <div className="grid grid-cols-2 gap-8">
                {blogItems.map(post => (
                  <div key={post.id} className="bg-[#1E293B] p-8 rounded-[48px] border border-white/5 flex gap-8 group hover:border-indigo-500/30 transition-all">
                     <div className="w-32 h-32 rounded-3xl bg-slate-800 overflow-hidden flex-shrink-0">
                        {post.image.startsWith('http') ? <img src={post.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl">{post.image}</div>}
                     </div>
                     <div className="flex flex-col justify-between">
                        <div>
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{post.category}</span>
                           <h3 className="text-xl font-black text-white mt-2 leading-tight group-hover:text-indigo-400 transition-colors">{post.title}</h3>
                        </div>
                        <div className="flex justify-between items-center mt-6">
                           <span className="text-[10px] font-bold text-slate-500 uppercase">{post.date}</span>
                           <div className="flex gap-4">
                              <button onClick={() => { setCurrentEditPost(post); setActiveTab('editor-blog'); }} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Edit</button>
                              <button onClick={() => setBlogItems(blogItems.filter(p => p.id !== post.id))} className="text-[10px] font-black text-rose-500 hover:text-white uppercase tracking-widest">Trash</button>
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'editor-store' && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-12 duration-500">
             <header className="flex justify-between items-center mb-12">
               <button onClick={() => setActiveTab('store')} className="text-sm font-black text-slate-500 hover:text-white flex items-center gap-2 group transition-colors">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK TO STORE LIST
               </button>
               <button onClick={handleSaveExtension} className="px-12 py-5 bg-emerald-600 text-white rounded-[24px] font-black text-sm shadow-2xl hover:bg-emerald-700 transition-all">
                  SAVE EXTENSION
               </button>
             </header>

             <div className="bg-[#1E293B] p-16 rounded-[64px] border border-white/5 grid grid-cols-2 gap-12">
                <div className="space-y-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Extension Name</label>
                      <input className="w-full bg-white/5 p-6 rounded-[32px] border border-white/5 font-black text-3xl outline-none focus:ring-4 ring-indigo-500/20" value={currentEditStore?.name} onChange={e => setCurrentEditStore({...currentEditStore, name: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Icon (Emoji or SVG)</label>
                        <input className="w-full bg-white/5 p-6 rounded-[24px] border border-white/5 font-bold text-center text-4xl" value={currentEditStore?.icon} onChange={e => setCurrentEditStore({...currentEditStore, icon: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Category</label>
                        <input className="w-full bg-white/5 p-6 rounded-[24px] border border-white/5 font-bold" value={currentEditStore?.category} onChange={e => setCurrentEditStore({...currentEditStore, category: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Short Tagline</label>
                      <input className="w-full bg-white/5 p-6 rounded-[24px] border border-white/5 font-bold text-slate-400" value={currentEditStore?.shortDescription} onChange={e => setCurrentEditStore({...currentEditStore, shortDescription: e.target.value})} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Chrome Store URL</label>
                      <input className="w-full bg-white/5 p-6 rounded-[24px] border border-white/5 font-bold text-indigo-400" value={currentEditStore?.storeUrl} onChange={e => setCurrentEditStore({...currentEditStore, storeUrl: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Detailed Description</label>
                      <textarea className="w-full h-80 bg-white/5 p-8 rounded-[40px] border border-white/5 font-medium leading-relaxed outline-none" value={currentEditStore?.longDescription} onChange={e => setCurrentEditStore({...currentEditStore, longDescription: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-4 text-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Users</label>
                        <input className="w-full bg-white/5 p-4 rounded-2xl border border-white/5 text-center font-bold" value={currentEditStore?.users} onChange={e => setCurrentEditStore({...currentEditStore, users: e.target.value})} />
                      </div>
                      <div className="space-y-4 text-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Rating</label>
                        <input type="number" step="0.1" className="w-full bg-white/5 p-4 rounded-2xl border border-white/5 text-center font-bold" value={currentEditStore?.rating} onChange={e => setCurrentEditStore({...currentEditStore, rating: parseFloat(e.target.value)})} />
                      </div>
                      <div className="space-y-4 text-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Version</label>
                        <input className="w-full bg-white/5 p-4 rounded-2xl border border-white/5 text-center font-bold" value={currentEditStore?.version} onChange={e => setCurrentEditStore({...currentEditStore, version: e.target.value})} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'editor-blog' && (
          <div className="max-w-7xl animate-in slide-in-from-bottom-12 duration-700">
             <header className="flex justify-between items-center mb-16">
               <button onClick={() => setActiveTab('blog')} className="text-sm font-black text-slate-500 hover:text-white flex items-center gap-2 group transition-colors">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK TO LIBRARY
               </button>
               <div className="flex gap-6">
                 <button onClick={generatePostWithAI} disabled={aiStatus.loading || !currentEditPost?.title} className="px-8 py-5 bg-violet-600 text-white rounded-[24px] font-black text-xs shadow-xl shadow-violet-600/20 flex items-center gap-4 hover:scale-105 transition-all">
                   {aiStatus.loading ? (
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   ) : '🧙‍♂️'} {aiStatus.loading ? 'AI IS DRAFTING...' : 'AI ASSISTANT'}
                 </button>
                 <button onClick={handleSavePost} className="px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm shadow-2xl hover:bg-indigo-700 transition-all">
                  SAVE & PUBLISH
                 </button>
               </div>
             </header>

             {aiStatus.message && (
               <div className="mb-10 p-6 bg-indigo-500/10 text-indigo-400 rounded-[32px] text-xs font-black border border-indigo-500/20 flex items-center gap-4">
                 <span className="text-xl">✨</span> {aiStatus.message}
               </div>
             )}

             <div className="grid grid-cols-12 gap-10">
                <div className="col-span-8 bg-[#1E293B] p-16 rounded-[64px] border border-white/5 min-h-[800px] space-y-12">
                   <input placeholder="Headline..." className="w-full bg-transparent text-6xl font-black outline-none placeholder:text-slate-800 text-white tracking-tighter" value={currentEditPost?.title} onChange={e => setCurrentEditPost({...currentEditPost, title: e.target.value})} />
                   <div className="h-px bg-white/5 w-full"></div>
                   <textarea placeholder="Start writing (HTML supported)..." className="w-full h-[600px] bg-transparent text-xl font-medium leading-[1.8] outline-none resize-none text-slate-300" value={currentEditPost?.content} onChange={e => setCurrentEditPost({...currentEditPost, content: e.target.value})} />
                </div>
                <div className="col-span-4 space-y-8">
                   <div className="bg-[#1E293B] p-12 rounded-[48px] border border-white/5 space-y-10 sticky top-12 shadow-2xl">
                      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-6">Post Settings</h3>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Category</label>
                        <input className="w-full bg-white/5 p-5 rounded-2xl border border-white/10 font-bold" value={currentEditPost?.category} onChange={e => setCurrentEditPost({...currentEditPost, category: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Banner URL</label>
                        <input className="w-full bg-white/5 p-5 rounded-2xl border border-white/10 font-bold" value={currentEditPost?.image} onChange={e => setCurrentEditPost({...currentEditPost, image: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">SEO Snippet</label>
                        <textarea className="w-full bg-white/5 p-5 rounded-2xl border border-white/10 h-32 font-medium text-xs" value={currentEditPost?.excerpt} onChange={e => setCurrentEditPost({...currentEditPost, excerpt: e.target.value})} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'studio' && (
           <div className="max-w-7xl animate-in fade-in duration-500">
              <header className="mb-12">
                <h1 className="text-5xl font-black tracking-tight text-white mb-4">Batch Studio</h1>
                <p className="text-slate-400 text-lg font-medium">Bulk asset generation for Chrome Store & Marketing.</p>
              </header>
              <div className="bg-[#1E293B] rounded-[64px] border border-white/5 overflow-hidden shadow-2xl">
                <BatchStudio />
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl animate-in slide-in-from-right-12 duration-500">
             <h1 className="text-5xl font-black tracking-tight text-white mb-12">Global Site Config</h1>
             <div className="bg-[#1E293B] p-16 rounded-[64px] border border-white/5 space-y-10 shadow-2xl">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Site Name</label>
                    <input className="w-full bg-white/5 p-6 rounded-3xl border border-white/10 font-black" value={siteSettings.siteName} onChange={e => setSiteSettings({...siteSettings, siteName: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Support Email</label>
                    <input className="w-full bg-white/5 p-6 rounded-3xl border border-white/10 font-bold" value={siteSettings.contactEmail} onChange={e => setSiteSettings({...siteSettings, contactEmail: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Site Description (Meta)</label>
                  <textarea className="w-full bg-white/5 p-6 rounded-3xl border border-white/10 h-32 font-medium" value={siteSettings.description} onChange={e => setSiteSettings({...siteSettings, description: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Google Analytics 4 ID</label>
                  <input className="w-full bg-white/5 p-6 rounded-3xl border border-white/10 font-bold" value={siteSettings.gaId} onChange={e => setSiteSettings({...siteSettings, gaId: e.target.value})} />
                </div>
                <button className="w-full py-6 bg-indigo-600 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95" onClick={() => alert('Configuration Synchronized!')}>
                  SAVE & UPDATE ENGINE
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
