
import React, { useState, useMemo } from 'react';
import { BlogPost } from '../types';

interface BlogProps {
  posts: BlogPost[];
  onPostSelect: (id: string) => void;
}

const Blog: React.FC<BlogProps> = ({ posts, onPostSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    return ['All', ...new Set(posts.map(post => post.category))];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, posts]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            The <span className="text-blue-600">Journal</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Expert guides, privacy news, and deep dives into the browser ecosystem.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search articles..."
              className="pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-12">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeCategory === cat 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
              : 'bg-white border border-gray-100 text-gray-500 hover:border-blue-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredPosts.map((post) => {
            const isImageUrl = post.image.startsWith('http');
            
            return (
              <article 
                key={post.id} 
                onClick={() => onPostSelect(post.id)}
                className="group cursor-pointer flex flex-col h-full bg-white border border-gray-100 p-6 rounded-[32px] apple-shadow transition-all"
              >
                <div className="aspect-[16/10] bg-gray-50 rounded-2xl mb-6 overflow-hidden flex items-center justify-center text-5xl group-hover:scale-[1.02] transition-transform">
                  {isImageUrl ? (
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    post.image
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.1em]">{post.category}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{post.readTime}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 leading-snug">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">{post.date}</span>
                  <span className="text-xs font-bold text-blue-600">Read Article →</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
          <p className="text-gray-400 font-medium italic">No articles matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Blog;
