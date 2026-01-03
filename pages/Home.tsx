
import React, { useState, useMemo } from 'react';
import { Extension } from '../types';
import ExtensionCard from '../components/ExtensionCard';
import Newsletter from '../components/Newsletter';

interface HomeProps {
  extensions: Extension[];
  onSelect: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ extensions, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

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
  }, [searchQuery, activeCategory, extensions]);

  return (
    <div className="animate-in fade-in duration-1000">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Professional Extension Directory
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter mb-8 leading-[0.9]">
            Optimize your <span className="text-indigo-600">browsing</span> power.
          </h1>
          <p className="text-xl text-gray-500 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
            Hand-picked collection of high-performance browser tools. Verified for privacy, vetted for speed, curated for you.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Search by name, utility, or category..."
              className="w-full pl-16 pr-8 py-6 bg-gray-50 border border-gray-100 rounded-[32px] focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all text-gray-900 font-bold placeholder:text-gray-400 apple-shadow text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 border-b border-gray-50 pb-10">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-indigo-50/50 px-5 py-2.5 rounded-2xl border border-indigo-100">
             <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
             <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">
               {filteredExtensions.length} Verified Tools
             </p>
          </div>
        </div>

        {filteredExtensions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredExtensions.map(ext => (
              <ExtensionCard 
                key={ext.id} 
                extension={ext} 
                onClick={() => onSelect(ext.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50 rounded-[64px] border-2 border-dashed border-gray-200">
            <div className="text-7xl mb-6">🔍</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Search yielded no results</h3>
            <p className="text-gray-500 font-medium">Refine your keywords or explore a different category.</p>
            <button 
              onClick={() => {setSearchQuery(''); setActiveCategory('All');}}
              className="mt-8 text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      <Newsletter />
    </div>
  );
};

export default Home;
