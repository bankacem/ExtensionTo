
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
  const [view, setView] = useState<'list' | 'edit' | 'preview' | 'json' | 'vercel'>('list');
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
  }, [blogItems]);

  useEffect(() => {
    localStorage.setItem('cms_extensions', JSON.stringify(extensionItems));
  }, [extensionItems]);

  const filteredItems = useMemo(() => {
    const items = activeTab === 'blog' ? blogItems : extensionItems;
    return items.filter((item: any) => 
      (item.title || item.name).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, blogItems, extensionItems, searchQuery]);

  // AI Content Generation with Gemini
  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const prompt = activeTab === 'blog' 
        ? `Act as a senior tech writer. Write a comprehensive blog article in HTML format for the title: "${currentEditItem.title}". Use semantic tags like <h2>, <p>, and <ul>. The tone should be authoritative yet accessible. Focus on browser security and privacy trends in 2024.`
        : `Generate a high-converting, professional short description (max 160 chars) for a browser extension named "${currentEditItem.name}". Highlight its unique selling points: Privacy, Speed, and User Experience.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 0.95,
            topK: 64
        }
      });

      const text = response.text || "";
      if (activeTab === 'blog') {
        setCurrentEditItem({ ...currentEditItem, content: text });
      } else {
        setCurrentEditItem({ ...currentEditItem, shortDescription: text });
      }
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("AI limit reached or API key missing. Please check your console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = (item: any) => {
    setCurrentEditItem(item);
    setView('edit');
  };

  const handleAddNew = () => {
    const newItem = activeTab === 'blog' ? {
      id: `post-${Date.now()}`,
      title: 'New Smart Article',
      excerpt: '',
      content: '',
      category: 'Guides',
      date: new Date().toLocaleDateString(),
      publishDate: new Date().toISOString(),
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
    } : {
      id: `ext-${Date.now()}`,
      name: 'New Smart Extension',
      shortDescription: '',
      longDescription: '',
      icon: '🚀',
      rating: 5.0,
      users: '0',
      category: 'Utility',
      features: ['Privacy Shield', 'Ultra Light'],
      version: '1.0.0',
      lastUpdated: 'Today',
      size: '1.0MB',
      storeUrl: ''
    };
    setCurrentEditItem(newItem);
    setView('edit');
  };

  const handleSave = () => {
    if (activeTab === 'blog') {
      const exists = blogItems.find(i => i.id === currentEditItem.id);
      if (exists) {
        setBlogItems(blogItems.map(i => i.id === currentEditItem.id ? currentEditItem : i));
      } else {
        setBlogItems([currentEditItem, ...blogItems]);
      }
    } else {
      const exists = extensionItems.find(i => i.id === currentEditItem.id);
      if (exists) {
        setExtensionItems(extensionItems.map(i => i.id === currentEditItem.id ? currentEditItem : i));
      } else {
        setExtensionItems([currentEditItem, ...extensionItems]);
      }
    }
    setView('list');
  };

  return (
    <div className="flex min-h-screen bg-[#F7F9FA]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1B2733] text-gray-300 flex flex-col fixed inset-y-0 shadow-2xl z-20">
        <div className="p-6 border-b border-gray-700/50 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">C</div>
          <span className="font-bold text-white tracking-tight">Contentful Hub</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-1">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Editor</div>
          <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${activeTab === 'blog' && view === 'list' ? 'bg-[#2D3E4F] text-white' : 'hover:bg-[#243444]'}`}>
            <span>📝</span> Blog Posts
          </button>
          <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${activeTab === 'extension' && view === 'list' ? 'bg-[#2D3E4F] text-white' : 'hover:bg-[#243444]'}`}>
            <span>🧩</span> Extensions
          </button>
          
          <div className="pt-8 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Production</div>
          <button onClick={() => setView('vercel')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${view === 'vercel' ? 'bg-[#2D3E4F] text-white' : 'hover:bg-[#243444]'}`}>
            <span>▲</span> Vercel Deploy
          </button>
          <button onClick={() => setView('json')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${view === 'json' ? 'bg-[#2D3E4F] text-white' : 'hover:bg-[#243444]'}`}>
            <span>🚀</span> Export JSON
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700/50">
          <div className="bg-gray-800/50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">ADM</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Vercel Admin</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] text-gray-500 uppercase">Live Preview</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-grow ml-64 p-8">
        {view === 'list' && (
          <>
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-black text-gray-900 capitalize tracking-tight">{activeTab} Entries</h1>
                <p className="text-sm text-gray-500">Edit content for your static production site.</p>
              </div>
              <button onClick={handleAddNew} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-500/20">
                <span>+</span> Create New
              </button>
            </header>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                <input 
                  type="text" 
                  placeholder="Filter content..."
                  className="flex-grow pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Title / Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase">Local</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.title || item.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{item.category}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 font-bold text-xs hover:underline">Edit Entry</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === 'edit' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h2 className="font-bold text-gray-900">Content Editor</h2>
                  <button onClick={generateAIContent} disabled={isGenerating} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2">
                    {isGenerating ? 'Generating...' : '✨ Write with AI'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entry ID (Unique)</label>
                    <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={currentEditItem.id} readOnly />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Display Title</label>
                    <input 
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                      value={activeTab === 'blog' ? currentEditItem.title : currentEditItem.name}
                      onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, title: e.target.value}) : setCurrentEditItem({...currentEditItem, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description / Body</label>
                    <textarea 
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm h-64 font-mono focus:border-blue-500 outline-none"
                      value={activeTab === 'blog' ? currentEditItem.content : currentEditItem.shortDescription}
                      onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, content: e.target.value}) : setCurrentEditItem({...currentEditItem, shortDescription: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900">Publishing</h3>
                <button onClick={handleSave} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20">Save Locally</button>
                <button onClick={() => setView('preview')} className="w-full bg-gray-50 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-100">Live Preview</button>
                <button onClick={() => setView('list')} className="w-full text-center text-xs text-gray-400 font-bold hover:text-gray-900">Discard Changes</button>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900">Settings</h3>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                  <input className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Featured Asset (Emoji/URL)</label>
                  <input className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm" value={currentEditItem.image || currentEditItem.icon} onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, image: e.target.value}) : setCurrentEditItem({...currentEditItem, icon: e.target.value})} />
                </div>
              </div>
            </aside>
          </div>
        )}

        {view === 'vercel' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95">
            <div className="bg-white p-10 rounded-[32px] border border-gray-200 shadow-xl">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">▲</div>
              <h2 className="text-3xl font-black text-center mb-4">Deploy to Vercel</h2>
              <p className="text-center text-gray-500 mb-10 leading-relaxed">Since your site is hosted on Vercel as a static app, you need to push your code changes to GitHub to update the production site.</p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-gray-900">Export JSON</h4>
                    <p className="text-sm text-gray-500">Go to the "Export JSON" tab and copy the entire code for {activeTab}.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-gray-900">Update Code</h4>
                    <p className="text-sm text-gray-500">Open your project in VS Code, find <code>constants.tsx</code>, and replace the {activeTab === 'blog' ? 'BLOG_POSTS' : 'EXTENSIONS'} array with the new data.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-gray-900">Push to GitHub</h4>
                    <p className="text-sm text-gray-500">Commit and push your changes. Vercel will detect the push and automatically redeploy your site in 30 seconds.</p>
                  </div>
                </div>
              </div>
              
              <button onClick={() => setView('json')} className="w-full mt-12 bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all">Go to Export Tab</button>
            </div>
          </div>
        )}

        {view === 'json' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-top-4">
            <div className="bg-[#1B2733] p-8 rounded-[32px] shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Production JSON Payload</h2>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(activeTab === 'blog' ? blogItems : extensionItems, null, 2));
                    alert('Data copied! Now paste it into constants.tsx');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  Copy All Content
                </button>
              </div>
              <pre className="text-blue-400 font-mono text-[10px] leading-relaxed h-[500px] overflow-auto custom-scrollbar">
                {JSON.stringify(activeTab === 'blog' ? blogItems : extensionItems, null, 2)}
              </pre>
              <div className="mt-8 flex justify-center">
                <button onClick={() => setView('list')} className="text-gray-400 hover:text-white font-bold text-xs">Back to entries</button>
              </div>
            </div>
          </div>
        )}

        {view === 'preview' && (
          <div className="bg-white rounded-[40px] border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="bg-gray-900 p-4 flex justify-between items-center">
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Browser Sandbox Preview</span>
                <button onClick={() => setView('edit')} className="text-white bg-white/10 px-3 py-1 rounded text-[10px] font-bold">Exit Preview</button>
             </div>
             <div className="p-12 overflow-y-auto max-h-[80vh]">
                {activeTab === 'blog' ? (
                  <BlogPostDetail post={currentEditItem} onBack={() => setView('edit')} />
                ) : (
                  <div className="max-w-md mx-auto text-center">
                    <div className="text-8xl mb-8">{currentEditItem.icon}</div>
                    <h2 className="text-4xl font-black mb-4">{currentEditItem.name}</h2>
                    <p className="text-gray-500 text-lg mb-8">{currentEditItem.shortDescription}</p>
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold">Add to Chrome</button>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
