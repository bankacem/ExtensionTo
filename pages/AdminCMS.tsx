
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost } from '../types';
import { BLOG_POSTS as STATIC_POSTS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

type AdminView = 'dashboard' | 'articles' | 'write';

const AdminCMS: React.FC = () => {
  const [view, setView] = useState<AdminView>('dashboard');
  const [blogItems, setBlogItems] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('cms_blog_posts');
    return saved ? JSON.parse(saved) : STATIC_POSTS;
  });
  
  const [currentEditItem, setCurrentEditItem] = useState<Partial<BlogPost> | null>(null);
  const [aiStatus, setAiStatus] = useState({ loading: false, message: '' });
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('et_analytics') || '[]');
    setAnalytics(data);
    localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
  }, [blogItems]);

  const stats = useMemo(() => ({
    views: analytics.filter(e => e.type === 'view').length,
    installs: analytics.filter(e => e.type === 'install').length,
    posts: blogItems.length
  }), [analytics, blogItems]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => ({ name: day, views: Math.floor(Math.random() * 500) + 100 }));
  }, []);

  const handleSave = () => {
    if (!currentEditItem?.title) {
        alert("Please enter a title first.");
        return;
    }
    const newItem: BlogPost = {
      id: currentEditItem.id || `post-${Date.now()}`,
      title: currentEditItem.title || '',
      excerpt: currentEditItem.excerpt || '',
      content: currentEditItem.content || '',
      category: currentEditItem.category || 'Guides',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
      publishDate: new Date().toISOString(),
      readTime: '5 min read',
      image: currentEditItem.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
    };

    const updated = [...blogItems];
    const index = updated.findIndex(p => p.id === newItem.id);
    if (index !== -1) updated[index] = newItem;
    else updated.unshift(newItem);

    setBlogItems(updated);
    setView('articles');
    alert("Article Published Successfully!");
  };

  const generateWithGemini = async () => {
    if (!currentEditItem?.title) {
        alert("Enter a topic in the title field first!");
        return;
    }
    setAiStatus({ loading: true, message: 'Gemini is researching and writing your post...' });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Write a high-quality, professional tech blog post for a Chrome Extension hub about: "${currentEditItem.title}". 
        The post must be in valid HTML format (use <h2>, <p>, <ul>, <li>). 
        Make it SEO friendly. 
        Return ONLY a JSON object: { "excerpt": "brief summary", "content": "html body content", "category": "Security/Productivity/Guides" }`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setCurrentEditItem(prev => ({
        ...prev,
        excerpt: result.excerpt,
        content: result.content,
        category: result.category
      }));
      setAiStatus({ loading: false, message: 'Article drafted successfully!' });
    } catch (e) {
      console.error(e);
      setAiStatus({ loading: false, message: 'AI failed. Check connection or API key.' });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100" dir="ltr">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col fixed h-full z-50">
        <div className="p-10 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-500/30">CMS</div>
          <span className="font-bold text-xl tracking-tight">Publisher</span>
        </div>
        
        <nav className="flex-grow p-6 space-y-2 mt-4">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <span className="text-xl">📊</span> Dashboard
          </button>
          <button onClick={() => setView('articles')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'articles' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <span className="text-xl">📄</span> Content Library
          </button>
          <button onClick={() => { setCurrentEditItem({ title: '', content: '', category: 'Guides', image: '' }); setView('write'); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'write' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <span className="text-xl">✍️</span> Create Post
          </button>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={() => window.location.hash = '#home'} className="w-full text-xs font-black text-slate-500 hover:text-white transition-all py-4 border border-white/10 rounded-2xl flex items-center justify-center gap-2">
            <span>←</span> EXIT TO MAIN SITE
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-grow p-16 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-12 animate-in fade-in duration-700">
            <header>
              <h1 className="text-5xl font-black tracking-tighter mb-4">Command Center</h1>
              <p className="text-slate-400 text-lg font-medium">Control your publishing empire from one screen.</p>
            </header>

            <div className="grid grid-cols-3 gap-10">
              {[
                { label: 'Site Visits', value: stats.views, icon: '👁️', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Conversion Rate', value: stats.installs, icon: '📈', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Total Articles', value: stats.posts, icon: '📑', color: 'text-slate-900', bg: 'bg-slate-50' }
              ].map((s, i) => (
                <div key={i} className={`p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all bg-white group`}>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                    <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center text-xl`}>{s.icon}</div>
                  </div>
                  <div className={`text-5xl font-black tracking-tighter ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm">
              <h3 className="font-black text-xl mb-10">Performance Analytics</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} style={{fontSize: '11px', fontWeight: 'bold', fill: '#94A3B8'}} />
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={5} fillOpacity={1} fill="url(#colorViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {view === 'articles' && (
          <div className="max-w-6xl animate-in fade-in duration-500">
            <header className="flex justify-between items-end mb-16">
              <div>
                <h1 className="text-5xl font-black tracking-tighter mb-4">Journal Archive</h1>
                <p className="text-slate-400 font-medium">Manage and optimize your published content.</p>
              </div>
              <button onClick={() => { setCurrentEditItem({ title: '', content: '', category: 'Guides' }); setView('write'); }} className="px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all">
                WRITE NEW ARTICLE
              </button>
            </header>

            <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-12 py-7">Content Detail</th>
                    <th className="px-12 py-7">Tag</th>
                    <th className="px-12 py-7">Published</th>
                    <th className="px-12 py-7 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {blogItems.map(post => (
                    <tr key={post.id} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="px-12 py-8">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-slate-100 flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                            {post.image.startsWith('http') ? <img src={post.image} className="w-full h-full object-cover" /> : post.image}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-lg">{post.title}</span>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">{post.readTime} • {post.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-8">
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full border border-blue-100">{post.category}</span>
                      </td>
                      <td className="px-12 py-8 text-xs font-black text-slate-400 uppercase tracking-widest">{post.date}</td>
                      <td className="px-12 py-8 text-right space-x-6">
                        <button onClick={() => { setCurrentEditItem(post); setView('write'); }} className="text-xs font-black text-blue-600 uppercase hover:underline">Edit</button>
                        <button onClick={() => { if(confirm('Delete?')) setBlogItems(blogItems.filter(p => p.id !== post.id)); }} className="text-xs font-black text-red-500 uppercase hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'write' && (
          <div className="max-w-7xl mx-auto animate-in slide-in-from-bottom-12 duration-700">
            <header className="flex justify-between items-center mb-16">
              <button onClick={() => setView('articles')} className="text-sm font-black text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK TO LIBRARY
              </button>
              <div className="flex gap-6">
                <button 
                    onClick={generateWithGemini} 
                    disabled={aiStatus.loading || !currentEditItem?.title} 
                    className="px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-3 hover:scale-105 transition-all"
                >
                  {aiStatus.loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : '🪄'} {aiStatus.loading ? 'AI IS DRAFTING...' : 'AI ASSISTANT'}
                </button>
                <button onClick={handleSave} className="px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95">
                  SAVE & PUBLISH
                </button>
              </div>
            </header>

            {aiStatus.message && (
              <div className="mb-10 p-6 bg-indigo-50 text-indigo-700 rounded-[32px] text-xs font-black border border-indigo-100 flex items-center gap-4 animate-in slide-in-from-top-4">
                <span className="text-xl">✨</span> {aiStatus.message}
              </div>
            )}

            <div className="grid grid-cols-12 gap-12">
              <div className="col-span-8 space-y-10">
                <div className="bg-white p-16 rounded-[64px] border border-slate-100 shadow-sm space-y-12 min-h-[900px]">
                  <input 
                    placeholder="Article Headline..." 
                    className="w-full text-6xl font-black tracking-tighter outline-none placeholder:text-slate-100 bg-transparent"
                    value={currentEditItem?.title}
                    onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})}
                  />
                  <div className="h-px bg-slate-100 w-full"></div>
                  <textarea 
                    placeholder="Start your story... (HTML editor supported)" 
                    className="w-full min-h-[700px] text-xl font-medium leading-[1.8] outline-none placeholder:text-slate-100 resize-none bg-transparent"
                    value={currentEditItem?.content}
                    onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})}
                  />
                </div>
              </div>

              <div className="col-span-4 space-y-10">
                <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm space-y-10 sticky top-12">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-6">Post Meta</h3>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-1">Content Category</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-sm focus:bg-white focus:ring-4 ring-blue-50 transition-all outline-none" value={currentEditItem?.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-1">Featured Image URL</label>
                    <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-sm focus:bg-white focus:ring-4 ring-blue-50 transition-all outline-none" value={currentEditItem?.image} onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-1">Search Excerpt</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[20px] font-medium text-xs h-40 resize-none focus:bg-white focus:ring-4 ring-blue-50 transition-all outline-none" value={currentEditItem?.excerpt} onChange={e => setCurrentEditItem({...currentEditItem, excerpt: e.target.value})} />
                  </div>

                  <div className="pt-6">
                    <div className="p-8 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-500/20">
                      <h4 className="font-black text-lg mb-2">Editor's Helper</h4>
                      <p className="text-blue-100 text-xs font-medium leading-relaxed opacity-90">Type a title like "Best Security Tips" and use the AI Wizard to write the full post for you instantly.</p>
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
