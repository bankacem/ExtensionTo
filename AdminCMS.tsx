
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, Extension, UserRole } from './types';
import { GoogleGenAI } from "@google/genai";
import BatchStudio from './pages/BatchStudio';

interface AdminCMSProps {
  onExit?: () => void;
}

type NoticeType = 'success' | 'error' | 'info';
type Tab = 'dashboard' | 'posts' | 'extensions' | 'media' | 'studio' | 'settings';

const AUTH_KEY = 'cms_auth_token';
const USERS_KEY = 'cms_users';
const MEDIA_KEY = 'cms_media';
const VERSIONS_KEY = 'cms_versions';

const DEFAULT_USERS = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' as UserRole },
  { id: '2', username: 'editor', password: 'editor123', role: 'editor' as UserRole },
];

const AdminCMS: React.FC<AdminCMSProps> = ({ onExit }) => {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentUser, setCurrentUser] = useState<{ username: string; role: UserRole } | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [darkMode, setDarkMode] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: NoticeType } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<'post' | 'extension'>('post');
  
  // Data State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [postForm, setPostForm] = useState<Partial<BlogPost>>({});
  const [extForm, setExtForm] = useState<Partial<Extension>>({});
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Init data
    if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth) setCurrentUser(JSON.parse(auth));
    
    setPosts(JSON.parse(localStorage.getItem('cms_blog_posts') || '[]'));
    setExtensions(JSON.parse(localStorage.getItem('cms_extensions') || '[]'));
    setMediaLibrary(JSON.parse(localStorage.getItem(MEDIA_KEY) || '[]'));
    setDarkMode(localStorage.getItem('cms_dark_mode') === 'true');
  }, []);

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
      showNotice(`Welcome back, ${user.username}`, 'success');
    } else {
      showNotice('Invalid credentials', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setCurrentUser(null);
    onExit?.();
  };

  const savePosts = (newPosts: BlogPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('cms_blog_posts', JSON.stringify(newPosts));
  };

  const saveExtensions = (newExts: Extension[]) => {
    setExtensions(newExts);
    localStorage.setItem('cms_extensions', JSON.stringify(newExts));
  };

  // AI Content Generator
  const generatePostDraft = async () => {
    if (!postForm.title) return showNotice('Please enter a title first', 'info');
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a professional blog post in HTML format for: "${postForm.title}". Include <h2> and <p> tags. Also provide a 1-sentence excerpt. Return JSON: { "content": "...", "excerpt": "..." }`,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text);
      setPostForm(prev => ({ ...prev, content: data.content, excerpt: data.excerpt }));
      showNotice('AI Draft Generated!', 'success');
    } catch (e) {
      showNotice('AI Generation Failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSavePost = () => {
    if (!postForm.title) return;
    const newPost: BlogPost = {
      id: postForm.id || postForm.title.toLowerCase().replace(/\s+/g, '-'),
      title: postForm.title,
      excerpt: postForm.excerpt || '',
      content: postForm.content || '',
      category: postForm.category || 'General',
      date: postForm.date || new Date().toLocaleDateString(),
      publishDate: postForm.publishDate || new Date().toISOString(),
      readTime: postForm.readTime || '5 min read',
      image: postForm.image || 'https://images.unsplash.com/photo-1496065187959-7f07b8353c55',
      status: postForm.status || 'published'
    };
    const updated = [...posts];
    const idx = updated.findIndex(p => p.id === newPost.id);
    if (idx > -1) updated[idx] = newPost; else updated.unshift(newPost);
    savePosts(updated);
    setIsEditing(false);
    showNotice('Post Saved', 'success');
  };

  const handleSaveExtension = () => {
    if (!extForm.name) return;
    const newExt: Extension = {
      id: extForm.id || extForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: extForm.name,
      shortDescription: extForm.shortDescription || '',
      longDescription: extForm.longDescription || '',
      icon: extForm.icon || '🛠️',
      rating: extForm.rating || 5.0,
      users: extForm.users || '10K+',
      category: extForm.category || 'Utility',
      features: extForm.features || [],
      version: extForm.version || '1.0.0',
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      size: extForm.size || '1.0MB',
      storeUrl: extForm.storeUrl || '#'
    };
    const updated = [...extensions];
    const idx = updated.findIndex(e => e.id === newExt.id);
    if (idx > -1) updated[idx] = newExt; else updated.unshift(newExt);
    saveExtensions(updated);
    setIsEditing(false);
    showNotice('Extension Saved', 'success');
  };

  // UI Components
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-slate-100">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-200">ET</div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 text-center mb-2">ExtensionTo Admin</h1>
          <p className="text-slate-500 text-center mb-8 font-medium">Please sign in to your dashboard</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Username" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-50 font-medium" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
            <input type="password" placeholder="Password" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-50 font-medium" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">SIGN IN</button>
          </form>
          <p className="mt-8 text-xs text-center text-slate-400 font-bold uppercase tracking-widest">Demo: admin / admin123</p>
        </div>
      </div>
    );
  }

  const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredExts = extensions.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} font-sans`}>
      {/* Sidebar */}
      <aside className={`w-72 fixed h-full border-r ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} z-50 flex flex-col shadow-xl`}>
        <div className="p-8 border-b border-inherit flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">E</div>
          <span className="font-bold text-lg tracking-tight">Main Admin</span>
        </div>
        <nav className="flex-grow p-6 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'posts', label: 'Journal Manager', icon: '📄' },
            { id: 'extensions', label: 'Store Manager', icon: '🛍️' },
            { id: 'media', label: 'Media Library', icon: '📁' },
            { id: 'studio', label: 'Asset Studio', icon: '🎬' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(item => (
            <button key={item.id} onClick={() => {setActiveTab(item.id as Tab); setIsEditing(false);}} className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 font-bold text-sm transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
              <span className="text-lg">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-inherit space-y-4">
          <button onClick={() => { setDarkMode(!darkMode); localStorage.setItem('cms_dark_mode', String(!darkMode)); }} className="w-full py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
            {darkMode ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
          </button>
          <button onClick={handleLogout} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">LOGOUT</button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="ml-72 flex-grow p-12 overflow-y-auto">
        {notice && <div className={`fixed top-8 right-8 z-[100] px-8 py-4 rounded-2xl shadow-2xl text-white font-black animate-bounce ${notice.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{notice.message}</div>}

        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <header>
              <h1 className="text-4xl font-black mb-2">Hello, {currentUser.username} 👋</h1>
              <p className="text-slate-500 font-medium">Here's what's happening on ExtensionTo Hub.</p>
            </header>
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Total Posts', val: posts.length, color: 'text-blue-600' },
                { label: 'Extensions', val: extensions.length, color: 'text-emerald-600' },
                { label: 'Views (24h)', val: '1.2K', color: 'text-indigo-600' },
                { label: 'Installs', val: '432', color: 'text-rose-600' },
              ].map((s, i) => (
                <div key={i} className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} shadow-sm`}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.label}</div>
                  <div className={`text-4xl font-black ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
               <button onClick={() => {setEditType('post'); setPostForm({title: '', content: ''}); setIsEditing(true);}} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200">WRITE NEW ARTICLE</button>
               <button onClick={() => {setEditType('extension'); setExtForm({name: ''}); setIsEditing(true);}} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-sm shadow-sm">ADD EXTENSION</button>
            </div>
          </div>
        )}

        {activeTab === 'posts' && !isEditing && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black">Journal Manager</h2>
              <button onClick={() => {setEditType('post'); setPostForm({title: ''}); setIsEditing(true);}} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">New Post</button>
            </header>
            <input type="text" placeholder="Search posts..." className={`w-full p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div className="space-y-4">
              {filteredPosts.map(p => (
                <div key={p.id} className={`p-6 rounded-2xl border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} group`}>
                  <div className="flex items-center gap-6">
                    <img src={p.image} className="w-16 h-16 rounded-xl object-cover" />
                    <div>
                      <div className="font-bold text-lg">{p.title}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{p.category} • {p.date}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => {setPostForm(p); setEditType('post'); setIsEditing(true);}} className="text-blue-600 font-bold text-xs">EDIT</button>
                    <button onClick={() => savePosts(posts.filter(item => item.id !== p.id))} className="text-rose-500 font-bold text-xs">DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'extensions' && !isEditing && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black">Store Inventory</h2>
              <button onClick={() => {setEditType('extension'); setExtForm({name: ''}); setIsEditing(true);}} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">Add Item</button>
            </header>
            <div className="grid grid-cols-2 gap-6">
              {filteredExts.map(ext => (
                <div key={ext.id} className={`p-6 rounded-3xl border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} group hover:scale-[1.02] transition-all`}>
                  <div className="flex items-center gap-5">
                    <div className="text-4xl">{ext.icon}</div>
                    <div>
                      <div className="font-bold text-xl">{ext.name}</div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{ext.category} • {ext.users} users</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => {setExtForm(ext); setEditType('extension'); setIsEditing(true);}} className="text-blue-600 font-bold text-xs">MOD</button>
                    <button onClick={() => saveExtensions(extensions.filter(item => item.id !== ext.id))} className="text-rose-500 font-bold text-xs">DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'studio' && <div className="animate-in fade-in duration-500"><BatchStudio /></div>}

        {isEditing && editType === 'post' && (
          <div className="max-w-4xl animate-in slide-in-from-bottom-12 duration-700">
            <header className="flex justify-between items-center mb-12">
              <button onClick={() => setIsEditing(false)} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← CANCEL EDITING</button>
              <div className="flex gap-4">
                <button onClick={generatePostDraft} disabled={aiLoading} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-black text-xs shadow-xl shadow-violet-100">
                  {aiLoading ? '🧙‍♂️ WRITING...' : '🪄 AI ASSISTANT'}
                </button>
                <button onClick={handleSavePost} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-xs shadow-xl shadow-blue-100">PUBLISH POST</button>
              </div>
            </header>
            <div className={`p-16 rounded-[64px] border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} shadow-2xl space-y-10`}>
              <input type="text" className="w-full bg-transparent text-5xl font-black outline-none placeholder:text-slate-200" placeholder="Headline..." value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                    <input className={`w-full p-5 rounded-2xl border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'} font-bold`} value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})} />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400">Image URL</label>
                    <input className={`w-full p-5 rounded-2xl border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'} font-bold`} value={postForm.image} onChange={e => setPostForm({...postForm, image: e.target.value})} />
                 </div>
              </div>
              <textarea className={`w-full h-[500px] bg-transparent text-xl font-medium leading-relaxed outline-none resize-none border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'} pt-10`} placeholder="Write (HTML supported)..." value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} />
            </div>
          </div>
        )}

        {isEditing && editType === 'extension' && (
          <div className="max-w-4xl animate-in slide-in-from-bottom-12 duration-700">
            <header className="flex justify-between items-center mb-12">
              <button onClick={() => setIsEditing(false)} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← CANCEL EDITING</button>
              <button onClick={handleSaveExtension} className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-xl shadow-emerald-100">SAVE EXTENSION</button>
            </header>
            <div className={`p-16 rounded-[64px] border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} shadow-2xl grid grid-cols-2 gap-12`}>
              <div className="space-y-10">
                <input type="text" className="w-full bg-transparent text-4xl font-black outline-none placeholder:text-slate-200" placeholder="Ext Name..." value={extForm.name} onChange={e => setExtForm({...extForm, name: e.target.value})} />
                <input type="text" className={`w-full p-5 rounded-2xl border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'} font-bold`} placeholder="Icon (Emoji)" value={extForm.icon} onChange={e => setExtForm({...extForm, icon: e.target.value})} />
                <input type="text" className={`w-full p-5 rounded-2xl border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'} font-bold`} placeholder="Store URL" value={extForm.storeUrl} onChange={e => setExtForm({...extForm, storeUrl: e.target.value})} />
              </div>
              <div className="space-y-10">
                <textarea className={`w-full h-80 p-6 rounded-2xl border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'} font-medium outline-none resize-none`} placeholder="Description..." value={extForm.longDescription} onChange={e => setExtForm({...extForm, longDescription: e.target.value})} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
