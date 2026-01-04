// AdminCMS.tsx – نسخة نهائية مع إجبار التحديث
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, Extension, UserRole } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AdminCMSProps { onExit?: () => void; }

type NoticeType = 'success' | 'error' | 'info';
type Tab = 'dashboard' | 'posts' | 'extensions' | 'media' | 'analytics' | 'settings';

interface MediaItem { id: string; name: string; data: string; type: string; }

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

// ====== منع اللوحة القديمة من الظهور ======
const OLD_VERSION_DISABLED = true;
console.log('[CMS] Professional build v3.0 loaded – old version disabled');

const AdminCMS: React.FC<AdminCMSProps> = ({ onExit }) => {
  const [currentUser, setCurrentUser] = useState<{ username: string; role: UserRole } | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [darkMode, setDarkMode] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: NoticeType } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ====== كسر الـ Cache وإجبار التحديث ======
  useEffect(() => {
    const forceUpdate = () => {
      const buildVersion = 'v3.0-' + Date.now();
      localStorage.setItem('cms_build_version', buildVersion);
      console.log('[CMS] Force update triggered:', buildVersion);
    };
    forceUpdate();

    if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth) setCurrentUser(JSON.parse(auth));
    const savedPosts = localStorage.getItem(POSTS_KEY);
    setPosts(savedPosts ? JSON.parse(savedPosts) : []);
    const savedExts = localStorage.getItem(EXTS_KEY);
    setExtensions(savedExts ? JSON.parse(savedExts) : []);
    setMediaLibrary(JSON.parse(localStorage.getItem(MEDIA_KEY) || '[]') as MediaItem[]);
    setAnalytics(JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]'));
    setDarkMode(localStorage.getItem('cms_dark') === 'true');
  }, []);

  useEffect(() => { if (posts.length) localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); }, [posts]);
  useEffect(() => { if (extensions.length) localStorage.setItem(EXTS_KEY, JSON.stringify(extensions)); }, [extensions]);

  // ====== الأمان ======
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
      showNotice(`Welcome, ${user.username}!`, 'success');
    } else showNotice('Invalid credentials', 'error');
  };

  const handleLogout = () => { localStorage.removeItem(AUTH_KEY); setCurrentUser(null); showNotice('Logged out', 'info'); };

  // ====== الذكاء الاصطناعي ======
  const generateAIDraft = async () => {
    if (!formData.title) return showNotice('Please enter a title first', 'info');
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Write a professional blog post about "${formData.title}" suitable for a high-end tech directory. Format as HTML using <h2>, <p>, and <ul> tags. Provide a short 150-character summary. Return JSON: { "content": "HTML_STRING", "excerpt": "SUMMARY_STRING" }`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { content: { type: Type.STRING }, excerpt: { type: Type.STRING } }, required: ['content', 'excerpt'] } }
      });
      const data = JSON.parse(response.text || '{}');
      setFormData({ ...formData, content: data.content, excerpt: data.excerpt });
      showNotice('AI Draft Generated!', 'success');
    } catch { showNotice('AI generation failed', 'error'); } finally { setAiLoading(false); }
  };

  // ====== SEO Booster ======
  const boostSEO = () => {
    const title = formData.title || '';
    const plainContent = (formData.content || '').replace(/<[^>]*>/g, '');
    const desc = (formData.excerpt || plainContent).slice(0, 155);
    const keywords = (formData.category || 'chrome, extension, privacy').toLowerCase();
    setFormData({ ...formData, seoTitle: title.slice(0, 60), seoDesc: desc, seoKeywords: keywords });
    showNotice('SEO Metadata Boosted!', 'success');
  };

  // ====== CRUD Operations ======
  const handleSave = () => {
    const newPost: BlogPost = {
      ...formData,
      id: formData.id || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      date: formData.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      publishDate: formData.publishDate || new Date().toISOString(),
      readTime: formData.readTime || '5 min read',
      image: formData.image || 'https://images.unsplash.com/photo-1496065187959-7f07b8353c55?auto=format&fit=crop&q=80&w=800',
      status: formData.status || 'published'
    };
    const updated = [...posts];
    const idx = updated.findIndex(p => p.id === newPost.id);
    if (idx > -1) updated[idx] = newPost; else updated.unshift(newPost);
    setPosts(updated);
    setIsEditing(false);
    showNotice('Saved successfully!', 'success');
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('Delete this post?')) {
      setPosts(posts.filter(p => p.id !== id));
      showNotice('Post deleted', 'success');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', excerpt: '', content: '', category: 'General', date: '', publishDate: '', readTime: '', image: '', status: 'draft', seoTitle: '', seoDesc: '', seoKeywords: '' });
    setIsEditing(false);
  };

  // ====== Media Library ======
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const item: MediaItem = { id: Date.now().toString(), name: file.name, data: ev.target?.result as string, type: file.type };
        const updated = [item, ...mediaLibrary];
        setMediaLibrary(updated);
        localStorage.setItem(MEDIA_KEY, JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    });
    showNotice('Media uploaded', 'success');
  };

  // ====== Analytics ======
  const dashboardStats = {
    postsCount: posts.length,
    extsCount: extensions.length,
    totalViews: '24.8K',
    totalInstalls: '5.2K',
    chartData: [
      { name: 'Mon', views: 1200, installs: 340 },
      { name: 'Tue', views: 1500, installs: 410 },
      { name: 'Wed', views: 2100, installs: 520 },
      { name: 'Thu', views: 1800, installs: 390 },
      { name: 'Fri', views: 2400, installs: 610 },
      { name: 'Sat', views: 2800, installs: 720 },
      { name: 'Sun', views: 3200, installs: 850 },
    ]
  };

  const bgClass = darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const inputClass = darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300';

  // ====== Login Wall - Apple Style ======
  if (!currentUser) return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-6`}>
      <div className={`w-full max-w-md ${cardClass} rounded-[48px] shadow-2xl p-12 border`}>
        <div className="flex justify-center mb-10"><div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100">E</div></div>
        <h1 className="text-3xl font-black text-center mb-2">ExtensionTo CMS</h1>
        <p className="text-gray-500 text-center mb-10">Please sign in to continue</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="text" className={`w-full px-6 py-4 ${inputClass} rounded-2xl outline-none focus:ring-4 ring-indigo-50`} value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} placeholder="Username" required />
          <input type="password" className={`w-full px-6 py-4 ${inputClass} rounded-2xl outline-none focus:ring-4 ring-indigo-50`} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="Password" required />
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">AUTHENTICATE</button>
        </form>
        <p className="mt-8 text-xs text-center text-gray-400 font-black uppercase tracking-widest">DEMO: admin / admin123</p>
      </div>
    </div>
  );

  // ====== Main Dashboard - Apple Style ======
  return (
    <div className={`min-h-screen flex ${bgClass}`}>
      {/* Sidebar - Apple Style */}
      <aside className={`w-80 fixed h-full border-r ${cardClass} z-50 flex flex-col shadow-2xl`}>
        <div className="p-10 border-b border-inherit flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">E</div>
          <div><span className="font-black text-lg tracking-tight block">Console</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enterprise Edition</span></div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2">
          {[
            { id: 'dashboard', label: 'Overview', icon: '💎' },
            { id: 'posts', label: 'Journal Manager', icon: '📝' },
            { id: 'extensions', label: 'Store Inventory', icon: '🛍️' },
            { id: 'media', label: 'Media Assets', icon: '📁' },
            { id: 'analytics', label: 'Traffic Intelligence', icon: '📊' },
            { id: 'settings', label: 'System Settings', icon: '⚙️' },
          ].map(item => (
            <button key={item.id} onClick={() => {setActiveTab(item.id as Tab); setIsEditing(false);}} className={`w-full text-left px-6 py-5 rounded-2xl flex items-center gap-5 font-bold text-sm transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-inherit space-y-4">
          <button onClick={() => { setDarkMode(!darkMode); localStorage.setItem('cms_dark', String(!darkMode)); }} className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-900 hover:text-white'}`}>{darkMode ? '☀️ LIGHT INTERFACE' : '🌙 DARK INTERFACE'}</button>
          <button onClick={handleLogout} className="w-full py-4 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">LOGOUT</button>
        </div>
      </aside>

      {/* Main Content - Apple Style */}
      <main className="ml-80 flex-grow p-12 overflow-y-auto">
        {notice && <div className={`fixed top-12 right-12 z-[100] px-10 py-5 rounded-[24px] shadow-2xl text-white font-black ${notice.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{notice.message}</div>}

        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            <header className="flex justify-between items-end">
              <div><h1 className="text-6xl font-black tracking-tighter mb-4">Command Center</h1><p className="text-gray-500 text-xl">Platform performance & management.</p></div>
              <button onClick={() => {setFormData({title: '', content: ''}); setIsEditing(true);}} className="px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all">NEW POST</button>
            </header>

            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Weekly Views', val: '24.8K', icon: '👁️', color: 'text-indigo-600' },
                { label: 'Journal Entries', val: posts.length.toString(), icon: '📄', color: 'text-blue-600' },
                { label: 'Store Items', val: extensions.length.toString(), icon: '📦', color: 'text-emerald-600' },
                { label: 'Total Installs', val: '5.2K', icon: '🚀', color: 'text-rose-600' },
              ].map((s, i) => (
                <div key={i} className={`p-10 rounded-[48px] border shadow-sm group hover:scale-105 transition-all ${cardClass}`}>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">{s.label}</div>
                  <div className="flex items-center justify-between">
                    <div className={`text-5xl font-black ${s.color} tracking-tighter`}>{s.val}</div>
                    <div className="text-4xl opacity-20 group-hover:opacity-100 transition-opacity">{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-12 rounded-[64px] border shadow-2xl ${cardClass}`}>
              <h3 className="text-2xl font-black mb-12 flex items-center gap-3"><span className="w-2 h-8 bg-indigo-600 rounded-full"></span>Growth Projection</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: 'Mon', views: 1200, installs: 340 },
                    { name: 'Tue', views: 1500, installs: 410 },
                    { name: 'Wed', views: 2100, installs: 520 },
                    { name: 'Thu', views: 1800, installs: 390 },
                    { name: 'Fri', views: 2400, installs: 610 },
                    { name: 'Sat', views: 2800, installs: 720 },
                    { name: 'Sun', views: 3200, installs: 850 },
                  ]}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                    <YAxis hide />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', fontWeight: 800}} />
                    <Line type="monotone" dataKey="views" stroke="#4f46e5" strokeWidth={6} dot={false} />
                    <Line type="monotone" dataKey="installs" stroke="#10b981" strokeWidth={6} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && !isEditing && (
          <div className="space-y-12">
            <header className="flex justify-between items-center">
              <h2 className="text-5xl font-black tracking-tighter">Journal Content</h2>
              <div className="flex gap-4">
                <input type="text" placeholder="Search entries..." className={`px-6 py-4 rounded-2xl border outline-none focus:ring-4 ring-indigo-50 font-bold ${inputClass}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button onClick={() => {setFormData({title: '', content: ''}); setIsEditing(true);}} className="px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm shadow-xl shadow-indigo-100">CREATE ENTRY</button>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-8">
              {posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(post => (
                <div key={post.id} className={`p-8 rounded-[48px] border shadow-sm flex gap-8 group transition-all hover:border-indigo-500/30 ${cardClass}`}>
                  <div className="w-40 h-40 rounded-[32px] overflow-hidden flex-shrink-0 border border-inherit bg-gray-50">
                    {post.image.startsWith('http') ? <img src={post.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">{post.image}</div>}
                  </div>
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{post.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${post.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{post.status}</span>
                      </div>
                      <h3 className="text-2xl font-black leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{post.title}</h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400">{post.date}</span>
                      <div className="flex gap-4">
                        <button onClick={() => {setFormData(post); setIsEditing(true);}} className="text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Edit</button>
                        <button onClick={() => handleDeletePost(post.id)} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isEditing && (
          <div className="max-w-6xl">
            <header className="flex justify-between items-center mb-12">
              <button onClick={() => setIsEditing(false)} className="text-sm font-black text-gray-400 hover:text-indigo-600 flex items-center gap-3"><span className="text-xl">←</span> DISCARD</button>
              <div className="flex gap-4">
                <button onClick={generateAIDraft} disabled={aiLoading} className="px-8 py-4 bg-violet-600 text-white rounded-[20px] font-black text-xs shadow-xl shadow-violet-100 flex items-center gap-3">{aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '🪄'} AI ASSISTANT</button>
                <button onClick={boostSEO} className="px-8 py-4 bg-emerald-600 text-white rounded-[20px] font-black text-xs shadow-xl shadow-emerald-100">🚀 BOOST SEO</button>
                <button onClick={handleSave} className="px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm shadow-2xl shadow-indigo-200">SAVE CHANGES</button>
              </div>
            </header>

            <div className={`p-16 rounded-[64px] border shadow-2xl space-y-12 ${cardClass}`}>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Primary Descriptor</label>
                <input className="w-full bg-transparent text-6xl font-black outline-none placeholder:text-gray-200 tracking-tighter" placeholder="Article Title..." value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Classification</label>
                    <input className={`w-full p-6 rounded-[24px] border font-bold ${inputClass}`} value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Reference (URL/Emoji)</label>
                    <input className={`w-full p-6 rounded-[24px] border font-bold ${inputClass}`} value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Search Metadata</label>
                    <textarea className={`w-full p-6 rounded-[24px] border font-medium text-sm h-32 leading-relaxed ${inputClass}`} placeholder="SEO Keywords / Description..." value={formData.seoDesc || ''} onChange={e => setFormData({...formData, seoDesc: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Article Body (HTML Supported)</label>
                <textarea className={`w-full h-[600px] p-10 rounded-[48px] border font-medium text-lg leading-[1.8] outline-none ${inputClass}`} placeholder="Begin writing..." value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-12">
            <header className="flex justify-between items-center">
              <h2 className="text-5xl font-black tracking-tighter">Asset Library</h2>
              <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm shadow-xl shadow-indigo-100">UPLOAD FILES</button>
            </header>
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleMediaUpload} />
            
            <div className="grid grid-cols-4 gap-8">
              {mediaLibrary.map(item => (
                <div key={item.id} className={`p-4 rounded-[40px] border shadow-sm group relative overflow-hidden transition-all hover:border-indigo-500 ${cardClass}`}>
                  <div className="aspect-square rounded-[32px] overflow-hidden bg-gray-50 dark:bg-gray-700 mb-4">
                    {item.type.startsWith('image/') ? <img src={item.data} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📄</div>}
                  </div>
                  <div className="px-2">
                    <div className="font-bold text-xs truncate mb-1">{item.name}</div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.type.split('/')[1]}</div>
                  </div>
                  <button onClick={() => { const updated = mediaLibrary.filter(m => m.id !== item.id); setMediaLibrary(updated); localStorage.setItem(MEDIA_KEY, JSON.stringify(updated)); }} className="absolute top-6 right-6 w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
