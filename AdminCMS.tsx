
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
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface AdminCMSProps {
  onExit?: () => void;
}

type Tab = 'dashboard' | 'posts' | 'extensions' | 'media' | 'analytics' | 'settings';
const AUTH_KEY = 'cms_auth_token_v3';
const MEDIA_KEY = 'cms_media_v3';
const POSTS_KEY = 'cms_blog_posts_v3';
const EXTS_KEY = 'cms_extensions_v3';

const AdminCMS: React.FC<AdminCMSProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cms_theme') === 'dark');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'post' | 'extension'>('post');
  const [formData, setFormData] = useState<any>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [notice, setNotice] = useState<{ m: string; t: 's' | 'e' } | null>(null);

  useEffect(() => {
    // FORCE PURGE OF ANY OLD NON-V3 STORAGE
    const oldKeys = ['cms_blog_posts', 'cms_extensions', 'cms_active_tab'];
    oldKeys.forEach(k => localStorage.removeItem(k));

    const token = localStorage.getItem(AUTH_KEY);
    if (token) setIsAuthenticated(true);

    const savedPosts = localStorage.getItem(POSTS_KEY);
    setPosts(savedPosts ? JSON.parse(savedPosts) : STATIC_POSTS);

    const savedExts = localStorage.getItem(EXTS_KEY);
    setExtensions(savedExts ? JSON.parse(savedExts) : STATIC_EXTENSIONS);

    setMedia(JSON.parse(localStorage.getItem(MEDIA_KEY) || '[]'));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      localStorage.setItem(EXTS_KEY, JSON.stringify(extensions));
    }
  }, [posts, extensions, isAuthenticated]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('cms_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const triggerNotice = (m: string, t: 's' | 'e' = 's') => {
    setNotice({ m, t });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'admin' && loginForm.pass === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'verified_session_v3');
      triggerNotice('Authorization Successful', 's');
    } else {
      triggerNotice('Access Denied', 'e');
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    if (onExit) onExit();
  };

  const generateAI = async () => {
    if (!formData.title) return triggerNotice('Set a subject title first', 'e');
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a professional article about "${formData.title}" in the context of browser productivity. Output valid HTML.`,
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
      const data = JSON.parse(response.text);
      setFormData((prev: any) => ({ ...prev, content: data.content, excerpt: data.excerpt }));
      triggerNotice('AI Draft Synthesized', 's');
    } catch {
      triggerNotice('AI Interface Error', 'e');
    } finally {
      setAiLoading(false);
    }
  };

  const save = () => {
    if (editMode === 'post') {
      const p = { ...formData, id: formData.id || Date.now().toString(), status: 'published', date: new Date().toLocaleDateString() };
      const updated = posts.some(x => x.id === p.id) ? posts.map(x => x.id === p.id ? p : x) : [p, ...posts];
      setPosts(updated);
    } else {
      const e = { ...formData, id: formData.id || Date.now().toString() };
      const updated = extensions.some(x => x.id === e.id) ? extensions.map(x => x.id === e.id ? e : x) : [e, ...extensions];
      setExtensions(updated);
    }
    setIsEditing(false);
    triggerNotice('System Repository Updated', 's');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-12 border border-slate-100 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-200">E</div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 text-center mb-2">Operational Hub</h1>
          <p className="text-slate-400 text-center mb-10 font-black uppercase text-[10px] tracking-widest">ExtensionTo Professional Suite</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder="Identity" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-50 font-bold" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} required />
            <input type="password" placeholder="Key" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-50 font-bold" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} required />
            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">ACCESS CONSOLE</button>
          </form>
        </div>
      </div>
    );
  }

  const chartData = [
    { n: 'M', v: 450 }, { n: 'T', v: 720 }, { n: 'W', v: 610 }, { n: 'T', v: 880 }, { n: 'F', v: 1250 }, { n: 'S', v: 1480 }, { n: 'S', v: 1120 }
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-950 text-white' : 'bg-[#F2F4F7] text-slate-900'} font-sans transition-colors duration-500`}>
      <aside className={`w-80 fixed h-full border-r ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} z-50 flex flex-col shadow-2xl`}>
        <div className="p-10 border-b border-inherit flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">E</div>
          <div>
            <span className="font-black text-lg tracking-tighter block leading-tight">Command v3.1</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Suite</span>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '💎' },
            { id: 'posts', label: 'Journal Manager', icon: '📝' },
            { id: 'extensions', label: 'Inventory SKU', icon: '📦' },
            { id: 'media', label: 'Asset Bank', icon: '📁' },
            { id: 'analytics', label: 'Intelligence', icon: '📊' },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => {setActiveTab(item.id as Tab); setIsEditing(false);}} 
              className={`w-full text-left px-6 py-5 rounded-2xl flex items-center gap-5 font-bold text-sm transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
            >
              <span className="text-xl">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-inherit space-y-3">
          <button onClick={() => setDarkMode(!darkMode)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {darkMode ? '☀️ DAY MODE' : '🌙 NIGHT MODE'}
          </button>
          <button onClick={logout} className="w-full py-4 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest">DISCONNECT</button>
        </div>
      </aside>

      <main className="ml-80 flex-grow p-12 overflow-y-auto">
        {notice && (
          <div className={`fixed top-12 right-12 z-[100] px-8 py-4 rounded-2xl shadow-2xl text-white font-black animate-in slide-in-from-top-12 duration-500 ${notice.t === 's' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {notice.m}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-6xl font-black tracking-tighter mb-4">Command Center</h1>
                <p className="text-slate-500 text-xl font-medium italic">Status: <span className="text-emerald-500 font-bold uppercase">Optimal</span></p>
              </div>
              <button onClick={() => {setEditMode('post'); setFormData({title: ''}); setIsEditing(true);}} className="px-10 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-200">INITIATE DEPLOYMENT</button>
            </header>

            <div className="grid grid-cols-4 gap-8">
              {[
                { l: 'Journal Reach', v: '52.1K', c: 'text-blue-600', i: '👁️' },
                { l: 'Store SKU', v: extensions.length, c: 'text-emerald-600', i: '📦' },
                { l: 'Conversions', v: '9.4K', c: 'text-rose-600', i: '🚀' },
                { l: 'System Health', v: '99%', c: 'text-amber-600', i: '🛡️' },
              ].map((s, idx) => (
                <div key={idx} className={`p-10 rounded-[48px] border shadow-sm transition-all hover:scale-105 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    {s.l} <span className="text-lg">{s.i}</span>
                  </div>
                  <div className={`text-5xl font-black ${s.c} tracking-tighter`}>{s.v}</div>
                </div>
              ))}
            </div>

            <div className={`p-12 rounded-[64px] border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <h3 className="text-2xl font-black mb-12 flex items-center gap-3">
                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                Growth Analytics
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} />
                    <YAxis hide />
                    <ChartTooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', fontWeight: 800}} />
                    <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorV)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && !isEditing && (
          <div className="space-y-12 animate-in slide-in-from-right-12 duration-500">
             <header className="flex justify-between items-center">
               <h2 className="text-5xl font-black tracking-tighter">Content Hub</h2>
               <button onClick={() => {setEditMode('post'); setFormData({title: ''}); setIsEditing(true);}} className="px-10 py-5 bg-blue-600 text-white rounded-[32px] font-black shadow-xl shadow-blue-100">CREATE POST</button>
             </header>

             <div className="grid grid-cols-2 gap-8">
               {posts.map(p => (
                 <div key={p.id} className={`p-8 rounded-[48px] border shadow-sm flex gap-8 group transition-all hover:border-blue-500/50 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="w-40 h-40 rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      {p.image.startsWith('http') ? <img src={p.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl">{p.image}</div>}
                    </div>
                    <div className="flex flex-col justify-between py-2">
                       <div>
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">{p.category}</span>
                          <h3 className="text-2xl font-black leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{p.title}</h3>
                       </div>
                       <div className="flex gap-6">
                          <button onClick={() => {setFormData(p); setEditMode('post'); setIsEditing(true);}} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest">Edit</button>
                          <button onClick={() => setPosts(posts.filter(x => x.id !== p.id))} className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Delete</button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {isEditing && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-12 duration-700">
            <header className="flex justify-between items-center mb-12">
               <button onClick={() => setIsEditing(false)} className="text-sm font-black text-slate-400 hover:text-blue-600 transition-colors">← CANCEL EDIT</button>
               <div className="flex gap-4">
                  {editMode === 'post' && (
                    <button onClick={generateAI} disabled={aiLoading} className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-violet-100 flex items-center gap-3">
                      {aiLoading ? 'WRITING...' : '🪄 AI ASSISTANT'}
                    </button>
                  )}
                  <button onClick={save} className="px-12 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-200">COMMIT TO CLOUD</button>
               </div>
            </header>

            <div className={`p-16 rounded-[64px] border shadow-2xl space-y-12 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <input 
                className="w-full bg-transparent text-6xl font-black outline-none placeholder:text-slate-200 dark:placeholder:text-slate-800 tracking-tighter" 
                placeholder="Subject Title..." 
                value={editMode === 'post' ? formData.title : formData.name}
                onChange={e => setFormData(editMode === 'post' ? {...formData, title: e.target.value} : {...formData, name: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-12">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <input className={`w-full p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} font-bold outline-none`} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset (URL/Emoji)</label>
                    <input className={`w-full p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} font-bold outline-none`} value={editMode === 'post' ? formData.image : formData.icon} onChange={e => setFormData(editMode === 'post' ? {...formData, image: e.target.value} : {...formData, icon: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editorial Space</label>
                <textarea 
                  className={`w-full h-[600px] p-12 rounded-[48px] border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} font-medium text-lg leading-[1.8] outline-none`}
                  placeholder="Start drafting content here..."
                  value={editMode === 'post' ? formData.content : formData.longDescription}
                  onChange={e => setFormData(editMode === 'post' ? {...formData, content: e.target.value} : {...formData, longDescription: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Module Placeholder */}
        {activeTab === 'analytics' && (
          <div className="h-[60vh] flex flex-col items-center justify-center opacity-40 animate-pulse">
            <div className="text-9xl mb-8">📊</div>
            <h2 className="text-4xl font-black uppercase tracking-widest">Data Ingest Active</h2>
            <p className="font-bold text-slate-500">Professional Intelligence Module is scanning traffic...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
