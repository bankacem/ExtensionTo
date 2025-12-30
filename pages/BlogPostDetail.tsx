
import React from 'react';
import { BlogPost } from '../types';

interface BlogPostDetailProps {
  post: BlogPost;
  onBack: () => void;
}

const BlogPostDetail: React.FC<BlogPostDetailProps> = ({ post, onBack }) => {
  const isImageUrl = post.image.startsWith('http');

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-blue-600 mb-12 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Blog
      </button>

      <header className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-widest">{post.category}</span>
          <span className="text-gray-400 text-xs font-medium">{post.date}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400 text-xs font-medium">{post.readTime}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight">
          {post.title}
        </h1>
        
        {isImageUrl ? (
          <div className="w-full h-[400px] rounded-[40px] overflow-hidden shadow-2xl shadow-blue-100/50">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-[21/9] bg-gray-50 rounded-[40px] flex items-center justify-center text-8xl shadow-inner">
            {post.image}
          </div>
        )}
      </header>

      {/* Article Content Area */}
      <div 
        className="prose prose-slate lg:prose-xl max-w-none prose-img:rounded-[32px] prose-img:shadow-lg prose-h2:text-3xl prose-h2:font-black"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <footer className="mt-16 pt-12 border-t border-gray-100 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Enjoyed this article?</h3>
        <p className="text-gray-500 mb-8">Share it with your colleagues or subscribe for more extension insights.</p>
        <div className="flex justify-center gap-4">
          <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">Share on X</button>
          <button className="px-6 py-3 bg-white text-gray-900 border border-gray-200 font-bold rounded-2xl hover:bg-gray-50 transition-all">Copy Link</button>
        </div>
      </footer>
    </div>
  );
};

export default BlogPostDetail;
