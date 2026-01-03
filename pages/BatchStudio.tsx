
import React, { useState, useRef, useEffect } from 'react';
/* Import Blob from @google/genai as per guidelines. Shadowing global Blob is intentional for SDK compatibility. */
import { GoogleGenAI, Type, Blob } from "@google/genai";
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

  const analyzeImage = async (id: string, base64: string) => {
    try {
      const apiKey = process.env.API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

      /* Satisfy InlineDataPart structure using @google/genai Blob type directly */
      const imagePart = {
        inlineData: {
          mimeType: 'image/png',
          data: base64Data || ''
        }
      };

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

      // Use the safe getter provided by the SDK
      const textOutput = response.text;
      if (!textOutput) throw new Error("No text response from AI");
      
      /* Casting JSON.parse output to specific type to avoid 'unknown' assignment issues */
      const data = JSON.parse(textOutput) as {
        focalPoint: { x: number; y: number };
        description: string;
      };
      
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
    if (batch.length === 0) return;
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0A0B0D] text-white flex flex-col md:flex-row rtl" dir="rtl">
      <aside className="w-full md:w-80 bg-black/50 border-l border-white/5 p-8 flex flex-col gap-8 overflow-y-auto">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">AS</div><h2 className="text-lg font-bold">Asset Studio</h2></div>
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">المظهر العام</h3>
          <div className="space-y-4">
            <input type="text" placeholder="العنوان..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none" value={globalHeadline} onChange={e => setGlobalHeadline(e.target.value)} />
            <button onClick={() => logoInputRef.current?.click()} className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-xl text-xs flex flex-col items-center gap-2">
              {globalLogo ? <img src={globalLogo} className="h-8 object-contain" /> : <span>رفع الشعار</span>}
            </button>
          </div>
        </section>
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">تعديلات</h3>
          <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full accent-blue-500" />
          <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full accent-blue-500" />
        </section>
        <div className="mt-auto">
          {batch.length > 0 && <button onClick={exportAll} disabled={isProcessing} className="w-full py-5 bg-blue-600 font-black rounded-2xl">{isProcessing ? progressMsg : `تصدير الكل`}</button>}
        </div>
      </aside>
      <main className="flex-grow p-12 overflow-y-auto">
        {batch.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="p-20 border-2 border-dashed border-white/10 rounded-[48px] hover:border-blue-500/50">
              <h1 className="text-4xl font-black mb-4">ارفع الصور هنا</h1>
              <p className="text-slate-500">لتبدأ المعالجة الذكية فوراً</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="relative aspect-video bg-black rounded-[32px] overflow-hidden border border-white/5" onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const x = ((e.clientX - rect.left) / rect.width) * 100;
               const y = ((e.clientY - rect.top) / rect.height) * 100;
               setBatch(prev => prev.map(i => i.id === activeId ? { ...i, manualFocalPoint: { x, y } } : i));
            }}>
              <img src={activeItem?.originalImage} className="w-full h-full object-contain" />
              <div className="absolute w-10 h-10 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${activeItem?.manualFocalPoint?.x ?? activeItem?.aiAnalysis?.focalPoint.x ?? 50}%`, top: `${activeItem?.manualFocalPoint?.y ?? activeItem?.aiAnalysis?.focalPoint.y ?? 50}%` }}></div>
            </div>
            <div className="flex gap-4 overflow-x-auto">
              {batch.map(item => (
                <div key={item.id} onClick={() => setActiveId(item.id)} className={`w-32 aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 ${activeId === item.id ? 'border-blue-600' : 'border-transparent'}`}><img src={item.originalImage} className="w-full h-full object-cover" /></div>
              ))}
            </div>
          </div>
        )}
      </main>
      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" multiple />
      <input type="file" ref={logoInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setGlobalLogo(ev.target?.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
    </div>
  );
};

export default BatchStudio;
