
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
import { GoogleGenAI } from "@google/genai";

type ContentType = 'blog' | 'extension';
type AdminView = 'dashboard' | 'list' | 'edit' | 'auto-gen' | 'keywords' | 'audit';

interface KeywordMetric {
  keyword: string;
  intent: 'Informational' | 'Commercial' | 'Transactional';
  difficulty: number;
  score: number;
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

  const [view, setView] = useState<AdminView>('dashboard');
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [status, setStatus] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' });
  const [seoKeyword, setSeoKeyword] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [seoAuditResult, setSeoAuditResult] = useState<string | null>(null);

  // Simulated Tracked Keywords
  const [trackedKeywords] = useState<KeywordMetric[]>([
    { keyword: 'best chrome extensions 2025', intent: 'Commercial', difficulty: 45, score: 88 },
    { keyword: 'privacy tools for browser', intent: 'Informational', difficulty: 32, score: 92 },
    { keyword: 'uBlock origin guide', intent: 'Informational', difficulty: 12, score: 75 },
  ]);

  useEffect(() => {
    localStorage.setItem('cms_blog_posts', JSON.stringify(blogItems));
    localStorage.setItem('cms_extensions', JSON.stringify(extensionItems));
  }, [blogItems, extensionItems]);

  useEffect(() => {
    const fetchStats = () => setAnalyticsData(JSON.parse(localStorage.getItem('et_analytics') || '[]'));
    fetchStats();
    const inv = setInterval(fetchStats, 2000);
    return () => clearInterval(inv);
  }, []);

  const realStats = useMemo(() => {
    const now = new Date();
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const pageViews = analyticsData.filter(e => e.type === 'view').length;
    const installs = analyticsData.filter(e => e.type === 'install').length;
    const liveNow = analyticsData.filter(e => (e.type === 'view' || e.type === 'click') && new Date(e.timestamp) > fiveMinsAgo).length;
    return { pageViews, installs, liveNow };
  }, [analyticsData]);

  const calculateSeoScore = (item: any) => {
    if (!item) return 0;
    let score = 0;
    if (item.title?.length > 40) score += 20;
    if (item.content?.length > 1000) score += 30;
    if (item.image) score += 20;
    if (item.excerpt?.length > 100) score += 20;
    if (item.category) score += 10;
    return score;
  };

