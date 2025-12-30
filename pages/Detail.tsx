
import React from 'react';
import { Extension } from '../types';

interface DetailProps {
  extension: Extension;
  onBack: () => void;
}

const Detail: React.FC<DetailProps> = ({ extension, onBack }) => {
  const handleAddToChrome = () => {
    window.open(extension.storeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-blue-600 mb-12 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Store
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
              <div className="w-32 h-32 bg-gray-50 rounded-3xl flex items-center justify-center text-7xl shadow-sm border border-gray-100">
                {extension.icon}
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-4xl font-extrabold text-gray-900">{extension.name}</h1>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">Verified</span>
                </div>
                <p className="text-xl text-gray-500 mb-6 font-medium">{extension.shortDescription}</p>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-6">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</span>
                     <span className="font-bold text-gray-900">{extension.rating} ★</span>
                   </div>
                   <div className="w-px h-8 bg-gray-100 hidden sm:block"></div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Users</span>
                     <span className="font-bold text-gray-900">{extension.users}</span>
                   </div>
                   <div className="w-px h-8 bg-gray-100 hidden sm:block"></div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
                     <span className="font-bold text-gray-900">{extension.category}</span>
                   </div>
                </div>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {extension.longDescription}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extension.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Screenshots</h2>
              <div className="aspect-video bg-gray-100 rounded-3xl flex items-center justify-center border border-gray-200">
                <span className="text-gray-400 font-medium italic">Preview rendering optimized for your screen...</span>
              </div>
            </section>
          </div>

          {/* Sidebar / Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div className="p-8 bg-white border border-gray-100 rounded-[32px] apple-shadow">
                <button 
                  onClick={handleAddToChrome}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mb-4"
                >
                  Add to Chrome
                </button>
                <p className="text-[10px] text-center text-gray-400 font-medium">Compatible with Chrome, Edge, and Brave.</p>
                
                <div className="mt-8 pt-6 border-t border-gray-50 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Version</span>
                    <span className="text-gray-900 font-semibold">{extension.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Updated</span>
                    <span className="text-gray-900 font-semibold">{extension.lastUpdated}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Size</span>
                    <span className="text-gray-900 font-semibold">{extension.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Language</span>
                    <span className="text-gray-900 font-semibold">English</span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[32px]">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Privacy Commitment</h4>
                <p className="text-xs text-blue-700 leading-relaxed mb-4">
                  This extension does not collect your data, browser history, or personal information. Fully compliant with ExtensionTo Privacy Standards.
                </p>
                <a href="#privacy" className="text-xs font-bold text-blue-600 hover:underline">View Privacy Policy →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
