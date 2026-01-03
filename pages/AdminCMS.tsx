
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BlogPost, Extension, BatchItem } from '../types';
import { BLOG_POSTS as STATIC_POSTS, EXTENSIONS as STATIC_EXTENSIONS } from '../constants';
// Removed unused and conflicting Blob import from @google/genai
import { GoogleGenAI, Type } from "@google/genai";
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
type AdminView = 'dashboard' | 'list' | 'edit' | 'auto-gen' | 'keywords' | 'asset-studio';

interface KeywordMetric {
  keyword: string;
  intent: 'Informational' | 'Commercial' | 'Transactional';
  difficulty: number;
  score: number;
  volume: string;
  competition: 'Low' | 'Medium' | 'High';
}

const OUTPUT_FORMATS = [
  { id: 'chrome-store', name: 'Chrome Store (16:9)', width: 1280, height: 720 },
  { id: 'instagram-square', name: 'Promo Square (1:1)', width: 1080, height: 1080 },
  { id: 'tiktok-reels', name: 'Reels / Stories (9:16)', width: 1080, height: 1920 },
];

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

  // Asset Studio State
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [globalLogo, setGlobalLogo] = useState<string | null>(null);
  const [globalHeadline, setGlobalHeadline] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [trackedKeywords] = useState<KeywordMetric[]>([
    { keyword: 'best chrome extensions 2025', intent: 'Commercial', difficulty: 45, score: 88, volume: '12.5k', competition: 'High' },
    { keyword: 'browser privacy tools', intent: 'Informational', difficulty: 32, score: 92, volume: '8.2k', competition: 'Medium' },
    { keyword: 'uBlock Origin download', intent: 'Transactional', difficulty: 12, score: 75, volume: '45k', competition: 'Low' },
    { keyword: 'productivity add-ons chrome', intent: 'Informational', difficulty: 55, score: 64, volume: '5.1k', competition: 'High' },
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
    if ((item.title || item.name)?.length > 40) score += 20;
    if (item.content?.length > 1000) score += 30;
    if (item.image) score += 20;
    if (item.excerpt?.length > 100) score += 20;
    if (item.category) score += 10;
    return Math.min(score, 100);
  };

  const runSeoAudit = async () => {
    if (!currentEditItem) return;
    setStatus({ loading: true, message: 'Analyzing content with AI... 🔍' });
    try {
      // Fix: Proper initialization of GoogleGenAI using Named Parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a professional SEO expert. Analyze this title: "${currentEditItem.title}" and content snippet: "${currentEditItem.content?.substring(0, 1000)}". Provide 3 specific tips in English to improve Google ranking.`
      });
      setSeoAuditResult(response.text || "No insights found.");
      setStatus({ loading: false, message: '' });
    } catch (e) {
      setStatus({ loading: false, message: 'Audit failed.' });
    }
  };

  const performFullAutoMagic = async () => {
    if (!seoKeyword) return alert("Please enter a target keyword.");
    
    setStatus({ loading: true, message: 'Studying content strategy... 🤖' });
    try {
      // Fix: Proper initialization of GoogleGenAI using Named Parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      setStatus({ loading: true, message: 'Generating professional article... ✍️' });
      const textRes = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Write a professional SEO article about "${seoKeyword}". Output as JSON: { "title": "...", "content": "...", "excerpt": "...", "readTime": "...", "imgPrompt": "..." }`,
        config: { responseMimeType: "application/json" }
      });
      
      const rawText = textRes.text;
      if (!rawText) throw new Error("Empty AI response");
      const data = JSON.parse(rawText);
      
      setStatus({ loading: true, message: 'Designing cover image... 🎨' });
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: data.imgPrompt || `A high-quality tech editorial image about ${data.title}` }]
        },
      });

      if (imgResponse?.candidates?.[0]?.content?.parts) {
        for (const part of imgResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImageBase64(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }

      setCurrentEditItem({
        id: `post-${Date.now()}`,
        title: data.title || "New Title",
        content: data.content || "",
        excerpt: data.excerpt || "",
        readTime: data.readTime || "5 min read",
        category: "Industry Analysis",
        image: '', 
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      });
      
      setStatus({ loading: false, message: '' });
      setView('edit'); 
    } catch (e) {
      console.error("AutoMagic Error:", e);
      setStatus({ loading: false, message: 'AI generation failed.' });
    }
  };

  const handleSave = () => {
    if (!currentEditItem) return;
    const items = activeTab === 'blog' ? [...blogItems] : [...extensionItems];
    const idx = items.findIndex(i => i.id === currentEditItem.id);
    if (idx !== -1) items[idx] = currentEditItem;
    else items.unshift(currentEditItem);
    
    if (activeTab === 'blog') setBlogItems(items as BlogPost[]);
    else setExtensionItems(items as Extension[]);
    setView('list');
  };

  // Asset Studio Logic
  const analyzeImage = async (id: string, base64: string) => {
    try {
      // Fix: Proper initialization of GoogleGenAI using Named Parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      // Fix: Cast imagePart as any to bypass SDK-global Blob type shadowing conflict
      const imagePart: any = { inlineData: { mimeType: 'image/png', data: base64Data || '' } };
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            imagePart,
            { text: "Analyze this browser extension screenshot. Identify the primary UI element. Return JSON: { \"focalPoint\": { \"x\": 0-100, \"y\": 0-100 }, \"description\": \"...\" }" }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              focalPoint: {
                type: Type.OBJECT,
                properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
                required: ['x', 'y']
              },
              description: { type: Type.STRING }
            },
            required: ['focalPoint', 'description']
          }
        }
      });
      const data = JSON.parse(response.text || '{}') as any;
      setBatch(prev => prev.map(item => item.id === id ? { ...item, aiAnalysis: data, status: 'ready' } : item));
    } catch (e) {
      setBatch(prev => prev.map(item => item.id === id ? { ...item, status: 'error' } : item));
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    const newItems: BatchItem[] = [];
    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      const id = Math.random().toString(36).substr(2, 9);
      newItems.push({ id, originalImage: base64, aiAnalysis: null, manualFocalPoint: null, status: 'analyzing' });
    }
    setBatch(prev => [...prev, ...newItems]);
    if (!activeBatchId && newItems.length > 0) setActiveBatchId(newItems[0].id);
    for (const item of newItems) { await analyzeImage(item.id, item.originalImage); }
  };

  const drawFrame = (img: HTMLImageElement, format: typeof OUTPUT_FORMATS[0], focalPoint: { x: number; y: number }, logoImg: HTMLImageElement | null): string => {
    const canvas = document.createElement('canvas');
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext('2d')!;
    const targetAspect = format.width / format.height;
    const sourceAspect = img.width / img.height;
    let sx, sy, sw, sh;
    if (sourceAspect > targetAspect) {
      sh = img.height; sw = img.height * targetAspect; sy = 0;
      sx = Math.max(0, Math.min(img.width - sw, (focalPoint.x / 100) * img.width - sw / 2));
    } else {
      sw = img.width; sh = img.width / targetAspect; sx = 0;
      sy = Math.max(0, Math.min(img.height - sh, (focalPoint.y / 100) * img.height - sh / 2));
    }
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, format.width, format.height);
    ctx.filter = 'none';
    if (globalHeadline) {
      ctx.font = `900 ${format.height * 0.07}px Inter, sans-serif`;
      ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 40;
      ctx.fillText(globalHeadline.toUpperCase(), format.width / 2, format.height * 0.15);
    }
    if (logoImg) {
      const lw = format.width * 0.12; const lh = (logoImg.height / logoImg.width) * lw;
      ctx.globalAlpha = 0.9; ctx.drawImage(logoImg, format.width - lw - 40, format.height - lh - 40, lw, lh);
    }
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const exportAll = async () => {
    setIsProcessing(true);
    const logoImg = globalLogo ? await new Promise<HTMLImageElement>((resolve) => {
      const i = new Image(); i.onload = () => resolve(i); i.src = globalLogo!;
    }) : null;
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i]; setProgressMsg(`Processing ${i + 1}/${batch.length}...`);
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const o = new Image(); o.onload = () => resolve(o); o.src = item.originalImage;
      });
      const point = item.manualFocalPoint || item.aiAnalysis?.focalPoint || { x: 50, y: 50 };
      for (const format of OUTPUT_FORMATS) {
        const dataUrl = drawFrame(img, format, point, logoImg);
        const link = document.createElement('a'); link.href = dataUrl;
        link.download = `asset_${item.id.substr(0,4)}_${format.id}.jpg`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        await new Promise(r => setTimeout(r, 200));
      }
    }
    setIsProcessing(false); setProgressMsg('');
  };

  const activeBatchItem = batch.find(i => i.id === activeBatchId);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-slate-900 font-sans" dir="ltr">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 text-white flex flex-col fixed inset-y-0 left-0 z-30 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">ET</div>
          <h2 className="font-bold text-lg tracking-tight">Console</h2>
        </div>
        
        <nav className="flex-grow p-6 space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 mt-4 px-4">Overview</p>
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <span className="text-lg">📊</span> Dashboard
          </button>
          <button onClick={() => setView('keywords')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${view === 'keywords' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <span className="text-lg">🔑</span> Keyword Studio
          </button>

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 mt-8 px-4">Management</p>
          <button onClick={() => {setActiveTab('blog'); setView('list');}} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${activeTab === 'blog' && view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
             <span className="text-lg">📄</span> Articles
          </button>
          <button onClick={() => {setActiveTab('extension'); setView('list');}} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${activeTab === 'extension' && view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
             <span className="text-lg">🧩</span> Extensions
          </button>

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 mt-8 px-4">Internal Tools</p>
          <button onClick={() => setView('asset-studio')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${view === 'asset-studio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
             <span className="text-lg">🎨</span> Asset Studio
          </button>

          <div className="absolute bottom-8 left-6 right-6">
            <button onClick={() => setView('auto-gen')} className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-black text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
              🪄 Content Engine
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-grow ml-72 p-12 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-6xl space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Analytics Overview</h1>
                <p className="text-slate-400 font-medium">Real-time performance metrics for ExtensionTo.</p>
              </div>
              <div className="flex gap-4">
                 <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg. SEO Score</p>
                    <p className="text-xl font-black text-blue-600">84/100</p>
                 </div>
              </div>
            </header>
            
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Total Page Views', val: realStats.pageViews.toLocaleString(), trend: '+12%', color: 'text-slate-900' },
                { label: 'Store Installs', val: realStats.installs.toLocaleString(), trend: '+5%', color: 'text-blue-600' },
                { label: 'Live Users', val: realStats.liveNow.toLocaleString(), trend: 'Live', color: 'text-red-500' },
                { label: 'Top 10 Keywords', val: '14', trend: '+2', color: 'text-emerald-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 2 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-500'}`}>{stat.trend}</span>
                  </div>
                  <span className={`text-4xl font-black tracking-tight ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
               <div className="col-span-8 bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-lg font-black text-slate-900">Traffic Acquisition</h3>
                     <div className="flex gap-4 text-[10px] font-black">
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div> Page Views</span>
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-200 rounded-full"></div> Installs</span>
                     </div>
                  </div>
                  <div className="h-[320px]">
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
                           <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                           <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                           <Area type="monotone" dataKey="installs" stroke="#cbd5e1" strokeWidth={2} fill="transparent" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="col-span-4 bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center">
                  <h3 className="text-lg font-black text-slate-900 mb-6 w-full">Activity Distribution</h3>
                  <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.slice(0, 5)}>
                           <XAxis dataKey="name" hide />
                           <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                           <Bar dataKey="active" radius={[6, 6, 6, 6]}>
                              {chartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#6366f1'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-[11px] font-medium text-slate-500 leading-relaxed text-center">
                    Traffic peaks are observed during midweek, suggesting professional usage.
                  </div>
               </div>
            </div>
          </div>
        )}

        {view === 'asset-studio' && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-4">
             <header className="mb-10 flex justify-between items-center">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 mb-2">Asset Studio</h1>
                   <p className="text-slate-400 font-medium">Bulk process screenshots into promotional materials.</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => fileInputRef.current?.click()} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-xs">UPLOAD SOURCE</button>
                   {batch.length > 0 && <button onClick={exportAll} disabled={isProcessing} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs">{isProcessing ? progressMsg : 'EXPORT ALL'}</button>}
                </div>
             </header>

             <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-8">
                   <div className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm relative aspect-video overflow-hidden group" onClick={(e) => {
                       if (!activeBatchId) return;
                       const rect = e.currentTarget.getBoundingClientRect();
                       const x = ((e.clientX - rect.left) / rect.width) * 100;
                       const y = ((e.clientY - rect.top) / rect.height) * 100;
                       setBatch(prev => prev.map(i => i.id === activeBatchId ? { ...i, manualFocalPoint: { x, y } } : i));
                   }}>
                      {activeBatchItem ? (
                        <>
                          <img src={activeBatchItem.originalImage} className="w-full h-full object-contain" />
                          <div className="absolute w-8 h-8 border-2 border-blue-600 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-xl" style={{ left: `${activeBatchItem.manualFocalPoint?.x ?? activeBatchItem.aiAnalysis?.focalPoint.x ?? 50}%`, top: `${activeBatchItem.manualFocalPoint?.y ?? activeBatchItem.aiAnalysis?.focalPoint.y ?? 50}%` }}></div>
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-300 font-bold">Select an image to edit</div>
                      )}
                   </div>
                   <div className="flex gap-4 overflow-x-auto pb-4">
                      {batch.map(item => (
                        <div key={item.id} onClick={() => setActiveBatchId(item.id)} className={`w-24 aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 flex-shrink-0 transition-all ${activeBatchId === item.id ? 'border-blue-600 shadow-lg' : 'border-transparent opacity-60'}`}>
                           <img src={item.originalImage} className="w-full h-full object-cover" />
                        </div>
                      ))}
                   </div>
                </div>

                <div className="col-span-4 space-y-6">
                   <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Appearance</h3>
                      <input type="text" placeholder="Global Headline..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:bg-white" value={globalHeadline} onChange={e => setGlobalHeadline(e.target.value)} />
                      <button onClick={() => logoInputRef.current?.click()} className="w-full py-6 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 hover:border-blue-200 hover:text-blue-500 transition-all">
                         {globalLogo ? <img src={globalLogo} className="h-8 mx-auto" /> : 'UPLOAD BRAND LOGO'}
                      </button>
                   </div>
                   <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Enhancements</h3>
                      <div className="space-y-4">
                         <div className="flex justify-between text-[10px] font-black"><label>BRIGHTNESS</label><span>{brightness}%</span></div>
                         <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full accent-blue-600" />
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between text-[10px] font-black"><label>CONTRAST</label><span>{contrast}%</span></div>
                         <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full accent-blue-600" />
                      </div>
                   </div>
                </div>
             </div>
             <input type="file" ref={fileInputRef} onChange={handleBatchUpload} className="hidden" accept="image/*" multiple />
             <input type="file" ref={logoInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setGlobalLogo(ev.target?.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
          </div>
        )}

        {view === 'keywords' && (
          <div className="max-w-6xl animate-in slide-in-from-bottom-6">
             <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Keyword Studio</h1>
                <p className="text-slate-400 font-medium">Research and track high-intent search terms.</p>
             </header>
             <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <th className="px-8 py-5">Target Keyword</th>
                         <th className="px-8 py-5">Search Intent</th>
                         <th className="px-8 py-5 text-center">Difficulty</th>
                         <th className="px-8 py-5 text-center">Competition</th>
                         <th className="px-8 py-5 text-center">Volume</th>
                         <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {trackedKeywords.map((k, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                           <td className="px-8 py-6 font-bold text-slate-900">{k.keyword}</td>
                           <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                 k.intent === 'Informational' ? 'bg-blue-50 text-blue-600' :
                                 k.intent === 'Commercial' ? 'bg-amber-50 text-amber-600' :
                                 'bg-emerald-50 text-emerald-600'
                              }`}>{k.intent}</span>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                 <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${k.difficulty}%` }}></div>
                                 </div>
                                 <span className="text-xs font-bold text-slate-600">{k.difficulty}%</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${
                                 k.competition === 'Low' ? 'bg-emerald-50 text-emerald-600' :
                                 k.competition === 'Medium' ? 'bg-amber-50 text-amber-600' :
                                 'bg-rose-50 text-rose-600'
                              }`}>
                                 {k.competition}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-center font-bold text-slate-900">{k.volume}</td>
                           <td className="px-8 py-6 text-right">
                              <button className="text-blue-600 text-xs font-black hover:underline">ANALYZE</button>
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
            <header className="flex justify-between items-center mb-12">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{activeTab === 'blog' ? 'Articles' : 'Extensions'}</h1>
              <button onClick={() => setView('auto-gen')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl hover:scale-105 transition-all">🪄 NEW WITH AI</button>
            </header>
            <div className="grid grid-cols-1 gap-4">
              {(activeTab === 'blog' ? blogItems : extensionItems).map((item: any) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.icon || '📄'}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 mb-1">{item.title || item.name}</h3>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                         <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                         <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">SEO: {calculateSeoScore(item)}%</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setCurrentEditItem({...item}); setView('edit'); }} className="px-6 py-3 bg-slate-950 text-white font-black text-[10px] rounded-xl hover:bg-blue-600 transition-all uppercase tracking-widest">Edit</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'edit' && currentEditItem && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center mb-12">
               <div className="flex items-center gap-4">
                  <button onClick={() => setView('list')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all">←</button>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Content Editor</h1>
               </div>
               <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white font-black text-xs rounded-2xl shadow-xl hover:bg-blue-700 transition-all">PUBLISH CHANGES</button>
            </header>
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-8 space-y-8">
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Article Title</label>
                    <input className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-3xl outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.title} onChange={e => setCurrentEditItem({...currentEditItem, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Body Content (Supports HTML)</label>
                    <textarea className="w-full p-8 bg-slate-50 border border-slate-100 rounded-3xl h-[600px] font-mono text-sm leading-relaxed outline-none focus:bg-white focus:border-blue-500 transition-all" value={currentEditItem.content} onChange={e => setCurrentEditItem({...currentEditItem, content: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="col-span-4 space-y-6">
                 <div className="bg-white p-8 rounded-[32px] border-2 border-blue-50 shadow-xl shadow-blue-100/20 space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">SEO Health</h3>
                       <div className="w-14 h-14 rounded-full border-[4px] border-blue-600 flex items-center justify-center text-blue-600 font-black text-sm">
                          {calculateSeoScore(currentEditItem)}
                       </div>
                    </div>
                    <button onClick={runSeoAudit} className="w-full py-4 bg-slate-950 text-white rounded-xl font-black text-[10px] hover:bg-blue-600 transition-all uppercase tracking-[0.1em]">
                       {status.loading ? 'ANALYZING...' : 'RUN AI AUDIT'}
                    </button>
                    {seoAuditResult && (
                      <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-[11px] font-medium text-amber-800 italic leading-relaxed">
                        ✨ {seoAuditResult}
                      </div>
                    )}
                 </div>
                 <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                    <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Visual Assets</h3>
                    <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden">
                        {currentEditItem.image || generatedImageBase64 ? (
                          <img src={currentEditItem.image || (generatedImageBase64 as string)} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl opacity-20">🖼️</span>
                        )}
                    </div>
                    <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px] text-blue-600 text-center" placeholder="Direct Image URL" value={currentEditItem.image} onChange={e => setCurrentEditItem({...currentEditItem, image: e.target.value})} />
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === 'auto-gen' && (
          <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700 pt-10 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner border border-blue-200">🪄</div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">Content Engine</h1>
              <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto">Generate high-ranking SEO articles and optimized graphics in seconds.</p>
            </div>
            <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl space-y-8">
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Keyword</label>
                <div className="flex gap-4">
                  <input type="text" placeholder="e.g., Best Productivity Extensions 2025" className="flex-grow px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" value={seoKeyword} onChange={e => setSeoKeyword(e.target.value)} />
                  <button onClick={performFullAutoMagic} disabled={status.loading} className="px-10 py-5 bg-slate-950 text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">
                    {status.loading ? '...' : 'GENERATE'}
                  </button>
                </div>
              </div>
              {status.loading && (
                <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in">
                  <div className="w-10 h-10 border-[4px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-sm text-blue-600 tracking-widest uppercase">{status.message}</p>
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
