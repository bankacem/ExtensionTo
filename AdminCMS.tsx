
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BlogPost, Extension, UserRole, MediaItem } from './types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from './constants';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  CartesianGrid 
} from 'recharts';

interface AdminCMSProps {
  onExit?: () => void;
}

type NoticeType = 'success' | 'error' | 'info';
type Tab = 'dashboard' | 'posts' | 'extensions' | 'media' | 'analytics' | 'settings';

const AUTH_KEY = 'cms_auth_token';
const USERS_KEY = 'cms_users';
const MEDIA_KEY = 'cms_media';
const POSTS_KEY = 'cms_blog_posts';
const EXTS_KEY = 'cms_extensions';
const ANALYTICS_KEY = 'cms_analytics_log';

const DEFAULT_USERS = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' as UserRole },
  { id: '2', username: 'editor', password: 'editor123', role: 'editor' as UserRole },
  { id: '3', username: 'viewer', password: 'viewer123', role: 'viewer' as UserRole },
];

const AdminCMS: React.FC<AdminCMSProps> = ({ onExit }) => {
  // Navigation & Auth State
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentUser, setCurrentUser] = useState<{ username: string; role: UserRole } | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [darkMode, setDarkMode] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: NoticeType } | null>(null);

  // Data State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'post' | 'extension'>('post');
  const [formData, setFormData] = useState<any>({});
  const [aiLoading, setAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Data
  useEffect(() => {
    console.log('[CMS] Initializing Professional Suite v3.0.0');
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth) setCurrentUser(JSON.parse(auth));
    if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));

    const savedPosts = localStorage.getItem(POSTS_KEY);
    setPosts(savedPosts ? JSON.parse(savedPosts) : STATIC_POSTS);

    const savedExts = localStorage.getItem(EXTS_KEY);
    setExtensions(savedExts ? JSON.parse(savedExts) : STATIC_EXTENSIONS);

    setMediaLibrary(JSON.parse(localStorage.getItem(MEDIA_KEY) || '[]') as MediaItem[]);
    setAnalytics(JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]'));
    
    const isDark = localStorage.getItem('cms_dark_mode') === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  // Save State
  useEffect(() => {
    if (posts.length > 0) localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    if (extensions.length > 0) localStorage.setItem(EXTS_KEY, JSON.stringify(extensions));
  }, [posts, extensions]);

  const showNotice = (message: string, type: NoticeType = 'info') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      const authData = { username: user.username, role: user.role };
      setCurrentUser(authData);
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      showNotice(`Authenticated as ${user.username}`, 'success');
    } else {
      showNotice('Invalid access credentials', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setCurrentUser(null);
    showNotice('Session terminated safely', 'info');
  };

  // AI Assistant using Gemini 3 - Professional Implementation
  const generateAIDraft = async () => {
    if (!formData.title) return showNotice('Identify a subject title first', 'info');
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a Senior Technology Editor. Create high-quality, professional blog content for: "${formData.title}". 
                  Context: Browser extensions, productivity, and privacy tools.
                  Format: Pure HTML (h2, p, ul, li).
                  Requirement: Include a sophisticated excerpt.
                  Output Schema: { "content": "string", "excerpt": "string" }`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              excerpt: { type: Type.STRING }
            },
            required: ['content', 'excerpt']
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("API Connection Interrupted");
      const data = JSON.parse(text);
      setFormData((prev: any) => ({ ...prev, content: data.content, excerpt: data.excerpt }));
      showNotice('AI Content Generated Successfully', 'success');
    } catch (e) {
      console.error(e);
      showNotice('AI Synthesis Failed. Check API Connectivity.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const boostSEO = () => {
    const title = formData.title || '';
    const plainContent = (formData.content || '').replace(/<[^>]*>/g, '');
    const desc = (formData.excerpt || plainContent).slice(0, 160);
    
    setFormData((prev: any) => ({
      ...prev,
      seoTitle: `${title} | Curated Extension Directory`,
      seoDesc: desc,
      seoKeywords: 'browser, extension, chrome tools, productivity software'
    }));
    showNotice('SEO Metadata Synthesized', 'success');
  };

  const handleSave = () => {
    if (editMode === 'post') {
      const newPost: BlogPost = {
        ...formData,
        id: formData.id || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        date: formData.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        publishDate: formData.publishDate || new Date().toISOString(),
        readTime: formData.readTime || '5 min read',
        image: formData.image || 'https://images.unsplash.com/photo-1496065187959-7f07b8353c55',
        status: formData.status || 'published'
      };
      const updated = [...posts];
      const idx = updated.findIndex(p => p.id === newPost.id);
      if (idx > -1) updated[idx] = newPost; else updated.unshift(newPost);
      setPosts(updated);
    } else {
      const newExt: Extension = {
        ...formData,
        id: formData.id || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
      const updated = [...extensions];
      const idx = updated.findIndex(e => e.id === newExt.id);
      if (idx > -1) updated[idx] = newExt; else updated.unshift(newExt);
      setExtensions(updated);
    }
    setIsEditing(false);
    showNotice('Database Updated Successfully', 'success');
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const item: MediaItem = { 
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5), 
          name: file.name, 
          data: ev.target?.result as string, 
          type: file.type 
        };
        const updated = [item, ...mediaLibrary];
        setMediaLibrary(updated);
        localStorage.setItem(MEDIA_KEY, JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    });
    showNotice('Assets indexed in media library', 'success');
  };

  const dashboardStats = useMemo(() => {
    return {
      postsCount: posts.length,
      extsCount: extensions.length,
      totalViews: '32,542',
      totalInstalls: '6,810',
      chartData: [
        { name: 'Mon', views: 1500, installs: 340 },
        { name: 'Tue', views: 1800, installs: 410 },
        { name: 'Wed', views: 2400, installs: 520 },
        { name: 'Thu', views: 2200, installs: 390 },
        { name: 'Fri', views: 3000, installs: 610 },
        { name: 'Sat', views: 3500, installs: 720 },
        { name: 'Sun', views: 3800, installs: 850 },
      ]
    };
  }, [posts, extensions]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('cms_dark_mode', String(next));
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-12 border border-slate-200/50">
          <div className="flex justify-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-100">E</div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 text-center mb-2">ExtensionTo Suite</h1>
          <p className="text-slate-500 text-center mb-10 font-medium">Enterprise Console</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder="Username" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-50 font-bold" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" placeholder="Password" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-50 font-bold" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]">AUTHENTICATE</button>
          </form>
          <p className="mt-8 text-[10px] text-center text-slate-300 font-black uppercase tracking-widest">Demo Access Required</p>
        </div>
      </div>
    );
  }

  const bgClass = darkMode ? 'bg-slate-900 text-white' : 'bg-[#F2F2F7] text-slate-900';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const inputClass = darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300';

  return (
    <div className={`min-h-screen flex ${bgClass} font-sans transition-colors duration-500`}>
      {/* Professional Sidebar */}
      <aside className={`w-80 fixed h-full border-r ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} z-50 flex flex-col shadow-2xl transition-all`}>
        <div className="p-10 border-b border-inherit flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">E</div>
          <div>
            <span className="font-black text-lg tracking-tight block">Console v3</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Hub</span>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Overview', icon: '💎' },
            { id: 'posts', label: 'Journal Manager', icon: '📝' },
            { id: 'extensions', label: 'Store Inventory', icon: '🛍️' },
            { id: 'media', label: 'Media Assets', icon: '📁' },
            { id: 'analytics', label: 'Intelligence', icon: '📊' },
            { id: 'settings', label: 'System Settings', icon: '⚙️' },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => {setActiveTab(item.id as Tab); setIsEditing(false);}} 
              className={`w-full text-left px-6 py-5 rounded-2xl flex items-center gap-5 font-bold text-sm transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
            >
              <span className="text-xl">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-inherit space-y-4">
          <button 
            onClick={toggleDarkMode} 
            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white'}`}
          >
            {darkMode ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
          </button>
          <button onClick={handleLogout} className="w-full py-4 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">EXIT SESSION</button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="ml-80 flex-grow p-12 overflow-y-auto">
        {notice && (
          <div className={`fixed top-12 right-12 z-[100] px-10 py-5 rounded-[24px] shadow-2xl text-white font-black animate-in slide-in-from-top-12 duration-500 ${notice.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {notice.message}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-6xl font-black tracking-tighter mb-4">Command Center</h1>
                <p className="text-slate-500 text-xl font-medium italic">Operational status: <span className="text-emerald-500 font-bold">Optimal</span></p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => {setEditMode('post'); setFormData({title: '', content: ''}); setIsEditing(true);}} className="px-8 py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all">NEW CAMPAIGN</button>
              </div>
            </header>

            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Network Reach', val: dashboardStats.totalViews, icon: '👁️', color: 'text-blue-600' },
                { label: 'Journal Library', val: dashboardStats.postsCount, icon: '📄', color: 'text-indigo-600' },
                { label: 'Inventory SKU', val: dashboardStats.extsCount, icon: '📦', color: 'text-emerald-600' },
                { label: 'Conversions', val: dashboardStats.totalInstalls, icon: '🚀', color: 'text-rose-600' },
              ].map((s, i) => (
                <div key={i} className={`p-10 rounded-[48px] border shadow-sm group hover:scale-105 transition-all ${cardClass}`}>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">{s.label}</div>
                  <div className="flex items-center justify-between">
                    <div className={`text-5xl font-black ${s.color} tracking-tighter`}>{s.val}</div>
                    <div className="text-4xl opacity-20">{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-12 rounded-[64px] border shadow-2xl ${cardClass}`}>
              <h3 className="text-2xl font-black mb-12 flex items-center gap-3">
                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                Growth Projection Analytics
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardStats.chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                    <YAxis hide />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <ChartTooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', fontWeight: 800}} />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={6} dot={false} />
                    <Line type="monotone" dataKey="installs" stroke="#10b981" strokeWidth={6} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && !isEditing && (
          <div className="space-y-12 animate-in slide-in-from-right-12 duration-500">
             <header className="flex justify-between items-center">
               <h2 className="text-5xl font-black tracking-tighter">Content Manager</h2>
               <div className="flex gap-4">
                 <input type="text" placeholder="Search entries..." className={`px-6 py-4 rounded-2xl border font-bold ${inputClass}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 <button onClick={() => {setEditMode('post'); setFormData({title: ''}); setIsEditing(true);}} className="px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-xl shadow-blue-100">NEW POST</button>
               </div>
             </header>

             <div className="grid grid-cols-2 gap-8">
               {posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(post => (
                 <div key={post.id} className={`p-8 rounded-[48px] border shadow-sm flex gap-8 group transition-all hover:border-blue-500/30 ${cardClass}`}>
                    <div className="w-40 h-40 rounded-[32px] overflow-hidden flex-shrink-0 border border-inherit bg-slate-50">
                      {post.image.startsWith('http') ? <img src={post.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">{post.image}</div>}
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                       <div>
                          <div className="flex justify-between">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{post.category}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${post.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{post.status}</span>
                          </div>
                          <h3 className="text-2xl font-black leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{post.title}</h3>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">{post.date}</span>
                          <div className="flex gap-4">
                             <button onClick={() => {setFormData(post); setEditMode('post'); setIsEditing(true);}} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest">Edit</button>
                             <button onClick={() => { if(window.confirm('Safe Delete?')) setPosts(posts.filter(p => p.id !== post.id)); }} className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Delete</button>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {isEditing && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-12 duration-700 pb-20">
            <header className="flex justify-between items-center mb-12">
               <button onClick={() => setIsEditing(false)} className="text-sm font-black text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-3">
                  <span className="text-xl">←</span> DISCARD
               </button>
               <div className="flex gap-4">
                  {editMode === 'post' && (
                    <>
                      <button onClick={generateAIDraft} disabled={aiLoading} className="px-8 py-4 bg-violet-600 text-white rounded-[20px] font-black text-xs shadow-xl shadow-violet-100 flex items-center gap-3 hover:scale-105 transition-all">
                        {aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '🪄'} AI ASSISTANT
                      </button>
                      <button onClick={boostSEO} className="px-8 py-4 bg-emerald-600 text-white rounded-[20px] font-black text-xs shadow-xl shadow-emerald-100 hover:scale-105 transition-all">🚀 BOOST SEO</button>
                    </>
                  )}
                  <button onClick={handleSave} className="px-12 py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-2xl shadow-blue-200">COMMIT TO DATABASE</button>
               </div>
            </header>

            <div className={`p-16 rounded-[64px] border shadow-2xl space-y-12 ${cardClass}`}>
              <div className="space-y-4">
                <input 
                  className="w-full bg-transparent text-6xl font-black outline-none placeholder:text-slate-200 tracking-tighter" 
                  placeholder={editMode === 'post' ? "Article Title..." : "Extension Name..."}
                  value={editMode === 'post' ? formData.title : formData.name}
                  onChange={e => setFormData(editMode === 'post' ? {...formData, title: e.target.value} : {...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                      <input className={`w-full p-6 rounded-[24px] border font-bold ${inputClass}`} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Reference</label>
                      <input className={`w-full p-6 rounded-[24px] border font-bold ${inputClass}`} value={editMode === 'post' ? formData.image : formData.icon} onChange={e => setFormData(editMode === 'post' ? {...formData, image: e.target.value} : {...formData, icon: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SEO Meta Summary</label>
                      <textarea className={`w-full p-6 rounded-[24px] border font-medium text-sm h-32 leading-relaxed ${inputClass}`} placeholder="Write meta description..." value={formData.seoDesc} onChange={e => setFormData({...formData, seoDesc: e.target.value})} />
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10">Editorial Workspace</label>
                <textarea 
                  className={`w-full h-[600px] p-12 rounded-[48px] border font-medium text-lg leading-[1.8] outline-none ${inputClass}`} 
                  placeholder="Draft content (HTML supported)..."
                  value={editMode === 'post' ? formData.content : formData.longDescription}
                  onChange={e => setFormData(editMode === 'post' ? {...formData, content: e.target.value} : {...formData, longDescription: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
              <h2 className="text-5xl font-black tracking-tighter">Asset Registry</h2>
              <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-xl shadow-blue-100">INGEST ASSETS</button>
            </header>
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleMediaUpload} />
            
            <div className="grid grid-cols-4 gap-8">
              {mediaLibrary.map(item => (
                <div key={item.id} className={`p-4 rounded-[40px] border shadow-sm group relative overflow-hidden ${cardClass}`}>
                   <div className="aspect-square rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-700 mb-4">
                      {item.type.startsWith('image/') ? <img src={item.data} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📄</div>}
                   </div>
                   <div className="px-2">
                      <div className="font-bold text-xs truncate mb-1">{item.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type.split('/')[1]}</div>
                   </div>
                   <button 
                    onClick={() => { if(window.confirm('Destroy asset?')) { const updated = mediaLibrary.filter(m => m.id !== item.id); setMediaLibrary(updated); localStorage.setItem(MEDIA_KEY, JSON.stringify(updated)); } }} 
                    className="absolute top-6 right-6 w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                   >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
           <div className="space-y-12 animate-in fade-in duration-500">
             <header>
                <h1 className="text-5xl font-black tracking-tighter mb-4">Intelligence Platform</h1>
                <p className="text-slate-500 text-xl font-medium">Holistic infrastructure and conversion health.</p>
             </header>
             <div className="grid grid-cols-3 gap-8">
                <div className={`col-span-2 p-12 rounded-[64px] border shadow-2xl ${cardClass}`}>
                   <h3 className="text-xl font-black mb-10 text-slate-400 uppercase tracking-widest">Global Velocity</h3>
                   <div className="space-y-8">
                      {['North America', 'EMEA', 'APAC', 'LATAM'].map((region, i) => (
                        <div key={region}>
                           <div className="flex justify-between font-bold mb-3"><span>{region}</span><span>{94 - (i * 8)}%</span></div>
                           <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{width: `${94 - (i * 8)}%`}}></div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className={`p-12 rounded-[64px] border shadow-2xl ${cardClass}`}>
                   <h3 className="text-xl font-black mb-10 text-slate-400 uppercase tracking-widest">Environment Split</h3>
                   <div className="space-y-12">
                      <div className="flex items-center gap-6">
                        <div className="text-4xl">💻</div>
                        <div><div className="font-black text-2xl">Desktop Suite</div><div className="text-slate-400 font-bold uppercase text-[10px]">72% Interaction</div></div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-4xl">📱</div>
                        <div><div className="font-black text-2xl">Mobile/Brave</div><div className="text-slate-400 font-bold uppercase text-[10px]">22% Interaction</div></div>
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
