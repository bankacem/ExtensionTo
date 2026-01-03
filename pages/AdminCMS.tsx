
import React, { useState, useEffect } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';

type NoticeType = 'success' | 'error' | 'info';

const AdminCMS: React.FC = () => {
  // State for Navigation
  const [activeView, setActiveView] = useState<'overview' | 'blog' | 'store' | 'settings'>('overview');
  
  // Data State
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('cms_blog_posts');
    return saved ? JSON.parse(saved) : STATIC_POSTS;
  });

  const [extensions, setExtensions] = useState<Extension[]>(() => {
    const saved = localStorage.getItem('cms_extensions');
    return saved ? JSON.parse(saved) : STATIC_EXTENSIONS;
  });

  // Editor State
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [editingExt, setEditingExt] = useState<Partial<Extension> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: NoticeType } | null>(null);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('cms_blog_posts', JSON.stringify(posts));
    localStorage.setItem('cms_extensions', JSON.stringify(extensions));
  }, [posts, extensions]);

  const showNotice = (message: string, type: NoticeType = 'info') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3000);
  };

  // CRUD Operations for Blog
  const handleSavePost = () => {
    if (!editingPost?.title) return showNotice('Title is required', 'error');
    
    const newPost: BlogPost = {
      id: editingPost.id || `post-${Date.now()}`,
      title: editingPost.title || '',
      excerpt: editingPost.excerpt || '',
      content: editingPost.content || '',
      category: editingPost.category || 'General',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
      publishDate: editingPost.publishDate || new Date().toISOString(),
      readTime: editingPost.readTime || '5 min read',
      image: editingPost.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
    };

    const updated = [...posts];
    const index = updated.findIndex(p => p.id === newPost.id);
    if (index !== -1) updated[index] = newPost;
    else updated.unshift(newPost);

    setPosts(updated);
    setEditingPost(null);
    setIsEditing(false);
    showNotice('Article Published Successfully!', 'success');
  };

  // CRUD Operations for Store
  const handleSaveExtension = () => {
    if (!editingExt?.name) return showNotice('Extension name required', 'error');
    const newExt: Extension = {
      id: editingExt.id || `ext-${Date.now()}`,
      name: editingExt.name || '',
      shortDescription: editingExt.shortDescription || '',
      longDescription: editingExt.longDescription || '',
      icon: editingExt.icon || '🛠️',
      rating: editingExt.rating || 5.0,
      users: editingExt.users || '1K+',
      category: editingExt.category || 'Utility',
      features: editingExt.features || [],
      version: editingExt.version || '1.0.0',
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      size: editingExt.size || '1.2MB',
      storeUrl: editingExt.storeUrl || '#'
    };
    const updated = [...extensions];
    const index = updated.findIndex(e => e.id === newExt.id);
    if (index !== -1) updated[index] = newExt;
    else updated.unshift(newExt);
    setExtensions(updated);
    setEditingExt(null);
    setIsEditing(false);
    showNotice('Extension Updated!', 'success');
  };

  // Export/Import
  const handleExport = () => {
    const data = { posts, extensions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extensionto_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-gray-800 font-sans flex" dir="ltr">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1E1E2C] text-gray-300 flex flex-col fixed h-full shadow-2xl">
        <div className="p-6 bg-[#161625] flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-white">ET</div>
          <span className="font-bold text-white tracking-tight">Main Admin</span>
        </div>
        <nav className="flex-grow p-4 space-y-2 mt-4">
          <button onClick={() => {setActiveView('overview'); setIsEditing(false);}} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeView === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}>
            <span>📊</span> Dashboard
          </button>
          <button onClick={() => {setActiveView('blog'); setIsEditing(false);}} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeView === 'blog' ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}>
            <span>📝</span> Posts
          </button>
          <button onClick={() => {setActiveView('store'); setIsEditing(false);}} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeView === 'store' ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}>
            <span>🛍️</span> Store
          </button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => window.location.hash = '#home'} className="w-full py-3 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest text-center">
            ← Exit to Site
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-grow p-10">
        {notice && (
          <div className={`fixed top-6 right-6 px-6 py-3 rounded-xl shadow-2xl text-white font-bold animate-bounce z-[100] ${notice.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notice.message}
          </div>
        )}

        {activeView === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-gray-900">System Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-black uppercase mb-2">Total Posts</div>
                <div className="text-4xl font-black text-gray-900">{posts.length}</div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-black uppercase mb-2">Extensions</div>
                <div className="text-4xl font-black text-gray-900">{extensions.length}</div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-black uppercase mb-2">Installs</div>
                <div className="text-4xl font-black text-blue-600">842</div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-black uppercase mb-2">Page Views</div>
                <div className="text-4xl font-black text-indigo-600">12.5K</div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button onClick={handleExport} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Export Site Backup (JSON)</button>
              <button onClick={() => setActiveView('blog')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">Manage Content</button>
            </div>
          </div>
        )}

        {activeView === 'blog' && !isEditing && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-gray-900">Journal Manager</h1>
              <button onClick={() => {setEditingPost({title: '', content: ''}); setIsEditing(true);}} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">Add New Post</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-black uppercase text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{post.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{post.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{post.date}</td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <button onClick={() => {setEditingPost(post); setIsEditing(true);}} className="text-blue-600 font-bold text-xs hover:underline">Edit</button>
                        <button onClick={() => setPosts(posts.filter(p => p.id !== post.id))} className="text-red-500 font-bold text-xs hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'store' && !isEditing && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-gray-900">Store Inventory</h1>
              <button onClick={() => {setEditingExt({name: '', features: []}); setIsEditing(true);}} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">Add Extension</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extensions.map(ext => (
                <div key={ext.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{ext.icon}</div>
                    <div>
                      <div className="font-bold text-gray-900">{ext.name}</div>
                      <div className="text-xs text-gray-400 uppercase font-black">{ext.category} • {ext.users} users</div>
                    </div>
                  </div>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => {setEditingExt(ext); setIsEditing(true);}} className="text-blue-600 font-bold text-xs">Modify</button>
                    <button onClick={() => setExtensions(extensions.filter(e => e.id !== ext.id))} className="text-red-500 font-bold text-xs">Archive</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isEditing && activeView === 'blog' && (
          <div className="max-w-4xl bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-black mb-8">Edit Article</h2>
            <div className="space-y-6">
              <input className="w-full text-3xl font-black border-none outline-none focus:ring-0 placeholder:text-gray-200" placeholder="Post Title" value={editingPost?.title} onChange={e => setEditingPost({...editingPost, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold" placeholder="Category (e.g. Security)" value={editingPost?.category} onChange={e => setEditingPost({...editingPost, category: e.target.value})} />
                <input className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold" placeholder="Image URL / Emoji" value={editingPost?.image} onChange={e => setEditingPost({...editingPost, image: e.target.value})} />
              </div>
              <textarea className="w-full h-96 p-8 bg-gray-50 rounded-2xl border border-gray-200 text-lg font-medium leading-relaxed outline-none" placeholder="Content (HTML supported)..." value={editingPost?.content} onChange={e => setEditingPost({...editingPost, content: e.target.value})} />
              <div className="flex gap-4 pt-6">
                <button onClick={handleSavePost} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm">Save & Publish</button>
                <button onClick={() => setIsEditing(false)} className="px-10 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isEditing && activeView === 'store' && (
          <div className="max-w-4xl bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-black mb-8">Modify Extension</h2>
            <div className="grid grid-cols-2 gap-6">
              <input className="col-span-2 w-full p-5 bg-gray-50 rounded-2xl border border-gray-200 font-bold" placeholder="Extension Name" value={editingExt?.name} onChange={e => setEditingExt({...editingExt, name: e.target.value})} />
              <input className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm" placeholder="Icon (Emoji)" value={editingExt?.icon} onChange={e => setEditingExt({...editingExt, icon: e.target.value})} />
              <input className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm" placeholder="Category" value={editingExt?.category} onChange={e => setEditingExt({...editingExt, category: e.target.value})} />
              <textarea className="col-span-2 w-full h-32 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm" placeholder="Short Description" value={editingExt?.shortDescription} onChange={e => setEditingExt({...editingExt, shortDescription: e.target.value})} />
              <div className="col-span-2 flex gap-4">
                <button onClick={handleSaveExtension} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="px-10 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm">Discard</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
