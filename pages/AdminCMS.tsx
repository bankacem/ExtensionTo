
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

type ContentType = 'blog' | 'extension';

declare global {
  interface Window {
    process: {
      env: {
        API_KEY?: string;
      };
    };
  }
}

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
  const [isFetching, setIsFetching] = useState(false);
  const [fetchUrl, setFetchUrl] = useState('');
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

  // ميزة الـ Auto-Magic Fetcher الجديدة
  const autoFetchExtension = async () => {
    if (!fetchUrl.includes('chromewebstore.google.com')) {
      alert('Please enter a valid Chrome Web Store URL');
      return;
    }

    setIsFetching(true);
    try {
      const apiKey = process.env.API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Find all professional details for the Chrome Extension at this URL: ${fetchUrl}. 
      Return the data in a strict JSON format with these exact keys: 
      name, shortDescription, longDescription, rating (number), users (string like "10k+"), category, version, lastUpdated, size.
      Use Google Search to ensure the rating and user count are current.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              shortDescription: { type: Type.STRING },
              longDescription: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              users: { type: Type.STRING },
              category: { type: Type.STRING },
              version: { type: Type.STRING },
              lastUpdated: { type: Type.STRING },
              size: { type: Type.STRING }
            },
            required: ["name", "shortDescription", "longDescription", "rating", "users", "category"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      setCurrentEditItem({
        ...currentEditItem,
        ...data,
        storeUrl: fetchUrl,
        features: currentEditItem.features || ['Fetched via AI']
      });
      setFetchUrl('');
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Failed to fetch extension data. Make sure your API key is correct.");
    } finally {
      setIsFetching(false);
    }
  };

  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      const apiKey = process.env.API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      const modelName = activeTab === 'blog' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      
      const prompt = activeTab === 'blog' 
        ? `Write a full SEO-optimized blog article in HTML for "${currentEditItem.title}". Include <h2>, <ul>, and <p> tags. Focus on a professional, expert tone.`
        : `Write a compelling 150-character marketing description for "${currentEditItem.name}".`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });

      const text = response.text || "";
      if (activeTab === 'blog') {
        setCurrentEditItem({ 
          ...currentEditItem, 
          content: text, 
          excerpt: text.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...' 
        });
      } else {
        setCurrentEditItem({ ...currentEditItem, shortDescription: text });
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("AI Generation failed.");
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
      excerpt: 'Short summary...',
      content: '<p>Start writing...</p>',
      category: 'Guides',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      publishDate: new Date().toISOString(),
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
    } : {
      id: `ext-${Date.now()}`,
      name: '',
      shortDescription: '',
      longDescription: '',
      icon: '✨',
      rating: 5.0,
      users: '0',
      category: 'Utility',
      features: [],
      version: '1.0.0',
      lastUpdated: 'New',
      size: '1MB',
      storeUrl: ''
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
      <aside className="w-72 bg-gray-900 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-8 border-b border-gray-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black italic shadow-lg shadow-blue-500/20">ET</div>
          <div>
            <h2 className="font-black tracking-tight text-lg">ExtensionTo</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global CMS</p>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2">
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
          <div className="pt-10 opacity-20 border-t border-gray-700 my-4"></div>
          <button onClick={() => setView('json')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold ${view === 'json' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
            🚀 Export JSON Data
          </button>
        </nav>

        <div className="p-6">
          <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-800 flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase text-gray-400">Cloudflare Optimized</span>
          </div>
        </div>
      </aside>

      <main className="flex-grow ml-72 p-12 overflow-y-auto">
        {view === 'list' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="flex justify-between items-center mb-12">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Content Library</h1>
                <p className="text-gray-500 font-medium mt-1">Manage everything on extensionto.com</p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 px-3 py-1 rounded-full">{saveStatus}</span>
                 <button onClick={handleAddNew} className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200">+ Add New</button>
              </div>
            </header>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                  <input 
                    type="text" 
                    placeholder="Search by title..."
                    className="w-full max-w-md px-6 py-3 rounded-xl border border-gray-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                    <tr>
                      <th className="px-8 py-5">Item</th>
                      <th className="px-8 py-5">Category</th>
                      <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                              {item.icon || '📄'}
                            </div>
                            <span className="font-bold text-gray-900">{item.title || item.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-tight">
                              {item.category}
                            </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => handleEdit(item)} className="text-blue-600 font-bold text-sm hover:underline">Edit Entry</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
             <header className="flex justify-between items-center mb-10">
               <div>
                  <button onClick={() => setView('list')} className="text-gray-400 font-bold text-xs hover:text-gray-900 mb-2 flex items-center gap-1">← Library</button>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">Modify Content</h1>
               </div>
               <div className="flex gap-4">
                  <button onClick={generateAIContent} disabled={isGenerating} className="px-6 py-3 bg-purple-50 text-purple-600 rounded-xl font-bold border border-purple-100 disabled:opacity-50">
                    {isGenerating ? 'Gemini AI is writing...' : '✨ AI Smart Write'}
                  </button>
                  <button onClick={handleSaveToLocal} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20">Commit Changes</button>
               </div>
             </header>

             {/* Auto-Magic Fetcher UI Section */}
             {activeTab === 'extension' && (
               <div className="mb-10 p-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[32px] text-white shadow-2xl shadow-blue-200">
                 <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="shrink-0 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">✨</div>
                   <div className="flex-grow">
                     <h3 className="text-xl font-black tracking-tight mb-1">Auto-Magic Fetcher</h3>
                     <p className="text-blue-100 text-sm font-medium">Paste a Chrome Web Store URL to automatically populate all fields using Gemini AI.</p>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                     <input 
                       type="text" 
                       placeholder="https://chromewebstore.google.com/..."
                       className="flex-grow md:w-80 px-6 py-3.5 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white focus:text-gray-900 transition-all font-medium placeholder:text-blue-200 text-sm"
                       value={fetchUrl}
                       onChange={(e) => setFetchUrl(e.target.value)}
                     />
                     <button 
                       onClick={autoFetchExtension}
                       disabled={isFetching || !fetchUrl}
                       className="px-8 py-3.5 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 disabled:opacity-50 transition-all shadow-lg text-sm whitespace-nowrap"
                     >
                       {isFetching ? 'Scouting Store...' : 'Fetch Data'}
                     </button>
                   </div>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Heading</label>
                    <input 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xl outline-none focus:border-blue-500/30 transition-all"
                      value={activeTab === 'blog' ? currentEditItem.title : currentEditItem.name}
                      onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, title: e.target.value}) : setCurrentEditItem({...currentEditItem, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description / Content (Markdown or HTML)</label>
                    <textarea 
                      className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[32px] h-[500px] font-mono text-sm leading-relaxed outline-none focus:border-blue-500/30 transition-all"
                      value={activeTab === 'blog' ? currentEditItem.content : currentEditItem.shortDescription}
                      onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, content: e.target.value}) : setCurrentEditItem({...currentEditItem, shortDescription: e.target.value})}
                    />
                  </div>
                  {activeTab === 'extension' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Long Description</label>
                      <textarea 
                        className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[32px] h-[300px] text-sm leading-relaxed outline-none focus:border-blue-500/30 transition-all"
                        value={currentEditItem.longDescription}
                        onChange={e => setCurrentEditItem({...currentEditItem, longDescription: e.target.value})}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                   <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                      <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Category</label>
                          <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" value={currentEditItem.category} onChange={e => setCurrentEditItem({...currentEditItem, category: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{activeTab === 'blog' ? 'Image URL' : 'Icon (Emoji or URL)'}</label>
                          <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm" value={currentEditItem.image || currentEditItem.icon} onChange={e => activeTab === 'blog' ? setCurrentEditItem({...currentEditItem, image: e.target.value}) : setCurrentEditItem({...currentEditItem, icon: e.target.value})} />
                        </div>
                        {activeTab === 'extension' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Rating</label>
                                <input type="number" step="0.1" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" value={currentEditItem.rating} onChange={e => setCurrentEditItem({...currentEditItem, rating: parseFloat(e.target.value)})} />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Users</label>
                                <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" value={currentEditItem.users} onChange={e => setCurrentEditItem({...currentEditItem, users: e.target.value})} />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Store URL</label>
                              <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono" value={currentEditItem.storeUrl} onChange={e => setCurrentEditItem({...currentEditItem, storeUrl: e.target.value})} />
                            </div>
                          </>
                        )}
                      </div>
                   </div>
                   <div className="bg-blue-600 p-8 rounded-[32px] text-white shadow-xl shadow-blue-500/20">
                     <p className="text-sm font-bold leading-relaxed">
                       🚀 TIP: The Auto-Fetcher uses Gemini Search Grounding to find real-time data directly from the Web Store.
                     </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'json' && (
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-[48px] p-12 text-white animate-in zoom-in-95 duration-500 shadow-3xl">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Export Production Data</h2>
                <p className="text-gray-500 text-sm mt-1">Copy this to <code>constants.tsx</code> for static deployment.</p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(activeTab === 'blog' ? blogItems : extensionItems, null, 2));
                  alert('Copied! Now paste this into your constants.tsx file.');
                }}
                className="bg-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
              >
                Copy to Clipboard
              </button>
            </div>
            <pre className="bg-black/40 p-8 rounded-3xl h-[450px] overflow-auto font-mono text-[11px] text-blue-400 leading-relaxed scrollbar-thin scrollbar-thumb-gray-700">
              {JSON.stringify(activeTab === 'blog' ? blogItems : extensionItems, null, 2)}
            </pre>
            <div className="mt-8 text-center">
               <button onClick={() => setView('list')} className="text-gray-500 font-bold hover:text-white transition-colors">Return to Dashboard</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCMS;
