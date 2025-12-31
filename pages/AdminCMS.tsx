
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import BlogPostDetail from './BlogPostDetail';
import { GoogleGenAI } from "@google/genai";

type ContentType = 'blog' | 'extension';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'edit' | 'preview' | 'json' | 'help'>('list');
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Unsaved'>('Saved');

  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
      localStorage.setItem('cms_extensions', JSON.stringify(extensionItems));
      setSaveStatus('Saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [blogItems, extensionItems]);

  const filteredItems = useMemo(() => {
    const items = activeTab === 'blog' ? blogItems : extensionItems;
    return items.filter((item: any) => 
      (item.title || item.name).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, blogItems, extensionItems, searchQuery]);

  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      // TypeScript fix for process.env
      const apiKey = (process.env as any).API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      const modelName = activeTab === 'blog' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      
      const prompt = activeTab === 'blog' 
        ? `Write a full SEO-optimized blog article in HTML for "${currentEditItem.title}". Include <h2>, <ul>, and <p> tags. Focus on professional tone.`
        : `Write a short marketing description for the browser extension "${currentEditItem.name}".`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });

      const text = response.text || "";
      if (activeTab === 'blog') {
        setCurrentEditItem({ ...currentEditItem, content: text, excerpt: text.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...' });
      } else {
        setCurrentEditItem({ ...currentEditItem, shortDescription: text });
      }
    } catch (error) {
      console.error(error);
      alert("AI Generation failed. Check your API key or connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = (item: any) => {
    setCurrentEditItem({ ...item });
    setView('edit');
  };

  const handleAddNew = () => {
    const newItem = activeTab === 'blog' ? {
      id: `post-${Date.now()}`,
      title: 'New Article',
      excerpt: 'Brief summary...',
      content: '<p>Write content here...</p>',
      category: 'Guides',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      publishDate: new Date().toISOString(),
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
    } : {
      id: `ext-${Date.now()}`,
      name: 'New Tool',
      shortDescription: 'Description...',
      longDescription: 'Full details...',
      icon: '✨',
      rating: 5.0,
      users: '0',
      category: 'Utility',
      features: ['Fast', 'Private'],
      version: '1.0.0',
      lastUpdated: 'New',
      size: '1MB',
      storeUrl: '#'
    };
    setCurrentEditItem(newItem);
    setView('edit');
  };

  const handleSaveToLocal = () => {
    if (activeTab === 'blog') {
      const exists = blogItems.findIndex(i => i.id === currentEditItem.id);
      if (exists !== -1) {
        const updated = [...blogItems];
        updated[exists] = currentEditItem;
        setBlogItems(updated);
      } else {
        setBlogItems([currentEditItem, ...blogItems]);
      }
    } else {
      const exists = extensionItems.findIndex(i => i.id === currentEditItem.id);
      if (exists !== -1) {
        const updated = [...extensionItems];
        updated[exists] = currentEditItem;
        setExtensionItems(updated);
      } else {
        setExtensionItems([currentEditItem, ...extensionItems]);
      }
    }
    setView('list');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-72 bg-gray-900 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-8 border-b border-gray-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/30 italic">ET</div>
          <div>
            <h2 className="font-black tracking-tight text-lg">ExtensionTo</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Control Panel</p>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2">
          <button 
            onClick={() => {setActiveTab('blog'); setView('list');}} 
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            📄 Articles
          </button>
          <button 
            onClick={() => {setActiveTab('extension'); setView('list');}} 
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            🧩 Extensions
          </button>
          <div className="pt-8 opacity-20 border-t border-gray-700 my-4"></div>
          <button onClick={() => setView('json')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold ${view === 'json' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
            🚀 Export Data
          </button>
        </nav>
        <div className="p-6">
           <div className="bg-gray-800 p-4 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
             Vercel Ready System
           </div>
        </div>
      </aside>

      <main className="flex-grow ml-72 p-12 overflow-y-auto">
        {view === 'list' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="flex justify-between items-center mb-12">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Library Manager</h1>
              <button onClick={handleAddNew} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">+ Add New Content</button>
            </header>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Title / Name</th>
                      <th className="px-8 py-4">Category</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-6 font-bold">{item.title || item.name}</td>
                        <td className="px-8 py-6">
                           <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase">{item.category}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => handleEdit(item)} className="text-blue-600 font-bold hover:underline">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
             <header className="flex justify-between items-center mb-10">
               <button onClick={() => setView('list')} className="text-gray-400 font-bold hover:text-black">← Cancel</button>
               <div className="flex gap-4">
                 <button onClick={generateAIContent} disabled={isGenerating} className="px-6 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold border border-purple-100 disabled:opacity-50">
                   {isGenerating ? 'AI Thinking...' : '✨ Magic Write'}
                 </button>
                 <button onClick={handleSaveToLocal} className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Save Entry</button>
               </div>
             </header>

             <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</label>
                    <input 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-lg" 
                      value={activeTab === 'blog' ? currentEditItem.title : currentEditItem.name}
                      onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, title: e.target.value}) : setCurrentEditItem({...currentEditItem, name: e.target.value})}
                    />
                    
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pt-4">Content (HTML)</label>
                    <textarea 
                      className="w-full p-6 bg-gray-50 rounded-xl border border-gray-100 h-[400px] font-mono text-sm"
                      value={activeTab === 'blog' ? currentEditItem.content : currentEditItem.shortDescription}
                      onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, content: e.target.value}) : setCurrentEditItem({...currentEditItem, shortDescription: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                   <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
                      <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Settings</h4>
                      <input className="w-full p-3 bg-gray-50 rounded-lg text-sm font-bold" placeholder="Category" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                      <input className="w-full p-3 bg-gray-50 rounded-lg text-sm" placeholder="Image/Icon" value={currentEditItem.image || currentEditItem.icon} onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, image: e.target.value}) : setCurrentEditItem({...currentEditItem, icon: e.target.value})} />
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'json' && (
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-[40px] p-12 text-white shadow-3xl">
            <h2 className="text-2xl font-black mb-6">Production JSON</h2>
            <p className="text-gray-400 text-sm mb-8">Copy this block into <code>constants.tsx</code> to make changes permanent on the live site.</p>
            <pre className="bg-black/50 p-8 rounded-2xl overflow-auto h-[400px] font-mono text-blue-400 text-xs leading-relaxed">
              {JSON.stringify(activeTab === 'blog' ? blogItems : extensionItems, null, 2)}
            </pre>
            <button onClick={() => setView('list')} className="mt-8 text-gray-500 font-bold hover:text-white">Close Export</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
