
import React, { useState, useRef, useEffect } from 'react';
/* Import Blob from @google/genai to avoid conflict with global browser Blob type */
import { GoogleGenAI, Type, Blob as GenAIBlob } from "@google/genai";
import { BatchItem } from '../types';

const OUTPUT_FORMATS = [
  { id: 'chrome-store', name: 'Chrome Store (16:9)', width: 1280, height: 720 },
  { id: 'instagram-square', name: 'Promo Square (1:1)', width: 1080, height: 1080 },
  { id: 'tiktok-reels', name: 'Reels / Stories (9:16)', width: 1080, height: 1920 },
];

const BatchStudio: React.FC = () => {
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [globalLogo, setGlobalLogo] = useState<string | null>(null);
  const [globalHeadline, setGlobalHeadline] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const activeItem = batch.find(i => i.id === activeId);

  // تحليل الصورة باستخدام Gemini 3 Flash لتحديد نقطة التركيز
  const analyzeImage = async (id: string, base64: string) => {
    try {
      /* Initialize ai with process.env.API_KEY directly */
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        /* Use the correct contents structure: { parts: [ { inlineData: ... }, { text: ... } ] } */
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64.split(',')[1],
              },
            },
            {
              text: "Analyze this browser extension screenshot. Identify the primary UI element or central feature. Return ONLY a JSON object: { \"focalPoint\": { \"x\": 0-100, \"y\": 0-100 }, \"description\": \"brief description\" }",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              focalPoint: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ['x', 'y']
              },
              description: { type: Type.STRING }
            },
            required: ['focalPoint', 'description']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setBatch(prev => prev.map(item => item.id === id ? { ...item, aiAnalysis: data, status: 'ready' } : item));
    } catch (e) {
      console.error("AI Analysis failed:", e);
      setBatch(prev => prev.map(item => item.id === id ? { ...item, status: 'error' } : item));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    if (files.length === 0) return;

    const newItems: BatchItem[] = [];
    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      const id = Math.random().toString(36).substr(2, 9);
      newItems.push({ 
        id, 
        originalImage: base64, 
        aiAnalysis: null, 
        manualFocalPoint: null, 
        status: 'analyzing' 
      });
    }

    setBatch(prev => [...prev, ...newItems]);
    if (!activeId && newItems.length > 0) setActiveId(newItems[0].id);

    // معالجة الصور بالتتابع لتجنب استهلاك الذاكرة
    for (const item of newItems) {
      await analyzeImage(item.id, item.originalImage);
    }
  };

  const drawFrame = (img: HTMLImageElement, format: typeof OUTPUT_FORMATS[0], focalPoint: { x: number; y: number }, logoImg: HTMLImageElement | null): string => {
    const canvas = document.createElement('canvas');
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext('2d')!;

    // 1. القص الذكي بناءً على نقطة التركيز
    const targetAspect = format.width / format.height;
    const sourceAspect = img.width / img.height;
    let sx, sy, sw, sh;

    if (sourceAspect > targetAspect) {
      sh = img.height;
      sw = img.height * targetAspect;
      sy = 0;
      const fx = (focalPoint.x / 100) * img.width;
      sx = Math.max(0, Math.min(img.width - sw, fx - sw / 2));
    } else {
      sw = img.width;
      sh = img.width / targetAspect;
      sx = 0;
      const fy = (focalPoint.y / 100) * img.height;
      sy = Math.max(0, Math.min(img.height - sh, fy - sh / 2));
    }

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, format.width, format.height);
    ctx.filter = 'none';

    // 2. إضافة العنوان مع تأثير الظل الاحترافي
    if (globalHeadline) {
      const fontSize = format.height * 0.07;
      ctx.font = `900 ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 40;
      ctx.fillText(globalHeadline.toUpperCase(), format.width / 2, format.height * 0.15);
    }

    // 3. إضافة الشعار في الركن
    if (logoImg) {
      const lw = format.width * 0.12;
      const lh = (logoImg.height / logoImg.width) * lw;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(logoImg, format.width - lw - 40, format.height - lh - 40, lw, lh);
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const exportAll = async () => {
    if (batch.length === 0) return;
    setIsProcessing(true);
    
    const logoImg = globalLogo ? await new Promise<HTMLImageElement>((resolve) => {
      const i = new Image(); i.onload = () => resolve(i); i.src = globalLogo!;
    }) : null;

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      setProgressMsg(`Processing Image ${i + 1}/${batch.length}...`);
      
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const imgObj = new Image();
        imgObj.onload = () => resolve(imgObj);
        imgObj.src = item.originalImage;
      });

      const point = item.manualFocalPoint || item.aiAnalysis?.focalPoint || { x: 50, y: 50 };

      for (const format of OUTPUT_FORMATS) {
        const dataUrl = drawFrame(img, format, point, logoImg);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `extension_asset_${item.id.substr(0,4)}_${format.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(r => setTimeout(r, 200)); // تأخير بسيط لضمان استقرار المتصفح
      }
    }
    
    setIsProcessing(false);
    setProgressMsg('');
  };

  const handleManualFocal = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBatch(prev => prev.map(item => item.id === activeId ? { ...item, manualFocalPoint: { x, y } } : item));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0A0B0D] text-white flex flex-col md:flex-row rtl" dir="rtl">
      {/* Sidebar Controls */}
      <aside className="w-full md:w-80 bg-black/50 border-l border-white/5 p-8 flex flex-col gap-8 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-500/20">AS</div>
          <h2 className="text-lg font-bold tracking-tight">Asset Studio</h2>
        </div>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pr-2">المظهر العام</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="العنوان البارز..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-blue-500 outline-none transition-all"
              value={globalHeadline}
              onChange={e => setGlobalHeadline(e.target.value)}
            />
            <button 
              onClick={() => logoInputRef.current?.click()}
              className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex flex-col items-center gap-2"
            >
              {globalLogo ? (
                <img src={globalLogo} className="h-8 object-contain" />
              ) : (
                <><span>رفع الشعار (PNG)</span><span className="text-[9px] text-gray-500 font-normal">سيعمل كعلامة مائية</span></>
              )}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pr-2">تعديلات الصورة</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-[10px] mb-2 text-gray-400 font-bold"><span>السطوع</span><span>{brightness}%</span></div>
              <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-2 text-gray-400 font-bold"><span>التباين</span><span>{contrast}%</span></div>
              <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>
        </section>

        <div className="mt-auto pt-6 border-t border-white/5">
          {batch.length > 0 && (
            <button 
              onClick={exportAll}
              disabled={isProcessing}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-gray-700 disabled:grayscale"
            >
              {isProcessing ? progressMsg : `تصدير الكل (${batch.length * 3})`}
            </button>
          )}
          <button onClick={() => setBatch([])} className="w-full py-3 text-[10px] text-gray-600 font-bold hover:text-red-400 transition-colors mt-2">مسح جميع الصور</button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-grow p-6 md:p-12 overflow-y-auto">
        {batch.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-20 border-2 border-dashed border-white/10 rounded-[48px] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
            >
              <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform">📸</div>
              <h1 className="text-4xl font-black mb-4 tracking-tighter">استوديو صناعة الأصول</h1>
              <p className="text-slate-500 max-w-sm mx-auto font-medium">ارفع حتى 10 صور لشاشات الإضافات لتوليد أصول متجر Chrome ومنصات التواصل فوراً.</p>
              <div className="mt-10 px-8 py-4 bg-white/5 rounded-2xl text-xs font-bold text-blue-400 inline-block">اختر ملفات PNG / JPG</div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-1">منصة التعديل</h2>
                <p className="text-slate-500 text-sm">{batch.length} صور في الطابور</p>
              </div>
              {isProcessing && (
                <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 px-6 py-3 rounded-2xl">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-blue-400">{progressMsg}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* Active Preview Area */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-white/5 p-4 rounded-[40px] border border-white/5 shadow-2xl">
                   <div className="relative aspect-video bg-black rounded-[32px] overflow-hidden cursor-crosshair group" onClick={handleManualFocal}>
                      <img src={activeItem?.originalImage} className="w-full h-full object-contain" />
                      
                      {/* Focal Point Indicator */}
                      <div className="absolute w-14 h-14 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md shadow-2xl pointer-events-none transition-all duration-300"
                           style={{ 
                             left: `${activeItem?.manualFocalPoint?.x ?? activeItem?.aiAnalysis?.focalPoint.x ?? 50}%`, 
                             top: `${activeItem?.manualFocalPoint?.y ?? activeItem?.aiAnalysis?.focalPoint.y ?? 50}%` 
                           }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                         <p className="text-[10px] font-black uppercase text-white/60 tracking-widest text-center">انقر لتعديل نقطة التركيز يدوياً</p>
                      </div>
                   </div>
                </div>
                
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                   <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">تحليل الذكاء الاصطناعي</h4>
                      <p className="text-sm text-slate-400 font-medium">
                        {activeItem?.status === 'analyzing' ? 'جاري تحديد العناصر المهمة بواسطة Gemini...' : (activeItem?.aiAnalysis?.description || 'تم تحديد نقطة التركيز يدوياً.')}
                      </p>
                   </div>
                   {activeItem?.status === 'ready' && <div className="text-green-500 bg-green-500/10 px-4 py-2 rounded-xl text-[10px] font-black">AI OPTIMIZED</div>}
                </div>
              </div>

              {/* Format List */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pr-2">تنسيقات التصدير</h4>
                <div className="grid grid-cols-1 gap-4">
                   {OUTPUT_FORMATS.map(f => (
                     <div key={f.id} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-5 group hover:bg-white/[0.08] transition-colors">
                        <div className="w-16 h-16 bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center text-[10px] font-black text-blue-500">
                           {f.id === 'instagram-square' ? '1:1' : f.id === 'tiktok-reels' ? '9:16' : '16:9'}
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-200 mb-0.5">{f.name}</p>
                           <p className="text-[10px] text-slate-500 font-medium">{f.width} × {f.height} px</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Bottom Batch Strip */}
            <div className="pt-10 border-t border-white/5">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 pr-2">طابور المعالجة الجماعية</h4>
              <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
                {batch.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveId(item.id)}
                    className={`relative w-40 aspect-square rounded-[32px] overflow-hidden cursor-pointer border-4 transition-all flex-shrink-0 ${activeId === item.id ? 'border-blue-600 scale-105 shadow-2xl shadow-blue-600/20' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
                  >
                    <img src={item.originalImage} className="w-full h-full object-cover" />
                    {item.status === 'analyzing' && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {item.status === 'ready' && (
                      <div className="absolute top-3 left-3 bg-green-500 w-3 h-3 rounded-full border-2 border-black shadow-lg"></div>
                    )}
                  </div>
                ))}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-40 aspect-square rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-blue-500 hover:border-blue-500/50 transition-all cursor-pointer flex-shrink-0 group"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">+</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">إضافة صور</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Inputs المخفية */}
      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" multiple />
      <input type="file" ref={logoInputRef} onChange={e => {
        const file = e.target.files?.[0];
        if (file) {
          const r = new FileReader();
          r.onload = (ev) => setGlobalLogo(ev.target?.result as string);
          r.readAsDataURL(file);
        }
      }} className="hidden" accept="image/*" />
    </div>
  );
};

export default BatchStudio;
