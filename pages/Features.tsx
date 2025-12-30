
import React from 'react';

const Features: React.FC = () => {
  const feats = [
    { title: "Privacy Audit", desc: "Every tool is manually vetted for data leaks.", icon: "🛡️" },
    { title: "Ultra Fast", desc: "No heavy scripts, pure performance for your browser.", icon: "⚡" },
    { title: "Open Source Friendly", desc: "We prioritize tools with transparent codebases.", icon: "📂" },
    { title: "No Bloat", desc: "Small footprints that don't consume memory.", icon: "💎" }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Standard of Excellence</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">We set the bar high for what a modern browser extension should be.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {feats.map((f, i) => (
          <div key={i} className="p-8 bg-white border border-gray-100 rounded-[32px] apple-shadow">
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
