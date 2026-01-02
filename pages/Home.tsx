
import React, { useState, useMemo, useEffect } from 'react';
import ExtensionCard from '../components/ExtensionCard';
import Newsletter from '../components/Newsletter';
import { Extension } from '../types';

interface HomeProps {
  onSelect: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ onSelect }) => {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const response = await fetch('/api/extensions');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setExtensions(data);
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };

    fetchExtensions();
  }, []);

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(extensions.map(ext => ext.category))];
    return cats;
  }, [extensions]);

  const filteredExtensions = useMemo(() => {
    return extensions.filter(ext => {
      const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ext.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || ext.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [extensions, searchQuery, activeCategory]);

  return (
    <div className="animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Curated Hub for Power-Users
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-[1.1]">
            Elevate your <span className="text-blue-600">digital</span> workflow.
          </h1>
          <p className="text-xl text-gray-500 mb-12 leading-relaxed max-w-2xl mx-auto font-normal">
            A hand-picked directory of the world's most powerful browser extensions. Verified for security, optimized for speed.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Search extensions by name or feature..."
              className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400 apple-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Categories & Grid Section */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 border-b border-gray-50 pb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat 
                  ? 'bg-gray-900 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full"></span>
             <p className="text-sm font-semibold text-gray-400">
               {filteredExtensions.length} Verified extensions available
             </p>
          </div>
        </div>

        {filteredExtensions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExtensions.map(ext => (
              <ExtensionCard 
                key={ext.id} 
                extension={ext} 
                onClick={() => onSelect(ext.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No extensions found</h3>
            <p className="text-gray-500">Try searching for something else or clear your filters.</p>
            <button 
              onClick={() => {setSearchQuery(''); setActiveCategory('All');}}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Privacy First</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Every extension listed on ExtensionTo adheres to our strict "No Data Collection" policy. Your data never leaves your device.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Lightweight</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Built for efficiency. Our extensions are optimized to run without consuming excessive CPU or memory.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Verified</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Curated and tested by senior developers. No malware, no bloatware, just pure utility.</p>
            </div>
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
};

export default Home;
