
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

const trackEvent = (type: 'view' | 'click' | 'install', metadata?: any) => {
  const stats = JSON.parse(localStorage.getItem('et_analytics') || '[]');
  stats.push({
    type,
    path: window.location.hash,
    timestamp: new Date().toISOString(),
    ...metadata
  });
  if (stats.length > 3000) stats.shift();
  localStorage.setItem('et_analytics', JSON.stringify(stats));
};

const App: React.FC = () => {
  // ====== إجبار المتصفح على تحميل النسخة الجديدة ======
  useEffect(() => {
    const minVersion = 'v3.0';
    const savedVersion = localStorage.getItem('cms_build_version');

    if (!savedVersion || !savedVersion.startsWith(minVersion)) {
      localStorage.setItem('cms_build_version', minVersion);
      // إعادة التحميل الكاملة مع كسر الـ Cache
      window.location.replace(window.location.href.split('#')[0] + '#cms?v=' + Date.now());
    }
  }, []);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedExtensionId, setSelectedExtensionId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Content Loading (Synchronized with AdminCMS)
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
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateSEO = (title: string, description: string) => {
      document.title = `${title} | ExtensionTo Hub`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    };

    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      trackEvent('view');

      if (hash.startsWith('#detail/')) {
        const id = hash.replace('#detail/', '');
        const ext = allExtensions.find((e: Extension) => e.id === id);
        if (ext) {
          updateSEO(ext.name, ext.shortDescription);
        }
        setSelectedExtensionId(id);
        setCurrentPage('detail');
      } else if (hash.startsWith('#blog/')) {
        const id = hash.replace('#blog/', '');
        const post = visiblePosts.find((p: BlogPost) => p.id === id);
        if (post) {
          updateSEO(post.title, post.excerpt);
          setSelectedPostId(id);
          setCurrentPage('blog-post');
        } else {
          window.location.hash = '#blog';
        }
      } else if (hash === '#blog') {
        updateSEO('The Journal', 'Professional browser extension guides and privacy news.');
        setCurrentPage('blog');
      } else if (hash === '#cms') {
        updateSEO('System Command Center', 'Administrative dashboard.');
        setCurrentPage('cms');
      } else if (hash === '#privacy') {
        updateSEO('Privacy Policy', 'Our commitment to your security.');
        setCurrentPage('privacy');
      } else if (hash === '#terms') {
        updateSEO('Terms of Service', 'Platform usage guidelines.');
        setCurrentPage('terms');
      } else if (hash === '#features') {
        updateSEO('Standard of Excellence', 'Why professionals choose ExtensionTo.');
        setCurrentPage('features');
      } else if (hash === '#contact') {
        updateSEO('Contact Support', 'Human-to-human support.');
        setCurrentPage('contact');
      } else if (hash === '#help') {
        updateSEO('Help Center', 'Extension knowledge base.');
        setCurrentPage('help');
      } else if (hash === '#report-abuse') {
        updateSEO('Safety First', 'Report malicious content.');
        setCurrentPage('report-abuse');
      } else {
        updateSEO('Premium Extensions', 'Curated, high-performance browser tools.');
        setCurrentPage('home');
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [visiblePosts, allExtensions]);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentPage === 'cms') {
    return <AdminCMS onExit={() => navigateTo('#home')} />;
  }

  const selectedExtension = allExtensions.find((e: Extension) => e.id === selectedExtensionId);
  const selectedPost = visiblePosts.find((p: BlogPost) => p.id === selectedPostId);

  return (
    <Layout onNavigate={navigateTo} currentPage={currentPage}>
      {currentPage === 'home' && (
        <Home
          extensions={allExtensions}
          onSelect={(id) => navigateTo(`#detail/${id}`)}
        />
      )}
      {currentPage === 'detail' && selectedExtension && (
        <Detail
          extension={selectedExtension}
          onBack={() => navigateTo('#home')}
        />
      )}
      {currentPage === 'blog' && (
        <Blog
          posts={visiblePosts}
          onPostSelect={(id) => navigateTo(`#blog/${id}`)}
        />
      )}
      {currentPage === 'blog-post' && selectedPost && (
        <BlogPostDetail
          post={selectedPost}
          onBack={() => navigateTo('#blog')}
        />
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
