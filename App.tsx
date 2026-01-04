
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Blog from './pages/Blog';
import BlogPostDetail from './pages/BlogPostDetail';
import Features from './pages/Features';
import Compliance from './pages/Compliance';
import Security from './pages/Security';
import Contact from './pages/Contact';
import Help from './pages/Help';
import ReportAbuse from './pages/ReportAbuse';
import AdminCMS from './AdminCMS';
import { EXTENSIONS as STATIC_EXTENSIONS, BLOG_POSTS as STATIC_POSTS } from './constants';
import { PageType, BlogPost, Extension } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedExtensionId, setSelectedExtensionId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // CRITICAL: Cache Busting & Version Enforcement for Professional CMS v3.1
  useEffect(() => {
    const CURRENT_VERSION = 'v3.1.0-PRO';
    const storedVersion = localStorage.getItem('et_app_version');

    if (storedVersion !== CURRENT_VERSION) {
      console.warn(`[System] Version mismatch: ${storedVersion} -> ${CURRENT_VERSION}. Purging legacy schemas.`);
      // Only clear CMS related legacy keys to preserve critical settings but force fresh UI/Data structure
      localStorage.removeItem('cms_active_tab');
      localStorage.setItem('et_app_version', CURRENT_VERSION);
    }

    // Force refresh if visiting CMS to ensure latest assets
    if (window.location.hash === '#cms') {
      const lastSession = localStorage.getItem('et_last_cms_session');
      if (!lastSession || Date.now() - parseInt(lastSession) > 600000) { // 10 min throttle
        localStorage.setItem('et_last_cms_session', Date.now().toString());
      }
    }
  }, []);

  const allPosts = useMemo(() => {
    const saved = localStorage.getItem('cms_blog_posts');
    return saved ? JSON.parse(saved) : STATIC_POSTS;
  }, [currentPage]); 

  const allExtensions = useMemo(() => {
    const saved = localStorage.getItem('cms_extensions');
    return saved ? JSON.parse(saved) : STATIC_EXTENSIONS;
  }, [currentPage]);

  const visiblePosts = useMemo(() => {
    return allPosts.filter((post: BlogPost) => {
      if (!post.publishDate) return true;
      return new Date(post.publishDate).getTime() <= Date.now();
    });
  }, [allPosts]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      
      if (hash.startsWith('#detail/')) {
        setSelectedExtensionId(hash.replace('#detail/', ''));
        setCurrentPage('detail');
      } else if (hash.startsWith('#blog/')) {
        setSelectedPostId(hash.replace('#blog/', ''));
        setCurrentPage('blog-post');
      } else if (hash === '#blog') {
        setCurrentPage('blog');
      } else if (hash === '#cms') {
        setCurrentPage('cms');
      } else if (hash === '#privacy') {
        setCurrentPage('privacy');
      } else if (hash === '#terms') {
        setCurrentPage('terms');
      } else if (hash === '#features') {
        setCurrentPage('features');
      } else if (hash === '#contact') {
        setCurrentPage('contact');
      } else if (hash === '#help') {
        setCurrentPage('help');
      } else if (hash === '#report-abuse') {
        setCurrentPage('report-abuse');
      } else if (hash === '#security') {
        setCurrentPage('security');
      } else if (hash === '#compliance') {
        setCurrentPage('compliance');
      } else {
        setCurrentPage('home');
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-600/10 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // INDEPENDENT ROUTE: The Professional Command Center
  if (currentPage === 'cms') {
    return <AdminCMS onExit={() => navigateTo('#home')} />;
  }

  const selectedExtension = allExtensions.find((e: Extension) => e.id === selectedExtensionId);
  const selectedPost = visiblePosts.find((p: BlogPost) => p.id === selectedPostId);

  return (
    <Layout onNavigate={navigateTo} currentPage={currentPage}>
      {currentPage === 'home' && (
        <Home extensions={allExtensions} onSelect={(id) => navigateTo(`#detail/${id}`)} />
      )}
      {currentPage === 'detail' && selectedExtension && (
        <Detail extension={selectedExtension} onBack={() => navigateTo('#home')} />
      )}
      {currentPage === 'blog' && (
        <Blog posts={visiblePosts} onPostSelect={(id) => navigateTo(`#blog/${id}`)} />
      )}
      {currentPage === 'blog-post' && selectedPost && (
        <BlogPostDetail post={selectedPost} onBack={() => navigateTo('#blog')} />
      )}
      {currentPage === 'privacy' && <Privacy />}
      {currentPage === 'terms' && <Terms />}
      {currentPage === 'features' && <Features />}
      {currentPage === 'contact' && <Contact />}
      {currentPage === 'help' && <Help />}
      {currentPage === 'report-abuse' && <ReportAbuse />}
      {currentPage === 'compliance' && <Compliance />}
      {currentPage === 'security' && <Security />}
    </Layout>
  );
};

export default App;
