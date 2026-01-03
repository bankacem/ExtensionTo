
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, BatchItem } from '../types';
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
import BatchStudio from './BatchStudio';

type AdminTab = 'overview' | 'blog' | 'editor' | 'studio' | 'settings';

const AdminCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [blogItems, setBlogItems] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('cms_blog_posts');
    return saved ? JSON.parse(saved) : STATIC_POSTS;
  });
  
  const [currentEditItem, setCurrentEditItem] = useState<Partial<BlogPost> | null>(null);
  const [aiStatus, setAiStatus] = useState({ loading: false, message: '' });
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('et_site_settings');
    return saved ? JSON.parse(saved) : {
      siteName: 'ExtensionTo',
      description: 'The ultimate directory for browser extensions.',
      contactEmail: 'contact@extensionto.com'
    };
  });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('et_analytics') || '[]');
    setAnalytics(data);
    localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
    localStorage.setItem('et_site_settings', JSON.stringify(siteSettings));
  }, [blogItems, siteSettings]);

  const stats = useMemo(() => ({
    views: analytics.filter(e => e.type === 'view').length,
    installs: analytics.filter(e => e.type === 'install').length,
    posts: blogItems.length,
    clicks: analytics.filter(e => e.type === 'click').length
  }), [analytics, blogItems]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => ({ name: day, views: Math.floor(Math.random() * 400) + 100, installs: Math.floor(Math.random() * 50) }));
  }, []);

  const handleSavePost = () => {
    if (!currentEditItem?.title) return;
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
    setActiveTab('blog');
  };

  const generateWithGemini = async () => {
    if (!currentEditItem?.title) return;
    setAiStatus({ loading: true, message: 'Gemini is drafting your content...' });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a professional tech post about: "${currentEditItem.title}". Return JSON: { "excerpt": "summary", "content": "html", "category": "Security" }`,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      setCurrentEditItem(prev => ({ ...prev, ...result }));
      setAiStatus({ loading: false, message: 'Draft ready!' });
    } catch (e) {
      setAiStatus({ loading: false, message: 'AI Error. Check key.' });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0F172A] text-white font-sans selection:bg-blue-500/30" dir="ltr">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-[#1E293B] flex flex-col fixed h-full border-r border-white/5 z-50">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-500/20">ET</div>
          <span className="font-bold text-lg tracking-tight">Main Admin</span>
        </div>
        
        <nav className="flex-grow p-6 space-y-1 mt-4">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'blog', label: 'Journal Manager', icon: '📄' },
            { id: 'studio', label: 'Batch Studio', icon: '📸' },
            { id: 'settings', label: 'Site Settings', icon: '⚙️' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-lg">{tab.icon}</span> {tab.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-white/5">
             <button onClick={() => { setCurrentEditItem({ title: '', content: '' }); setActiveTab('editor'); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white/5 text-blue-400 hover:bg-blue-600 hover:text-white transition-all font-bold text-xs uppercase tracking-widest">
                <span>+</span> New Article
             </button>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={() => window.location.hash = '#home'} className="w-full text-[10px] font-black text-slate-500 hover:text-white transition-all py-3 border border-white/10 rounded-xl flex items-center justify-center gap-2 tracking-[0.2em]">
            EXIT TO LIVE SITE
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="ml-72 flex-grow p-12 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="max-w-6xl space-y-12 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">Platform Status</h1>
                <p className="text-slate-400 font-medium">Monitoring site-wide engagement and content health.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/20">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> SYSTEM ONLINE
              </div>
            </header>

            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Views', value: stats.views, icon: '👁️', color: 'text-blue-400' },
                { label: 'Installs', value: stats.installs, icon: '🚀', color: 'text-emerald-400' },
                { label: 'Engagement', value: stats.clicks, icon: '🔥', color: 'text-orange-400' },
                { label: 'Content', value: stats.posts, icon: '📄', color: 'text-purple-400' }
              ].map((s, i) => (
                <div key={i} className="bg-[#1E293B] p-8 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</div>
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#1E293B] p-10 rounded-[40px] border border-white/5 shadow-2xl">
              <h3 className="font-bold text-lg mb-8 text-slate-300">Traffic Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFFFFF05" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px', fill: '#64748B'}} />
                    <YAxis hide />
                    <Tooltip contentStyle={{background: '#1E293B', border: '1px solid #334155', borderRadius: '12px'}} />
                    <Area type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={4} fill="url(#chartGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="max-w-6xl animate-in fade-in duration-500">
             <header className="flex justify-between items-center mb-12">
               <h1 className="text-4xl font-black tracking-tight">Content Inventory</h1>
               <button onClick={() => { setCurrentEditItem({ title: '', content: '' }); setActiveTab('editor'); }} className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg hover:scale-105 transition-all">
                  WRITE NEW ARTICLE
               </button>
             </header>

             <div className="bg-[#1E293B] rounded-[32px] border border-white/5 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-white/5">
                   <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                     <th className="px-10 py-6">Article</th>
                     <th className="px-10 py-6">Category</th>
                     <th className="px-10 py-6 text-right">Settings</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {blogItems.map(post => (
                     <tr key={post.id} className="hover:bg-white/5 transition-colors">
                       <td className="px-10 py-6 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center text-xl">
                            {post.image.startsWith('http') ? <img src={post.image} className="w-full h-full object-cover" /> : post.image}
                         </div>
                         <span className="font-bold text-slate-300">{post.title}</span>
                       </td>
                       <td className="px-10 py-6">
                         <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase rounded-full border border-blue-500/20">{post.category}</span>
                       </td>
                       <td className="px-10 py-6 text-right space-x-4">
                         <button onClick={() => { setCurrentEditItem(post); setActiveTab('editor'); }} className="text-xs font-black text-blue-400 uppercase hover:underline">Edit</button>
                         <button onClick={() => setBlogItems(blogItems.filter(p => p.id !== post.id))} className="text-xs font-black text-red-400 uppercase hover:underline">Delete</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-8 duration-500">
             <header className="flex justify-between items-center mb-10">
               <button onClick={() => setActiveTab('blog')} className="text-xs font-black text-slate-500 hover:text-white transition-colors">← CANCEL EDITING</button>
               <div className="flex gap-4">
                 <button onClick={generateWithGemini} disabled={aiStatus.loading || !currentEditItem?.title} className="px-6 py-3 bg-violet-600 rounded-xl text-[10px] font-black flex items-center gap-2">
                   {aiStatus.loading ? '🧙‍♂️ WRITING...' : '🪄 GEMINI ASSIST'}
                 </button>
                 <button onClick={handleSavePost} className="px-10 py-3 bg-blue-600 rounded-xl text-[10px] font-black">
                   PUBLISH POST
                 </button>
               </div>
             </header>

             <div className="grid grid-cols-12 gap-8">
               <div className="col-span-8 space-y-6">
                 <input 
                   placeholder="Headline..." 
                   className="w-full bg-transparent text-5xl font-black outline-none placeholder:text-slate-800"
                   value={currentEditItem?.title}
                   onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})}
                 />
                 <textarea 
                   placeholder="Write content (HTML supported)..." 
                   className="w-full h-[600px] bg-white/5 rounded-[32px] p-10 text-lg font-medium outline-none resize-none"
                   value={currentEditItem?.content}
                   onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})}
                 />
               </div>
               <div className="col-span-4 space-y-6">
                  <div className="bg-[#1E293B] p-8 rounded-[32px] border border-white/5 space-y-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Post Metadata</h3>
                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-xs" placeholder="Category" value={currentEditItem?.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-xs" placeholder="Image URL" value={currentEditItem?.image} onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} />
                    <textarea className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-xs h-32" placeholder="SEO Excerpt" value={currentEditItem?.excerpt} onChange={e => setCurrentEditItem({...currentEditItem, excerpt: e.target.value})} />
                  </div>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'studio' && (
           <div className="max-w-7xl animate-in fade-in duration-500">
              <header className="mb-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">Batch Studio</h1>
                <p className="text-slate-400 font-medium">Generate professional extension assets in bulk.</p>
              </header>
              <BatchStudio />
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl animate-in fade-in duration-500">
             <h1 className="text-4xl font-black tracking-tight mb-8">Site Settings</h1>
             <div className="bg-[#1E293B] p-10 rounded-[40px] border border-white/5 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Site Name</label>
                  <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold" value={siteSettings.siteName} onChange={e => setSiteSettings({...siteSettings, siteName: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Site Description (SEO)</label>
                  <textarea className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl h-32" value={siteSettings.description} onChange={e => setSiteSettings({...siteSettings, description: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Support Email</label>
                  <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold" value={siteSettings.contactEmail} onChange={e => setSiteSettings({...siteSettings, contactEmail: e.target.value})} />
                </div>
                <button className="w-full py-5 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20" onClick={() => alert('Settings Saved to Cloud (Local)!')}>
                  SAVE CONFIGURATION
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
