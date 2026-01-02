
import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Extension } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

type ContentType = 'blog' | 'extension';
type AdminView = 'dashboard' | 'list' | 'edit' | 'auto-gen' | 'keywords';

interface KeywordMetric {
  keyword: string;
  intent: 'Informational' | 'Commercial' | 'Transactional';
  difficulty: number;
  score: number;
  volume: string;
  competition: 'Low' | 'Medium' | 'High';
}

const AdminCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('blog');
  const [blogItems, setBlogItems] = useState<BlogPost[]>([]);
  const [extensionItems, setExtensionItems] = useState<Extension[]>([]);

  const [view, setView] = useState<AdminView>('dashboard');
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [status, setStatus] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' });
  const [seoKeyword, setSeoKeyword] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [seoAuditResult, setSeoAuditResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [trackedKeywords] = useState<KeywordMetric[]>([
    { keyword: 'Best Chrome extensions 2025', intent: 'Commercial', difficulty: 45, score: 88, volume: '12.5k', competition: 'High' },
    { keyword: 'Browser privacy protection', intent: 'Informational', difficulty: 32, score: 92, volume: '8.2k', competition: 'Medium' },
    { keyword: 'Download uBlock Origin', intent: 'Transactional', difficulty: 12, score: 75, volume: '45k', competition: 'Low' },
    { keyword: 'Browser speed extensions', intent: 'Informational', difficulty: 55, score: 64, volume: '5.1k', competition: 'High' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        const [blogResponse, extensionsResponse] = await Promise.all([
          fetch('/api/blog'),
          fetch('/api/extensions')
        ]);
        if (!blogResponse.ok || !extensionsResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const blogData = await blogResponse.json();
        const extensionsData = await extensionsResponse.json();
        setBlogItems(blogData);
        setExtensionItems(extensionsData);
      } catch (error) {
        console.error("Failed to fetch CMS data:", error);
        setError("Failed to load content. Please try again later.");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchStats = () => setAnalyticsData(JSON.parse(localStorage.getItem('et_analytics') || '[]'));
    fetchStats();
    const inv = setInterval(fetchStats, 2000);
    return () => clearInterval(inv);
  }, []);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => ({
      name: day,
      views: Math.floor(Math.random() * 800) + 300,
      installs: Math.floor(Math.random() * 150) + 40,
      active: Math.floor(Math.random() * 200) + 50,
    }));
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
    return Math.min(score, 100);
  };

  const runSeoAudit = async () => {
    if (!currentEditItem) return;
    setStatus({ loading: true, message: 'Analyzing content programmatically... 🔍' });
    try {
      const response = await fetch('/api/seo-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: currentEditItem.title, content: currentEditItem.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to run SEO audit');
      }

      const data = await response.json();
      setSeoAuditResult(data.auditResult || "No insights found.");
    } catch (e) {
      setSeoAuditResult("Audit failed. Please try again.");
    } finally {
      setStatus({ loading: false, message: '' });
    }
  };

  const performFullAutoMagic = async () => {
    if (!seoKeyword) return alert("Please enter a keyword first.");
    
    setStatus({ loading: true, message: 'Studying content strategy... 🤖' });
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: seoKeyword }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();

      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title || "New Title",
        content: data.content || "",
        excerpt: data.excerpt || "",
        readTime: data.readTime || "5 min",
        category: "Tech Analysis",
        image: '', 
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      });
      
      setStatus({ loading: false, message: '' });
      setView('edit'); 
    } catch (e) {
      console.error("AutoMagic Error:", e);
      setStatus({ loading: false, message: 'An error occurred in the intelligent system.' });
      setError("Failed to generate content. Please try again later.");
    }
  };

  const handleSave = async () => {
    if (!currentEditItem) return;

    const items = activeTab === 'blog' ? [...blogItems] : [...extensionItems];
    const idx = items.findIndex(i => i.id === currentEditItem.id);
    if (idx !== -1) items[idx] = currentEditItem;
    else items.unshift(currentEditItem);

    const endpoint = activeTab === 'blog' ? '/api/blog' : '/api/extensions';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(items),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      if (activeTab === 'blog') setBlogItems(items as BlogPost[]);
      else setExtensionItems(items as Extension[]);

      setView('list');

    } catch (error) {
      console.error("Save failed:", error);
      setError("Failed to save data. Please try again later.");
    }
  };
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 text-white flex flex-col fixed inset-y-0 left-0 z-30 shadow-2xl">
        <div className="p-10 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">ET</div>
          <h2 className="font-black text-xl tracking-tight">SEO Center</h2>
        </div>
        
        <nav className="flex-grow p-8 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>📊 General Stats</span>
          </button>
          <button onClick={() => setView('keywords')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${view === 'keywords' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <span>🔑 Keywords</span>
          </button>
          <div className="h-px bg-white/5 my-6"></div>
          <div className="px-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Content Management</p>
            <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-white/5'}`}>📄 Articles</button>
            <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-white/5'}`}>🧩 Extensions</button>
          </div>
          <div className="absolute bottom-10 left-8 right-8">
            <button onClick={() => setView('auto-gen')} className={`w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-xs shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2`}>
              🪄 Smart Content Generator
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-grow ml-80 p-16 overflow-y-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-12 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">Statistics Dashboard</h1>
                <p className="text-slate-400 text-lg font-medium">Detailed tracking of user activity and content performance.</p>
              </div>
              <div className="bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-sm text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase">Average SEO Score</p>
                 <p className="text-2xl font-black text-blue-600">84/100</p>
              </div>
            </header>
            
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Total Visits', val: realStats.pageViews, color: 'text-slate-900' },
                { label: 'Installations', val: realStats.installs, color: 'text-blue-600' },
                { label: 'Live Sessions', val: realStats.liveNow, color: 'text-red-500' },
                { label: 'Top Keywords', val: '12', color: 'text-green-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">{stat.label}</p>
                  <span className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
               <div className="col-span-8 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-xl font-black text-slate-900">Weekly Activity</h3>
                     <div className="flex gap-4 text-[10px] font-black">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-full"></div> Visits</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-200 rounded-full"></div> Installations</span>
                     </div>
                  </div>
                  <div className="h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                           <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                           <YAxis axisLine={false} tickLine={false} />
                           <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} />
                           <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                           <Area type="monotone" dataKey="installs" stroke="#cbd5e1" strokeWidth={2} fill="transparent" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="col-span-4 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                  <h3 className="text-xl font-black text-slate-900 mb-8 w-full text-left">Real-time Activity Distribution</h3>
                  <div className="h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.slice(0, 5)}>
                           <XAxis dataKey="name" hide />
                           <Tooltip contentStyle={{ borderRadius: '15px', border: 'none' }} />
                           <Bar dataKey="active" radius={[10, 10, 10, 10]}>
                              {chartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#6366f1'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <p className="mt-6 text-sm font-bold text-slate-400 text-center leading-relaxed">Data shows increased interaction during mid-week periods.</p>
               </div>
            </div>
          </div>
        )}

        {view === 'keywords' && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-8">
             <header className="mb-12">
                <h1 className="text-5xl font-black text-slate-900 mb-4">Keyword Intelligence Center</h1>
                <p className="text-slate-400 text-xl font-medium">Advanced system for tracking competition and search volume.</p>
             </header>
             <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <th className="px-10 py-6">Keyword</th>
                         <th className="px-10 py-6 text-center">Intent</th>
                         <th className="px-10 py-6 text-center">SEO Difficulty</th>
                         <th className="px-10 py-6 text-center">Competition</th>
                         <th className="px-10 py-6 text-center">Search Volume</th>
                         <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {trackedKeywords.map((k, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                           <td className="px-10 py-8 font-black text-slate-900 text-lg">{k.keyword}</td>
                           <td className="px-10 py-8 text-center">
                              <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black">{k.intent}</span>
                           </td>
                           <td className="px-10 py-8 text-center font-bold text-slate-600">{k.difficulty}%</td>
                           <td className="px-10 py-8 text-center">
                              <span className={`px-4 py-2 rounded-full text-xs font-black ${
                                 k.competition === 'Low' ? 'bg-green-50 text-green-600' :
                                 k.competition === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                                 'bg-red-50 text-red-600'
                              }`}>
                                 {k.competition}
                              </span>
                           </td>
                           <td className="px-10 py-8 text-center font-bold text-slate-900">{k.volume}</td>
                           <td className="px-10 py-8 text-right">
                              <button className="text-blue-600 font-bold hover:underline">Analyze</button>
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
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">{activeTab === 'blog' ? 'Articles' : 'Extensions'}</h1>
              <div className="flex gap-4">
                <button onClick={() => setView('auto-gen')} className="bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black text-sm shadow-xl hover:scale-105 transition-all">🪄 Generate Smart Content</button>
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
                            <span className="text-[10px] font-black text-blue-600 uppercase">SEO Score:</span>
                            <span className="font-black text-blue-600">{calculateSeoScore(item)}%</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="px-10 py-4 bg-slate-950 text-white font-black text-xs rounded-2xl hover:bg-blue-600 transition-all">Edit</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center mb-16">
               <div className="flex items-center gap-6">
                  <button onClick={() => setView('list')} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all">→</button>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">Content Editor</h1>
               </div>
               <div className="flex gap-4">
                  <button onClick={handleSave} className="px-12 py-5 bg-blue-600 text-white font-black text-sm rounded-[24px] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all">Save and Publish</button>
               </div>
            </header>
            <div className="grid grid-cols-12 gap-12">
              <div className="col-span-8 space-y-10">
                <div className="bg-white p-14 rounded-[56px] border border-slate-50 shadow-sm space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-4">Title</label>
                    <input className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] font-black text-4xl outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-4">Content</label>
                    <textarea className="w-full p-12 bg-slate-50 border border-slate-100 rounded-[48px] h-[700px] font-mono text-sm leading-relaxed outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="col-span-4 space-y-8">
                 <div className="bg-white p-10 rounded-[48px] border-2 border-blue-50 shadow-2xl shadow-blue-100/20 space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                       <h3 className="font-black text-sm text-slate-900 uppercase">SEO Score</h3>
                       <div className="w-16 h-16 rounded-full border-[6px] border-blue-600 flex items-center justify-center text-blue-600 font-black text-lg">
                          {calculateSeoScore(currentEditItem)}
                       </div>
                    </div>
                    <button onClick={runSeoAudit} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                       {status.loading ? 'Analyzing...' : 'SEO Audit'}
                    </button>
                    {seoAuditResult && (
                      <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100 text-[11px] font-bold text-yellow-800 italic leading-relaxed text-left">
                        ✨ {seoAuditResult}
                      </div>
                    )}
                 </div>
                 <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest text-center">Media</h3>
                    <div className="aspect-video bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                        {currentEditItem.image || generatedImageBase64 ? (
                          <img src={currentEditItem.image || (generatedImageBase64 as string)} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-5xl grayscale opacity-10">🖼️</span>
                        )}
                    </div>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-[10px] text-blue-600 text-center" placeholder="Image URL" value={currentEditItem.image} onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} />
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-indigo-200">🪄</div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tight">Growth Engine</h1>
              <p className="text-slate-500 font-medium text-xl max-w-lg mx-auto">Generate professional articles with a single click.</p>
            </div>
            <div className="bg-white p-14 rounded-[64px] border border-slate-100 shadow-2xl space-y-10">
              <div className="space-y-4 text-left">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">Keyword</label>
                <div className="flex gap-4">
                  <input type="text" placeholder="e.g., Best Chrome extensions for privacy" className="flex-grow px-10 py-8 bg-slate-50 border border-slate-100 rounded-[32px] text-2xl font-bold outline-none focus:bg-white transition-all" value={seoKeyword} onChange={e => setSeoKeyword(e.target.value)} />
                  <button onClick={performFullAutoMagic} disabled={status.loading} className="px-14 py-8 bg-slate-950 text-white font-black rounded-[32px] shadow-2xl hover:scale-105 transition-all disabled:bg-slate-200">
                    {status.loading ? 'Working...' : 'Generate'}
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