  const runSeoAudit = async () => {
    if (!currentEditItem) return;
    setStatus({ loading: true, message: 'Analyzing Content for SEO... 🔍' });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as an SEO Expert like Rank Math. Audit this article title: "${currentEditItem.title}" and content preview: "${currentEditItem.content?.substring(0, 1000)}". List 3 specific improvements for better Google ranking. Use simple English.`
      });
      setSeoAuditResult(response.text || "No insights found.");
      setStatus({ loading: false, message: '' });
    } catch (e) {
      console.error(e);
      setStatus({ loading: false, message: 'Audit failed.' });
    }
  };

  const performFullAutoMagic = async () => {
    if (!seoKeyword) return alert("Please enter a target keyword");
    
    setStatus({ loading: true, message: 'Researching SEO Strategy... 🤖' });
    try {
      const apiKey = process.env.API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      
      setStatus({ loading: true, message: 'Generating Rank-Ready Content... ✍️' });
      const textRes = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a professional SEO article for "${seoKeyword}". Include h2 tags, a compelling intro, and a conclusion. JSON format: { "title": "...", "content": "...", "excerpt": "...", "readTime": "...", "imgPrompt": "..." }`,
        config: { responseMimeType: "application/json" }
      });
      
      const rawText = textRes.text;
      if (!rawText) throw new Error("AI returned empty content");
      const data = JSON.parse(rawText);
      
      setStatus({ loading: true, message: 'Creating Visual Asset... 🎨' });
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.imgPrompt || `High-quality modern technology hero image for ${data.title}`,
      });

      // SAFE NULL CHECK FOR TS ERROR RESOLUTION
      if (imgResponse?.candidates && imgResponse.candidates.length > 0) {
        const candidate = imgResponse.candidates[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part?.inlineData?.data) {
              setGeneratedImageBase64(`data:image/png;base64,${part.inlineData.data}`);
            }
          }
        }
      }

      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        readTime: data.readTime,
        category: "Tech Analysis",
        image: '', 
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      });
      
      setStatus({ loading: false, message: '' });
      setView('edit'); 
    } catch (e) {
      console.error(e);
      setStatus({ loading: false, message: 'System Error. Check Console.' });
    }
  };

  const handleSave = () => {
    if (!currentEditItem) return;
    const items = activeTab === 'blog' ? [...blogItems] : [...extensionItems];
    const idx = items.findIndex(i => i.id === currentEditItem.id);
    if (idx !== -1) {
      items[idx] = currentEditItem;
    } else {
      items.unshift(currentEditItem);
    }
    if (activeTab === 'blog') setBlogItems(items as BlogPost[]);
    else setExtensionItems(items as Extension[]);
    setView('list');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Premium Glass Sidebar */}
      <aside className="w-80 bg-slate-950 text-white flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-10 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">ET</div>
          <h2 className="font-black text-xl tracking-tighter">SEO HUB</h2>
        </div>
        
        <nav className="flex-grow p-8 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600 shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>📊 Dashboard</span>
          </button>
          
          <button onClick={() => setView('keywords')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'keywords' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>🔑 Keywords</span>
          </button>

          <div className="h-px bg-white/5 my-6"></div>
          
          <div className="px-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Content Strategy</p>
            <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-white/5'}`}>📄 Articles</button>
            <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-white/5'}`}>🧩 Directory</button>
          </div>

          <div className="absolute bottom-10 left-8 right-8">
            <button onClick={() => setView('auto-gen')} className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-xs shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
              🪄 MAGIC GENERATOR
            </button>
          </div>
        </nav>
      </aside>

      {/* Modern Main Content Area */}
      <main className="flex-grow ml-80 p-16">
        
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-12 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">SEO Performance</h1>
                <p className="text-slate-400 text-lg font-medium">Rank Math status: <span className="text-green-500 font-bold">Excellent</span></p>
              </div>
              <div className="flex gap-4">
                 <div className="bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Avg Score</p>
                    <p className="text-2xl font-black text-blue-600">84/100</p>
                 </div>
              </div>
            </header>
            
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Total Clicks', val: realStats.pageViews, color: 'text-slate-900' },
                { label: 'Conversions', val: realStats.installs, color: 'text-blue-600' },
                { label: 'Active Sessions', val: realStats.liveNow, color: 'text-red-500' },
                { label: 'Rankings', val: '12', color: 'text-green-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">{stat.label}</p>
                  <span className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8">Top Keyword Trends</h3>
              <div className="space-y-6">
                 {trackedKeywords.map((kw, i) => (
                   <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                      <div className="flex items-center gap-6">
                        <div className={`w-3 h-3 rounded-full ${kw.score > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="font-bold text-lg text-slate-700">{kw.keyword}</span>
                        <span className="text-[10px] bg-slate-200 px-3 py-1 rounded-full font-black text-slate-500">{kw.intent}</span>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Difficulty</p>
                            <p className="font-black text-slate-700">{kw.difficulty}%</p>
                         </div>
                         <div className="w-16 h-16 rounded-full border-4 border-blue-600 flex items-center justify-center font-black text-blue-600 text-sm">
                            {kw.score}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {view === 'keywords' && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-8">
             <header className="mb-12">
                <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Keyword Intelligence</h1>
                <p className="text-slate-400 text-xl">Monitor your search engine footprint and discover new opportunities.</p>
             </header>
             <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full">
                   <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <th className="px-10 py-6 text-left">Keyword</th>
                         <th className="px-10 py-6 text-center">Intent</th>
                         <th className="px-10 py-6 text-center">Diff</th>
                         <th className="px-10 py-6 text-center">Volume</th>
                         <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {trackedKeywords.map((k, i) => (
                        <tr key={i}>
                           <td className="px-10 py-8 font-black text-slate-900 text-lg">{k.keyword}</td>
                           <td className="px-10 py-8 text-center">
                              <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black">{k.intent}</span>
                           </td>
                           <td className="px-10 py-8 text-center font-bold">{k.difficulty}</td>
                           <td className="px-10 py-8 text-center font-bold">~2.4k</td>
                           <td className="px-10 py-8 text-right">
                              <button className="text-blue-600 font-bold hover:underline">Details</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'list' && (
          <div className="max-w-6xl">
            <header className="flex justify-between items-center mb-16">
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{activeTab === 'blog' ? 'Articles' : 'Directory'}</h1>
              <div className="flex gap-4">
                <button onClick={() => setView('auto-gen')} className="bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black text-sm shadow-xl hover:scale-105 transition-all">🪄 AI Generation</button>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
              {(activeTab === 'blog' ? blogItems : extensionItems).map((item: any) => (
                <div key={item.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] overflow-hidden flex items-center justify-center text-4xl shadow-inner border border-slate-100">
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.icon || '📄'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">{item.title || item.name}</h3>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-600 uppercase">SEO SCORE:</span>
                            <span className="font-black text-blue-600">{calculateSeoScore(item)}%</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="px-10 py-4 bg-slate-950 text-white font-black text-xs rounded-2xl hover:bg-blue-600 transition-all">Manage</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center mb-16">
               <div className="flex items-center gap-6">
                  <button onClick={() => setView('list')} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all">←</button>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Content Editor</h1>
               </div>
               <div className="flex gap-4">
                  <button onClick={handleSave} className="px-12 py-5 bg-blue-600 text-white font-black text-sm rounded-[24px] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all">Publish Content</button>
               </div>
            </header>

            <div className="grid grid-cols-12 gap-12">
              <div className="col-span-8 space-y-10">
                <div className="bg-white p-14 rounded-[56px] border border-slate-50 shadow-sm space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-4">Focus Title</label>
                    <input className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] font-black text-4xl outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-4">HTML Semantic Content</label>
                    <textarea className="w-full p-12 bg-slate-50 border border-slate-100 rounded-[48px] h-[700px] font-mono text-sm leading-relaxed outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="col-span-4 space-y-8">
                 {/* Rank Math Scorer */}
                 <div className="bg-white p-10 rounded-[48px] border-2 border-blue-50 shadow-2xl shadow-blue-100/20 space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                       <h3 className="font-black text-sm text-slate-900 uppercase">Rank Math Scoring</h3>
                       <div className="w-16 h-16 rounded-full border-[6px] border-blue-600 flex items-center justify-center text-blue-600 font-black text-lg">
                          {calculateSeoScore(currentEditItem)}
                       </div>
                    </div>
                    <ul className="space-y-4">
                       <li className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-400">Title length (40-60 chars)</span>
                          <span className={currentEditItem.title?.length > 40 ? 'text-green-500' : 'text-red-400'}>{currentEditItem.title?.length || 0}</span>
                       </li>
                       <li className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-400">Content length (>1000 words)</span>
                          <span className={currentEditItem.content?.length > 1000 ? 'text-green-500' : 'text-red-400'}>{currentEditItem.content?.length || 0}</span>
                       </li>
                       <li className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-400">Featured Image</span>
                          <span className={currentEditItem.image ? 'text-green-500' : 'text-red-400'}>{currentEditItem.image ? 'YES' : 'MISSING'}</span>
                       </li>
                    </ul>
                    <button 
                      onClick={runSeoAudit}
                      className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                       {status.loading ? 'ANALYZING...' : 'RUN AI SEO AUDIT'}
                    </button>
                    {seoAuditResult && (
                      <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100 text-[11px] font-bold text-yellow-800 italic leading-relaxed">
                        ✨ {seoAuditResult}
                      </div>
                    )}
                 </div>

                 <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest text-center">Featured Asset</h3>
                    <div className="aspect-video bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                        {currentEditItem.image ? (
                          <img src={currentEditItem.image} className="w-full h-full object-cover" />
                        ) : generatedImageBase64 ? (
                          <img src={generatedImageBase64} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-5xl grayscale opacity-10">🖼️</span>
                        )}
                    </div>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-[10px] text-blue-600 text-center" placeholder="Direct Image URL" value={currentEditItem.image} onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} />
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-indigo-200">🪄</div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter">AI Growth Engine</h1>
              <p className="text-slate-500 font-medium text-xl max-w-lg mx-auto">Generate high-converting, SEO-optimized articles in seconds.</p>
            </div>

            <div className="bg-white p-14 rounded-[64px] border border-slate-100 shadow-2xl space-y-10">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">Focus Keyword</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="e.g., best privacy extensions chrome" 
                    className="flex-grow px-10 py-8 bg-slate-50 border border-slate-100 rounded-[32px] text-2xl font-bold outline-none focus:bg-white focus:ring-[12px] focus:ring-blue-50 transition-all"
                    value={seoKeyword} 
                    onChange={e => setSeoKeyword(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && performFullAutoMagic()}
                  />
                  <button 
                    onClick={performFullAutoMagic} 
                    disabled={status.loading}
                    className="px-14 py-8 bg-slate-950 text-white font-black rounded-[32px] shadow-2xl hover:scale-105 transition-all disabled:bg-slate-200"
                  >
                    {status.loading ? 'Researching...' : 'Build Article'}
                  </button>
                </div>
              </div>

              {status.loading && (
                <div className="flex flex-col items-center gap-6 py-6 animate-in fade-in">
                  <div className="w-14 h-14 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-2xl text-indigo-600 animate-pulse">{status.message}</p>
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
