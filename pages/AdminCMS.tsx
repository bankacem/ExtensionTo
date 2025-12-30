
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

  // Persistence logic with "Saving" indicator
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

  // AI Brain for the CMS
  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const modelName = activeTab === 'blog' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      
      const prompt = activeTab === 'blog' 
        ? `Write a full SEO-optimized blog article in HTML for "${currentEditItem.title}". Include <h2>, <ul>, and <p> tags. Topic: Browser Privacy & Productivity.`
        : `Write a 160-character marketing description for a tool named "${currentEditItem.name}". Focus on benefits for professionals.`;

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
      alert("Please ensure your API Key is active in the environment.");
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
      title: 'Untilted Article',
      excerpt: 'Short summary here...',
      content: '<p>Start writing your story...</p>',
      category: 'Guides',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      publishDate: new Date().toISOString(),
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
    } : {
      id: `ext-${Date.now()}`,
      name: 'New Extension',
      shortDescription: 'Brief description...',
      longDescription: 'Full details here...',
      icon: '✨',
      rating: 5.0,
      users: '100+',
      category: 'Utility',
      features: ['Privacy First', 'Fast'],
      version: '1.0.0',
      lastUpdated: 'Current Month',
      size: '1.2MB',
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      {/* Dynamic Sidebar */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-8 border-b border-gray-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/30 italic">ET</div>
          <div>
            <h2 className="font-black tracking-tight text-lg">ExtensionTo</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Admin Dashboard</p>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2">
          <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 ml-2">Content Manager</div>
          <button 
            onClick={() => {setActiveTab('blog'); setView('list');}} 
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <span className="text-lg">📄</span> Articles
          </button>
          <button 
            onClick={() => {setActiveTab('extension'); setView('list');}} 
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <span className="text-lg">🧩</span> Extensions
          </button>
          
          <div className="pt-10 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 ml-2">Release Control</div>
          <button 
            onClick={() => setView('json')} 
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${view === 'json' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <span className="text-lg">🚀</span> Export Data
          </button>
          <button 
            onClick={() => setView('help')} 
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <span className="text-lg">❓</span> How to Deploy
          </button>
        </nav>

        <div className="p-6 border-t border-gray-800">
          <div className="bg-gray-800/50 p-4 rounded-2xl flex items-center gap-3 border border-gray-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-gray-300">System Live: Vercel Static</span>
          </div>
        </div>
      </aside>

      <main className="flex-grow ml-72 p-12 overflow-y-auto">
        {view === 'list' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Managing {activeTab}s</h1>
                <p className="text-gray-500 font-medium mt-2">Create and edit the core content of your static directory.</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${saveStatus === 'Saved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {saveStatus}
                </span>
                <button 
                  onClick={handleAddNew} 
                  className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Add New Entry
                </button>
              </div>
            </header>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
                  <div className="relative flex-grow">
                    <input 
                      type="text" 
                      placeholder="Search entries..."
                      className="w-full pl-12 pr-6 py-3 rounded-xl border border-gray-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="px-8 py-5">Entry Details</th>
                        <th className="px-8 py-5">Category</th>
                        <th className="px-8 py-5 text-right">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredItems.map((item: any) => (
                        <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                {item.icon || '📄'}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{item.title || item.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{item.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-tight">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 font-bold text-sm hover:underline"
                            >
                              Edit Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {view === 'edit' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
             <header className="flex justify-between items-center mb-12">
               <div>
                  <button onClick={() => setView('list')} className="text-gray-400 font-bold text-xs hover:text-gray-900 mb-2 flex items-center gap-1">
                    ← Back to Library
                  </button>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editing Entry</h1>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setView('preview')} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all">Preview Mode</button>
                  <button onClick={handleSaveToLocal} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20">Commit Changes</button>
               </div>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Main Content</h3>
                      <button 
                        onClick={generateAIContent}
                        disabled={isGenerating}
                        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isGenerating ? 'AI is Thinking...' : '✨ Autocomplete with AI'}
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Title</label>
                        <input 
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20"
                          value={activeTab === 'blog' ? currentEditItem.title : currentEditItem.name}
                          onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, title: e.target.value}) : setCurrentEditItem({...currentEditItem, name: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Article Body (HTML Supported)</label>
                        <textarea 
                          className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[32px] h-[500px] font-mono text-sm leading-relaxed outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20"
                          value={activeTab === 'blog' ? currentEditItem.content : currentEditItem.shortDescription}
                          onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, content: e.target.value}) : setCurrentEditItem({...currentEditItem, shortDescription: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Meta Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Tag</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Feature Image / Icon</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm" value={currentEditItem.image || currentEditItem.icon} onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, image: e.target.value}) : setCurrentEditItem({...currentEditItem, icon: e.target.value})} />
                      </div>
                      {activeTab === 'extension' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Store URL</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm" value={currentEditItem.storeUrl} onChange={e => setCurrentEditItem({...currentEditItem, storeUrl: e.target.value})} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-600 p-8 rounded-[32px] text-white space-y-4 shadow-xl shadow-blue-500/20">
                    <h4 className="font-black uppercase text-xs tracking-widest opacity-60">SEO Tip</h4>
                    <p className="text-sm font-bold leading-relaxed">
                      "Using Gemini to generate summaries helps in ranking higher on Google by adding semantic keywords naturally."
                    </p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {view === 'json' && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-gray-900 p-12 rounded-[48px] shadow-3xl border border-gray-800">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Export for Production</h2>
                  <p className="text-gray-500 text-sm mt-1">Copy this data to your <code>constants.tsx</code> file to update the live site.</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(activeTab === 'blog' ? blogItems : extensionItems, null, 2));
                    alert('Data copied to clipboard! Update your code to deploy.');
                  }}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
                >
                  Copy Data Payload
                </button>
              </div>
              <div className="bg-gray-800 rounded-[32px] p-8 border border-gray-700">
                <pre className="text-blue-400 font-mono text-[11px] h-[500px] overflow-auto custom-scrollbar leading-relaxed">
                  {JSON.stringify(activeTab === 'blog' ? blogItems : extensionItems, null, 2)}
                </pre>
              </div>
              <div className="mt-10 text-center">
                 <button onClick={() => setView('list')} className="text-gray-500 font-bold text-xs hover:text-white transition-colors">Return to Dashboard</button>
              </div>
            </div>
          </div>
        )}

        {view === 'help' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-black text-gray-900 mb-12 tracking-tight text-center">How to Deploy to Vercel</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { step: "01", title: "Update constants.tsx", text: "Go to Export Data, copy the JSON, and replace the arrays in your code." },
                 { step: "02", title: "Push to GitHub", text: "Sync your project with your GitHub repository. Vercel tracks this automatically." },
                 { step: "03", title: "Live Updates", text: "Vercel will detect the push and rebuild your site in seconds. Pure magic." }
               ].map((item, idx) => (
                 <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                   <span className="text-5xl font-black text-blue-50 opacity-20 block">{item.step}</span>
                   <h3 className="font-black text-gray-900 text-lg">{item.title}</h3>
                   <p className="text-gray-500 text-sm leading-relaxed font-medium">{item.text}</p>
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'preview' && currentEditItem && (
          <div className="bg-white rounded-[48px] shadow-3xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-gray-900 p-4 flex justify-between items-center">
              <div className="flex gap-2 ml-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sandbox Environment</span>
              <button onClick={() => setView('edit')} className="bg-white/10 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mr-4">Close Preview</button>
            </div>
            <div className="p-16 max-h-[85vh] overflow-y-auto">
               {activeTab === 'blog' ? (
                 <BlogPostDetail post={currentEditItem} onBack={() => setView('edit')} />
               ) : (
                 <div className="text-center max-w-2xl mx-auto py-20">
                    <div className="text-8xl mb-8">{currentEditItem.icon}</div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">{currentEditItem.name}</h2>
                    <p className="text-xl text-gray-500 mb-10 leading-relaxed font-medium">{currentEditItem.shortDescription}</p>
                    <button className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl shadow-blue-500/30">Get Extension Now</button>
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
